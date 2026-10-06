# Phasewatch

Interactive dashboard for visualizing data from **Shelly energy monitors**. Supports both 3-phase (**Shelly Pro 3EM**) and 1-phase (**Shelly 1EM / Pro EM**) CSV exports — the format is detected automatically on load. Built with Vite + TypeScript, deployed as a static site.

## Quick Start

```bash
nvm use           # Node 24 (pinned in .nvmrc)
npm install
npm run dev       # Vite dev server with HMR
```

Then drag & drop your Shelly CSV export (or click "Load CSV") in the browser.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint over `src/**/*.ts` |
| `npm run format` | Prettier |

## Features

| Section | Description |
|---------|-------------|
| **Status Cards** | Live voltage per phase with warnings if outside 207–253V (EU ±10% of 230V) and total power |
| **Voltage Over Time** | Main chart with average voltage lines + min/max bands per phase, 230V nominal reference line |
| **Voltage by Hour of Day** | Grouped bar chart revealing daily patterns (e.g. evening voltage drops) |
| **Daily Energy Consumption** | Stacked bar chart of kWh per day per phase |
| **Power Consumption** | Stacked area chart of active power over time |
| **Summary Statistics** | Min/max/avg voltage, current, power, and total energy per phase |

For 1-phase files the per-phase breakdown collapses to a single series with no "Total" aggregation.

## Interactivity

- **Zoom & pan** on all time-series charts (mouse wheel + drag)
- **Time range presets**: Last 24h, 7d, 30d, All
- **Range slider** at the bottom of charts for fine-grained selection
- **Hover tooltips** with exact values and timestamps
- **Legend toggles** to show/hide individual phases
- **Drag & drop** CSV file loading with progress spinner

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool, dev server, HMR
- [TypeScript](https://www.typescriptlang.org/) — strict mode
- [Apache ECharts 5.5](https://echarts.apache.org/) — charts and interactivity (via npm)
- [PapaParse 5.4](https://www.papaparse.com/) — CSV parsing in a web worker (via npm)
- ESLint + Prettier
- No runtime framework — plain DOM + ECharts

## Performance

The dashboard uses **LTTB (Largest Triangle Three Buckets) downsampling** to render ~47,000 data points efficiently by reducing to 2,000 points per chart while preserving visual shape. Min/max voltage bands use bucket-based downsampling to preserve true extremes.

## CSV Data Format

The dashboard auto-detects two Shelly CSV formats on load:

**3-phase (Shelly Pro 3EM)** — 51 columns, column names prefixed with `a_`, `b_`, `c_` (plus neutral `n_*` currents).

**1-phase (Shelly 1EM / Pro EM)** — 15 columns, no phase prefix (bare `avg_voltage`, `max_act_power`, …).

Both are at 60-second intervals.

| Column Group | Metrics |
|-------------|---------|
| **Timestamp** | Unix epoch (seconds) |
| **Per phase** | Active energy, fundamental energy, returned energy, reactive energy, min/max/avg voltage, min/max/avg current, min/max active power, min/max apparent power |
| **Neutral** (3-phase only) | Min/max/avg current |

For the 3-phase format the per-phase columns follow the pattern `{phase}_{metric}` — e.g. `a_avg_voltage`, `b_max_act_power`, `c_total_act_energy`. For 1-phase the `{phase}_` prefix is dropped.

## Project Structure

```
src/
├─ main.ts            # entrypoint: wires DOM + orchestrates renders
├─ types.ts           # Row, Schema, Dataset, Point, Band
├─ constants.ts       # COLORS, voltage thresholds, MAX_POINTS
├─ csv/               # schema detection + PapaParse wrapper
├─ data/              # LTTB downsampling + aggregation helpers
├─ charts/            # one module per ECharts chart + shared helpers
├─ ui/                # status cards, summary table, data info, format, file drop
└─ styles/            # base.css, layout.css, components.css
```

See [`CLAUDE.md`](CLAUDE.md) for architecture notes and conventions.

## Deployment

Pushes to `main` trigger `.github/workflows/static.yml`: `npm ci && npm run build`, then `dist/` is uploaded to GitHub Pages. `vite.config.ts` sets `base: './'` so assets resolve under the Pages subpath.

## Theme

Dark theme optimized for monitoring:

| Element | Color |
|---------|-------|
| Background | `#0F172A` |
| Surface/Cards | `#1E293B` |
| Phase A | `#F59E0B` (amber) |
| Phase B | `#3B82F6` (blue) |
| Phase C | `#F43F5E` (rose) |
| Accent | `#22D3EE` (cyan) |

Phase colors are chosen for colorblind accessibility.

## License

MIT
