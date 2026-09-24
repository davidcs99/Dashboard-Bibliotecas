# Plan arquitectónico: ETL de BD origen (Postgres) → DWH (Azure SQL) → Dashboard

## 0. Objetivo

Este documento resume todo lo investigado sobre la base de datos origen del sistema de
bibliotecas virtuales de la UCACUE, y define el plan para migrar esa información a un
almacén de datos propio en Azure SQL, que este dashboard (Next.js) consumirá directamente
en lugar del CSV estático que usa hoy (`biblio_datos_limpios.csv`).

**Principio guía: no agregar complejidad que este proyecto no necesita.** Es un solo
dashboard, no una plataforma multi-equipo — por eso el diseño evita cosas como
historización tipo SCD2, un data warehouse en capas (staging/ODS/DW) o streaming en
tiempo real. Se usa: extracción incremental simple, un puñado de tablas de catálogo, una
tabla de hechos, y una vista de consumo.

---

## 1. Cómo funciona el proyecto HOY (para entender qué hay que reemplazar)

El dashboard es una app Next.js que:

1. Lee `biblio_datos_limpios.csv` (17 columnas, separador `;`) desde disco.
2. Lo parsea y agrega en memoria (Node.js) en
   [`src/lib/server/dashboard-analytics-service.ts`](src/lib/server/dashboard-analytics-service.ts) —
   ahí se calculan KPIs, tendencias mensuales, top recursos, uso por rol, etc.
3. Cachea el resultado agregado en `.cache/dashboard-analytics.json` para no reprocesar el
   CSV en cada request (el CSV actual tiene ~918k filas).
4. Expone esos datos vía rutas API (`src/app/api/dashboard/*`), consumidas por hooks
   (`src/hooks/use-*-query.ts`) que alimentan los componentes de gráficos
   (`src/components/charts/*`, `src/components/dashboard/*`).
5. Los filtros (año, mes, sede, carrera, etc.) se aplican sobre el mismo array de
   registros en memoria (`matchesDashboardFilters` en el servicio de analítica).

**Lo único que cambia con este plan:** el paso 1 (leer CSV) se reemplaza por una consulta
a una vista en Azure SQL. El resto de la lógica de agregación puede seguir igual al
principio (para minimizar riesgo), y migrarse a SQL más adelante solo si el volumen lo
justifica.

El *shape* de cada registro que consume hoy el servicio de analítica
(`LibraryUsageRecord`, definido en las líneas 19-37 de ese archivo) es el contrato que la
vista de consumo nueva debe replicar:

```
fecha, identificacion, nombre, cargo, carrera, modalidad, tipoAcceso, ua, sede,
operacion, busqueda, recurso, tipoRecurso, anio, mes
```

---

## 2. La base de datos origen (Postgres, acceso vía túnel SSH)

### 2.1 Tablas que SÍ entran al ETL

| Tabla | Filas (real) | Rango de fechas | Rol |
|---|---|---|---|
| `log_uso` | 2,094,794 | 2024-01-01 → hoy | **Tabla de hechos principal.** Cada fila es un evento (acceso a recurso, búsqueda o login histórico) |
| `log_sesion` | 71,968 | 2026-03-24 → hoy | **Tabla de hechos de login**, complementaria a `log_uso` desde la fecha de corte |
| `recurso` | 99 | — | Catálogo de recursos (nombre, categoría, tipo de acceso, estado) |
| `categoria` | 9 | — | Catálogo de categorías de recurso (lo que el CSV llamaba `tipo_recurso`) |
| `area` / `recurso_area` | 11 / 143 | — | Área temática del recurso — **fuera de alcance para el primer corte**, pero se trae igual porque no cuesta nada y puede habilitar un filtro nuevo más adelante |

### 2.2 Tablas que NO entran al ETL (son de administración de la app, no de analítica)

- `users` (21 filas) — cuentas de administradores de la aplicación (email/password/role_id). **No es** un catálogo maestro de usuarios de biblioteca.
- `guest_invite` (2 filas) — invitaciones de acceso de invitados.
- `permisos_usuarios` (47 filas) — permisos por ruta de la app.
- `rol` (3 filas) — roles de la app (ADMIN/LIBRARIAN/USER), no relacionado con `cargo`.
- `log_uso_backup_antes_correccion` (2,056,606 filas) — respaldo de `log_uso` previo a una corrección masiva que se hizo en algún momento. Es un backup de seguridad, no una fuente viva. Se ignora salvo que en el futuro se quiera auditar qué cambió.

