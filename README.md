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

## Nota del entorno actual

En este entorno no fue posible ejecutar `node` ni `npm`, por lo que la validacion automatica local no se pudo correr todavia. La estructura y configuracion quedaron preparadas para instalar dependencias y continuar con el desarrollo en cuanto el entorno de Node.js este disponible.
