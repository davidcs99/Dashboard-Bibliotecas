# Digital Library Dashboard

Base inicial para construir un dashboard analitico tipo Power BI con `Next.js`, `TypeScript`, `Material UI`, `Apache ECharts`, `AG Grid`, `Zustand` y `TanStack Query`.

## Objetivos de esta primera base

- Definir una estructura de carpetas mantenible.
- Crear un layout de dashboard reutilizable.
- Incorporar filtros globales listos para conectarse al backend.
- Leer y resumir el archivo CSV real desde el servidor.
- Persistir una cache de analitica en `.cache/dashboard-analytics.json` para acelerar la navegacion.
- Exponer endpoints internos por modulo del dashboard para consumir datos desde el frontend.
- Dejar paginas iniciales para resumen, recursos, usuarios, tendencias, busquedas y seguimiento individual.
- Preparar componentes base reutilizables para KPIs, graficos y tablas.

## Scripts

```bash
npm install
npm run dev
```

## Despliegue con Docker

Se agrego una base de despliegue productivo usando:

- `Dockerfile`
- `docker-compose.prod.yml`
- `deploy-production.sh`

Flujo recomendado:

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

Antes del primer despliegue:

- Ajusta `USER`, `SERVER` y `REMOTE_PATH` dentro de `deploy-production.sh`
- Confirma que `biblio_datos_limpios.csv` este presente en el proyecto

La estrategia actual:

- envia codigo fuente al servidor con `rsync`
- construye la imagen completamente en el servidor
- usa `docker build --network=host` para ayudar con conectividad durante el build
- usa un nombre fijo de imagen: `dashboard-bibliotecas-app:latest`
- expone la app en `http://SERVIDOR:3001`
- levanta un contenedor `cloudflared` para obtener un enlace publico
- monta `biblio_datos_limpios.csv` como volumen
- persiste `.cache` fuera del contenedor para acelerar recalculos

## Nota del entorno actual

En este entorno no fue posible ejecutar `node` ni `npm`, por lo que la validacion automatica local no se pudo correr todavia. La estructura y configuracion quedaron preparadas para instalar dependencias y continuar con el desarrollo en cuanto el entorno de Node.js este disponible.