**Conclusión clave:** no existe un catálogo maestro de identidad de usuarios (alumnos/
docentes/personal). La única fuente de esos datos es la propia `log_uso`/`log_sesion`,
donde vienen repetidos en cada fila (denormalizados). Por eso `dim_usuario` se construye
deduplicando desde ahí, no uniendo contra una tabla maestra.

---

## 3. Reglas de negocio y de calidad de datos descubiertas (críticas para el ETL)

Esto es lo que un ETL "ingenuo" (solo copiar tablas) se perdería, y por eso hay que
codificarlo explícitamente:

### 3.1 Resolución de `tipo_recurso` (categoría) — NO usar `id_recurso` como vía principal

| Campo | % de filas pobladas (de 2,094,794) | ¿Confiable como llave? |
|---|---|---|
| `id_recurso` | 2% (42,893) | Sí, pero solo cubre el 2% de la historia |
| `tipo_recurso` (texto libre) | 50% (1,046,311) | Parcial |
| `nombre_recurso` (texto libre) | **99.4% (2,082,729)** | **Sí — esta es la llave real** |

`id_recurso` solo lo llena el sistema nuevo (100% de los eventos `RECURSO`, 74% de
`MIGRADO`, 0% del resto). Como cubre muy poca historia, **la estrategia correcta es un
catálogo de normalización `nombre_recurso → categoría/tipo_acceso`**, curado a mano una
sola vez (hay ~100-150 nombres distintos en 3 años), no un join automático. El join por
`id_recurso` se usa solo como enriquecimiento extra cuando está disponible, nunca como
único camino.

Este catálogo debe alimentarse cruzando:
```sql
-- correr en el ORIGEN para sacar la lista completa a normalizar
SELECT DISTINCT nombre_recurso, tipo_recurso, COUNT(*) 
FROM log_uso 
GROUP BY nombre_recurso, tipo_recurso
ORDER BY nombre_recurso;
```
contra la tabla `recurso`/`categoria` (que ya está limpia al 100%) y contra las
inconsistencias de nombre que ya vimos (`PROQUEST` vs `PROQUEST PRISMA`, `EBSCO` vs
`RESEARCH_EBSCO`, `Scopus` vs `SCOPUS`, `GOOGLE BOOKS` vs `BOOKS.GOOGLE.ES`, etc.)

### 3.2 Reclasificación de `operacion` (antes `tipo_evento`)

| tipo_evento origen | Vigencia | Se traduce a |
|---|---|---|
| `URL` | 2024-01-01 → 2026-03-24 | `ACCESO_RECURSO` |
| `RECURSO` | 2026-05-13 → hoy | `ACCESO_RECURSO` |
| `MIGRADO` | 2026-03-24 → 2026-07-09 | `ACCESO_RECURSO` (confirmado: 100% tienen `url_recurso`, 0% tienen `termino_busqueda`) |
| `SEARCH` | 2024-01-01 → 2026-03-24 | `BUSQUEDA` |
| `BUSQUEDA_METABUSCADOR` | 2026-05-13 → hoy | `BUSQUEDA` (subtipo: metabuscador) |
| `LOGIN-SUCCESS` (en `log_uso`) | 2024-01-01 → 2026-03-24 | `LOGIN` |
| *(toda la tabla `log_sesion`)* | 2026-03-24 → hoy | `LOGIN` |
| `NULL` | 0.15% de las filas, reciente | `SIN_CLASIFICAR` (volumen insignificante, no bloquea) |

**Nota sobre login:** `log_uso.LOGIN-SUCCESS` y `log_sesion` NO se traslapan en el tiempo
(el primero termina exactamente el día en que empieza el segundo) — son complementarios,
no hay riesgo de doble conteo. Único caso gris: el día 2026-03-24 exacto, donde se
recomienda quedarse solo con `log_sesion` para ese día si aparece en ambas.

### 3.3 Limpieza de valores de texto

- **Bug de codificación URL:** `sede` y `unidad_academica` tienen valores con `+` en vez
  de espacio (`MATRIZ+CUENCA`, `UNIDAD+ACADÉMICA+DE+SALUD+Y+BIENESTAR`). Regla:
  `REPLACE(campo, '+', ' ')`.
- **`unidad_academica` tiene ~56 variantes para menos unidades reales** (confirmado con
  el negocio: son la misma unidad renombrada con el tiempo — tildes inconsistentes,
  singular/plural, y un valor literalmente marcado `"... - NO USAR"` que sigue entrando).
  Requiere una tabla de mapeo `unidad_academica_original → unidad_academica_canonica`.
