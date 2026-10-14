# Crixeconomics

Atlas económico de América Latina: los 20 países de la región comparados en 20 indicadores de
economía, bienestar e instituciones, con datos consultados **en vivo** a APIs públicas (sin llaves).

## Qué hay

| Ruta                  | Qué muestra                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `/`                   | Totales regionales, matriz 20 × 20 coloreada por posición relativa y explorador de rankings. |
| `/pais/[iso3]`        | Ficha de un país (p. ej. `/pais/mex`): los 20 indicadores, ~80 métricas, divisas y socios.   |
| `/comparar?p=mex,bra` | Hasta 5 países frente a frente, con gráfica de evolución.                                    |
| `/metodologia`        | Cada métrica con su fuente y código, reglas de comparación y huecos de datos.                |
| `/api/metricas`       | Catálogo en JSON.                                                                            |
| `/api/metricas/[id]`  | Una métrica para los 20 países (series, ranking, mediana).                                   |
| `/api/paises/[iso3]`  | Perfil completo de un país en JSON.                                                          |

## Fuentes

| Fuente                                         | Indicadores                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Banco Mundial (WDI, WGI, Wealth Accounts, HCI) | Población, PIB, inflación, comercio, pobreza, Gini, salud, gobernanza, riqueza |
| FMI DataMapper (WEO)                           | PIB y crecimiento con proyecciones, deuda, balance, ingresos y gasto           |
| OIT · ILOSTAT (SDMX)                           | Salario mínimo y mediano en moneda local, US$ y PPA                            |
| Our World in Data                              | IDH y escolaridad (PNUD), corrupción (TI), felicidad (WHR), WID                |
| BIS                                            | Precio real de la vivienda (BR, CL, CO, MX, PE)                                |
| UN Comtrade (preview pública)                  | Principales socios comerciales                                                 |
| Exchange API (fawazahmed0)                     | Tipo de cambio diario frente a USD, EUR y CNY, 12 meses                        |

Lo que no tiene API abierta (renta y m² de vivienda, patrimonio del 10 % más rico, construcción y
tecnología como % del PIB) está señalado en cada indicador.

## Cómo funciona

- `src/lib/indicators.ts` es el catálogo: cada métrica declara su fuente, código, unidad y si "más
  alto es mejor". Agregar una métrica es agregar una entrada.
- `src/lib/server/sources/*` tiene un cliente por API. Todo pasa por `cached()` (memoria, TTL de
  6–24 h, stale-while-revalidate) y `request()` (timeouts, reintentos, manejo de 429).
- Las páginas devuelven promesas sin `await`: SvelteKit las transmite por streaming y cada bloque
  aparece cuando su API responde. `hooks.server.ts` precalienta la caché al arrancar.
- Gráficas en SVG hechas a mano (`src/lib/components`), sin dependencias.

## Desarrollo

```sh
npm install      # si npm 10.9 falla con "reading 'edgesOut'", usa: npx npm@11 install
npm run dev
npm run check    # tipos
npm test         # pruebas unitarias
npm run build
```

Usa SvelteKit 2 (Svelte 5, runes). SvelteKit 3 exige Node ≥ 22.17; con Node más nuevo se puede
migrar.

`adapter-auto` detecta Vercel, Netlify o Cloudflare al desplegar; para un servidor propio cambia a
`@sveltejs/adapter-node`.
