# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Phasewatch — a static dashboard for visualizing electricity data from Shelly energy meters. Supports both 3-phase (Shelly Pro 3EM) and 1-phase (Shelly 1EM / Pro EM) CSV exports. Built with Vite + TypeScript. No runtime framework — plain DOM + ECharts.

## Development

Node version is pinned in `.nvmrc` (Node 24 LTS). With nvm installed, run `nvm use` once in the repo to switch.

```
npm install
npm run dev       # Vite dev server with HMR
npm run build     # tsc --noEmit + vite build → dist/
npm run preview   # serve dist/ locally
npm run lint      # ESLint over src/**/*.ts
npm run format    # Prettier
```

Load a CSV via drag-and-drop or the file picker.

## Architecture

Code lives in `src/`, grouped by concern. `main.ts` is the entrypoint — it imports the CSS, wires DOM references, hooks up the file loader, and orchestrates renders.

### Module layout

- `src/types.ts` — `Row`, `Schema`, `Phase`, `Dataset`, `Point`, `Band`.
- `src/constants.ts` — `COLORS`, voltage thresholds (`VOLTAGE_NOMINAL/MIN_SAFE/MAX_SAFE`), `MAX_POINTS`.
- `src/csv/`
  - `schema.ts` — `detectSchema`, `SCHEMA_3PHASE`, `SCHEMA_1PHASE`.
  - `load.ts` — `parseCsv(file)` Promise wrapper over PapaParse (web worker mode).
- `src/data/`
  - `downsample.ts` — `lttbDownsample`, `downsampleSeries`, `downsampleBand`.
  - `aggregate.ts` — `avg`.
- `src/charts/`
  - `shared.ts` — `tooltipStyle`, `dataZoomConfig`, `setupTimeRangeButtons`, `setActiveButton`, `bandColor`.
  - `voltage.ts`, `voltageHeatmap.ts`, `dailyEnergy.ts`, `power.ts` — one render function per chart.
- `src/ui/`
  - `format.ts`, `dataInfo.ts`, `statusCards.ts`, `summaryTable.ts`, `fileDrop.ts`.
- `src/styles/` — `base.css` (reset, custom props, body), `layout.css` (container/header/grid), `components.css` (cards, charts, table, overlays).

Each chart module keeps its ECharts instance in a file-local `let chart` and disposes before re-init, so re-loading a CSV doesn't leak.

### Data flow

CSV file → `parseCsv` (web worker) → `Row[]` → `detectSchema` → `Dataset` → each render function.

### Schema

The CSV format is auto-detected from the first row and captured in a `Schema` object passed inside `Dataset`:

- **3-phase** (headers like `a_avg_voltage`): `phases = [A, B, C]`, `col(key, metric) = ${key}_${metric}`.
- **1-phase** (headers like `avg_voltage`): `phases = [single]`, `col(_, metric) = metric`.

All render functions iterate `schema.phases` and resolve column names via `schema.col(phaseKey, metric)`. For 1-phase: the "Total" row/card/tooltip aggregations are hidden (one phase == the total), the single series uses the accent color, and the label is "Voltage" / "Power" rather than "Phase A".

### Key algorithms

- **LTTB downsampling** (`src/data/downsample.ts`): reduces ~47K points to 2,000 for time-series charts while preserving visual shape. Used by voltage and power charts.
- **Band downsampling** (`downsampleBand`): bucket-based min/max preservation for voltage bands — never hides spikes or dips.
- **Custom band rendering** (`renderBandItem` inside `charts/voltage.ts`): ECharts custom series drawing polygons between consecutive min/max points to show voltage range.

### Conventions

- All theming through `:root` custom properties in `base.css`.
- JS color constants mirror CSS vars in `constants.ts` `COLORS`.
- Phase colors: A=amber `#F59E0B`, B=blue `#3B82F6`, C=rose `#F43F5E` (colorblind-accessible).
- EU voltage thresholds: nominal 230V, safe range 207–253V (EN 50160 ±10%).
- ECharts uses `filterMode: 'none'` on all dataZoom to prevent rendering artifacts.
- CSV energy values are per-interval Wh (not cumulative) — sum for daily totals, divide by 1000 for kWh.
- `vite.config.ts` sets `base: './'` so the build works under the GitHub Pages subpath.

## Deployment

`.github/workflows/static.yml` runs on push to `main`: `npm ci`, `npm run build`, then uploads `dist/` to Pages.

## Key files

- `SPECIFICATION.md` — original design spec covering data format, design system, chart configs, and all implementation details.
- `src/main.ts` — orchestration entrypoint.
- `index.html` — lean shell markup; CSS and JS are imported from `src/`.
- `testdata/` — sample Shelly CSV exports (3-phase and 1-phase) for manual testing. Gitignored.