- **`cargo = 'TEST'`** son registros de prueba confirmados — excluir con
  `WHERE cargo <> 'TEST'`.
- **`cargo` tiene ~100 valores** (muchos títulos de personal administrativo). Para que
  los gráficos de resumen no se fragmenten, se deriva un campo adicional
  `categoria_usuario`: `ALUMNO`, `DOCENTE`, `ANONIMO` (cubre `ANONIMO`/`INVITADO`), o
  `ADMINISTRATIVO` (todo el resto). El `cargo` crudo se conserva para tablas de detalle.
- **`tipo_acceso`** vive únicamente en `recurso` (100% poblado ahí, 99 de 99), nunca en
  el log directamente — se obtiene solo a través del catálogo de recursos normalizado
  del punto 3.1, igual que `tipo_recurso`.

---

## 4. Modelo de datos destino (Azure SQL / T-SQL)

Diseño deliberadamente chico: 2 catálogos de referencia + 1 tabla de hechos + 1 tabla de
control de ETL + 1 vista de consumo. Nada de dimensión de fecha física (se calcula en la
vista con funciones de fecha — no vale la pena una tabla aparte para esto).

```sql
-- Catálogo de recursos normalizado (curado a mano, mantenido en el tiempo)
CREATE TABLE catalogo_recurso (
    nombre_recurso_origen   NVARCHAR(200) NOT NULL PRIMARY KEY, -- tal cual viene en log_uso.nombre_recurso
    recurso_id_normalizado  BIGINT NULL,                        -- FK opcional a recurso.id si se conoce
    nombre_canonico         NVARCHAR(200) NOT NULL,
    categoria               NVARCHAR(150) NOT NULL,              -- = categoria.nombre
    tipo_acceso             NVARCHAR(50) NULL,                   -- SUSCRIPCION / ACCESO_LIBRE / DEMOS
    actualizado_en          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Catálogo de normalización de unidades académicas
CREATE TABLE catalogo_unidad_academica (
    unidad_academica_origen   NVARCHAR(250) NOT NULL PRIMARY KEY,
    unidad_academica_canonica NVARCHAR(250) NOT NULL
);

-- Tabla de hechos: un registro por evento (acceso, búsqueda o login)
CREATE TABLE hechos_uso_biblioteca (
    id_origen           BIGINT NOT NULL,          -- id de log_uso o log_sesion
    tabla_origen        VARCHAR(20) NOT NULL,     -- 'log_uso' | 'log_sesion'
    fecha               DATETIME2 NOT NULL,
    anio                SMALLINT NOT NULL,
    mes                 TINYINT NOT NULL,
    identificacion      NVARCHAR(30) NULL,
    nombre_completo      NVARCHAR(200) NULL,
    cargo               NVARCHAR(100) NULL,
    categoria_usuario   NVARCHAR(20) NOT NULL,    -- ALUMNO/DOCENTE/ADMINISTRATIVO/ANONIMO
    carrera             NVARCHAR(200) NULL,
    modalidad           NVARCHAR(50) NULL,
    unidad_academica    NVARCHAR(250) NULL,       -- ya canonizada
    sede                NVARCHAR(100) NULL,
    operacion           VARCHAR(20) NOT NULL,     -- ACCESO_RECURSO / BUSQUEDA / LOGIN / SIN_CLASIFICAR
    operacion_subtipo   VARCHAR(30) NULL,         -- ej. 'METABUSCADOR' cuando aplique
    termino_busqueda    NVARCHAR(500) NULL,
    recurso             NVARCHAR(200) NULL,       -- nombre_canonico del catálogo
    tipo_recurso        NVARCHAR(150) NULL,       -- = categoria
    tipo_acceso         NVARCHAR(50) NULL,
    url_recurso         NVARCHAR(1000) NULL,
    PRIMARY KEY (tabla_origen, id_origen)
);
CREATE INDEX ix_hechos_fecha ON hechos_uso_biblioteca (fecha);
CREATE INDEX ix_hechos_anio_mes ON hechos_uso_biblioteca (anio, mes);

-- Control de ETL incremental (una fila por tabla origen)
CREATE TABLE etl_control (
    tabla_origen        VARCHAR(30) NOT NULL PRIMARY KEY,
    ultimo_id_procesado BIGINT NOT NULL DEFAULT 0,
    ultima_corrida      DATETIME2 NULL
);
```

---

## 5. Proceso ETL (paso a paso)

**Frecuencia recomendada:** una corrida nocturna (batch), suficiente para un dashboard
gerencial — no hace falta tiempo real. Si más adelante se necesita más frescura, se
achica el intervalo, sin cambiar el diseño.

1. **Extracción incremental** desde el origen (vía el túnel SSH), usando `etl_control`
   como marca de agua por `id` (no por `fecha`, porque hay cargas históricas en bloque
   que no llegan en orden de fecha):
   ```sql
   -- en el ORIGEN
   SELECT * FROM log_uso WHERE id > :ultimo_id_procesado ORDER BY id;
   SELECT * FROM log_sesion WHERE id > :ultimo_id_procesado ORDER BY id;
   ```

2. **Transformación** (en el script del ETL, no en SQL — es más fácil de mantener la
   lógica de normalización en código):
   - Aplicar `REPLACE(..., '+', ' ')` a `sede` y `unidad_academica`.
   - Resolver `unidad_academica` contra `catalogo_unidad_academica` (si no existe la
     variante, insertarla en el catálogo con la canónica = el mismo valor, y alertar
     para revisión manual — así el catálogo crece solo cuando aparece algo nuevo).
   - Resolver `nombre_recurso` contra `catalogo_recurso` de la misma forma.
   - Excluir `cargo = 'TEST'`.
   - Derivar `categoria_usuario` desde `cargo`.
   - Reclasificar `tipo_evento` → `operacion`/`operacion_subtipo` según la tabla de la
     sección 3.2.
   - Para filas de `log_sesion`: mapear a `operacion = 'LOGIN'`, dejar los campos de
     recurso en `NULL` (igual que ya hace `log_uso` con sus filas de `LOGIN-SUCCESS`).

3. **Carga** en `hechos_uso_biblioteca` (upsert por `(tabla_origen, id_origen)`, aunque
   al ser solo incremental por `id > ultimo_procesado` normalmente será un `INSERT` puro).

4. **Actualizar `etl_control`** con el `MAX(id)` procesado de cada tabla origen.

---

## 6. Vista de consumo (lo que el dashboard va a leer)

```sql
CREATE VIEW vw_dashboard_uso AS
SELECT
    fecha, identificacion,
    nombre_completo AS nombre,
    cargo, categoria_usuario, carrera, modalidad,
    unidad_academica AS ua,
    sede,
    operacion,
    termino_busqueda AS busqueda,
    recurso,
    tipo_recurso  AS tipoRecurso,
    tipo_acceso   AS tipoAcceso,
    anio, mes
FROM hechos_uso_biblioteca;
```

Esta vista replica exactamente el *shape* de `LibraryUsageRecord` que ya consume
[`dashboard-analytics-service.ts`](src/lib/server/dashboard-analytics-service.ts), más
`categoria_usuario` como campo nuevo opcional.

---

## 7. Cambios necesarios en la app Next.js

1. Agregar un cliente de conexión a Azure SQL (paquete `mssql`/`tedious`).
2. Reemplazar `readCsvRecords()` en `dashboard-analytics-service.ts` por una consulta
   `SELECT * FROM vw_dashboard_uso` (misma forma de registro, así que el resto de
   funciones de agregación —`aggregateDashboardAnalytics`, `buildSummaryKpis`, etc.— no
   cambian).
3. Mantener el mismo mecanismo de cache (`.cache/dashboard-analytics.json`) al principio;
   evaluar moverlo a agregación en SQL solo si el tiempo de respuesta lo justifica una
   vez migrado (con ~2M filas es razonable que siga funcionando igual de bien que hoy
   con las ~918k del CSV).
4. Agregar `categoria_usuario` como filtro nuevo opcional en `filter-toolbar.tsx` /
   `dashboard-filters.ts`, si se quiere aprovechar.

---

## 8. Fuera de alcance / decisiones pendientes de negocio

- **Área temática (`area`/`recurso_area`):** se trae al catálogo pero no se usa en el
  dashboard todavía — queda disponible para un filtro futuro "por área del
  conocimiento".
- **`log_uso_backup_antes_correccion`:** no se migra. Si se quiere auditar qué se
  corrigió en el pasado, es un análisis aparte, no parte de este ETL.
- **Vacío de búsquedas (2026-03-24 a 2026-05-13):** sin explicar todavía por qué no hay
  ni `SEARCH` ni `BUSQUEDA_METABUSCADOR` en esas ~7 semanas. No bloquea el ETL, pero vale
  la pena preguntarlo al equipo de sistemas.
