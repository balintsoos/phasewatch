# Phasewatch — Complete Specification

> A static dashboard for visualizing electricity monitoring data from Shelly energy meters. Supports 3-phase (Shelly Pro 3EM) and 1-phase (Shelly 1EM / Pro EM) CSV exports with automatic format detection. Built with Vite + TypeScript; deploys to GitHub Pages. This document contains everything needed to regenerate the application from scratch.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [Data Source](#3-data-source)
4. [Architecture](#4-architecture)
5. [Design System](#5-design-system)
6. [Layout and Components](#6-layout-and-components)
7. [Charts Specification](#7-charts-specification)
8. [Interactivity](#8-interactivity)
9. [Performance](#9-performance)
10. [Responsive Design](#10-responsive-design)
11. [Alerts and Thresholds](#11-alerts-and-thresholds)
12. [Build and Deployment](#12-build-and-deployment)
13. [Future Enhancements](#13-future-enhancements)

---

## 1. Project Overview

**Name:** Phasewatch
**Purpose:** Interactive electricity monitoring dashboard that visualizes CSV data exported from Shelly energy meters. Supports **Shelly Pro 3EM** (3-phase) and **Shelly 1EM / Pro EM** (1-phase) with automatic format detection. Focused on voltage monitoring, consumption patterns, and power analysis.

**Key Principle:** Zero infrastructure at runtime. The dashboard is a static site — once built, it's a plain HTML + JS + CSS bundle served from GitHub Pages. The user loads a CSV via file picker or drag-and-drop and immediately sees their electricity data visualized; nothing talks to a server.

---

## 2. Goals and Non-Goals

### Goals

- Visualize voltage across 3 phases over time with min/max bands
- Reveal time-of-day and day-of-week patterns (e.g., evening voltage drops)
- Show power consumption per phase and total
- Show daily energy consumption breakdown
- Provide summary statistics for all key metrics
- Warn when voltage is outside EU EN 50160 tolerance (230V ±10% = 207–253V)
- Work entirely in the browser — no backend, no server, no persistence
- Handle ~50,000 rows of data smoothly in the browser

### Non-Goals (v1)

- Real-time/live data from the Shelly device API
- Multi-device support
- Cost estimation or billing calculations
- Data persistence or database
- User authentication
- Data export (PNG/PDF/CSV)

---

## 3. Data Source

### Supported devices

- **Shelly Pro 3EM** — DIN-rail mounted 3-phase energy meter. Monitors voltage, current, power, and energy on three phases (A, B, C) plus neutral current.
- **Shelly 1EM / Pro EM** — Single-phase energy meter. Same metrics as the Pro 3EM minus the phase prefix and neutral current.

The CSV format is auto-detected from column names on load. Everything downstream of the parse step is schema-driven; see §4.2 Schema.

### CSV Format — 3-phase (Shelly Pro 3EM)

**Filename pattern:** `emdata_<DEVICE_ID>_<DATE>.csv`
**Example:** `emdata_ECC9FFE83E40_2026-03-20.csv`

**Structure:** 51 columns, rows at 60-second intervals.

#### Header Row (exact column names)

```
timestamp,a_total_act_energy,a_fund_act_energy,a_total_act_ret_energy,a_fund_act_ret_energy,a_lag_react_energy,a_lead_react_energy,a_max_act_power,a_min_act_power,a_max_aprt_power,a_min_aprt_power,a_max_voltage,a_min_voltage,a_avg_voltage,a_max_current,a_min_current,a_avg_current,b_total_act_energy,b_fund_act_energy,b_total_act_ret_energy,b_fund_act_ret_energy,b_lag_react_energy,b_lead_react_energy,b_max_act_power,b_min_act_power,b_max_aprt_power,b_min_aprt_power,b_max_voltage,b_min_voltage,b_avg_voltage,b_max_current,b_min_current,b_avg_current,c_total_act_energy,c_fund_act_energy,c_total_act_ret_energy,c_fund_act_ret_energy,c_lag_react_energy,c_lead_react_energy,c_max_act_power,c_min_act_power,c_max_aprt_power,c_min_aprt_power,c_max_voltage,c_min_voltage,c_avg_voltage,c_max_current,c_min_current,c_avg_current,n_max_current,n_min_current,n_avg_current
```

#### Column Definitions

| Column | Unit | Description |
|--------|------|-------------|
| `timestamp` | Unix epoch (seconds) | Time of measurement |
| `{x}_total_act_energy` | Wh | Active energy consumed in this 60s interval |
| `{x}_fund_act_energy` | Wh | Fundamental harmonic active energy |
| `{x}_total_act_ret_energy` | Wh | Active energy returned to grid |
| `{x}_fund_act_ret_energy` | Wh | Fundamental harmonic returned energy |
| `{x}_lag_react_energy` | VArh | Lagging (inductive) reactive energy |
| `{x}_lead_react_energy` | VArh | Leading (capacitive) reactive energy |
| `{x}_max_act_power` | W | Maximum active power in the interval |
| `{x}_min_act_power` | W | Minimum active power in the interval |
| `{x}_max_aprt_power` | VA | Maximum apparent power in the interval |
| `{x}_min_aprt_power` | VA | Minimum apparent power in the interval |
| `{x}_max_voltage` | V | Maximum voltage in the interval |
| `{x}_min_voltage` | V | Minimum voltage in the interval |
| `{x}_avg_voltage` | V | Average voltage in the interval |
| `{x}_max_current` | A | Maximum current in the interval |
| `{x}_min_current` | A | Minimum current in the interval |
| `{x}_avg_current` | A | Average current in the interval |
| `n_max_current` | A | Neutral max current |
| `n_min_current` | A | Neutral min current |
| `n_avg_current` | A | Neutral avg current |

Where `{x}` is `a`, `b`, or `c` for Phase A, B, C respectively. Each phase has 16 metric columns.

#### Sample Data Row

```csv
1771180620,0.2134,0.2001,0.0000,0.0000,0.0040,0.0000,127.4,126.3,135.1,131.6,214.609,213.980,214.321,0.631,0.616,0.620,0.2082,0.2013,0.0000,0.0000,0.0000,0.1038,123.5,123.1,180.0,178.1,206.157,205.690,205.955,0.874,0.865,0.868,0.0704,0.0623,0.0000,0.0000,0.0000,0.0623,39.9,35.9,74.1,66.4,216.110,215.895,215.992,0.342,0.308,0.325,0.982,0.966,0.975
```

#### Typical Data Characteristics

| Property | Value |
|----------|-------|
| Sampling interval | 60 seconds |
| Typical file size | ~33 days, ~47,000 rows |
| Voltage range | 190–252V (nominal 230V EU) |
| Current range | 0.1–25A |
| Power range | 7–5,500W |
| Phase B | Typically carries the heaviest load |
| Phase C | Typically the lightest load |
| Energy values | Per-interval (Wh per minute), NOT cumulative |

### CSV Format — 1-phase (Shelly 1EM / Pro EM)

**Filename pattern:** `emdata_<DEVICE_ID>_<DATE>.csv` (same as 3-phase)

**Structure:** 15 columns, rows at 60-second intervals. Column names are **identical to the 3-phase per-phase metrics but without the `a_` / `b_` / `c_` prefix**, and there are no `n_*` neutral-current columns.

#### Header Row (exact column names)

```
timestamp,total_act_energy,total_act_ret_energy,lag_react_energy,lead_react_energy,max_act_power,min_act_power,max_aprt_power,min_aprt_power,max_voltage,min_voltage,avg_voltage,max_current,min_current,avg_current
```

Note that fundamental-harmonic energy columns (`fund_act_energy`, `fund_act_ret_energy`) that exist in the 3-phase export are absent here.

#### Sample Data Row

```csv
1654494480,22.7645,0.0000,0.0000,0.0000,1880.7,939.6,1899.1,979.7,212.820,209.130,210.800,8.980,4.601,6.730
```

### Detection

On parse completion, the first non-empty row's keys are inspected:

| Found | Schema |
|-------|--------|
| `a_avg_voltage` | 3-phase |
| `avg_voltage` (and no `a_avg_voltage`) | 1-phase |
| Neither | Reject with a user-visible alert; no dashboard render |

---

## 4. Architecture

### Technology Stack

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Build tool | Vite | ^5.4 | Dev server with HMR, production bundling |
| Language | TypeScript | ^5.5 | `strict`, `noUncheckedIndexedAccess`, ES2022 target |
| Charting | Apache ECharts | ^5.5 | npm (`echarts`) |
| CSV parsing | PapaParse | ^5.4 | npm (`papaparse`), `@types/papaparse` |
| Styling | Plain CSS | — | CSS custom properties, Grid, Flexbox; split into base/layout/components |
| Linting | ESLint flat config + Prettier | ^9 / ^3 | — |
| Node | 24 (pinned in `.nvmrc`) | — | `node-version-file: '.nvmrc'` in CI |
| Hosting | GitHub Pages | — | `.github/workflows/static.yml` builds and uploads `dist/` |

### Why These Choices

- **ECharts over Chart.js/Plotly:** Best built-in support for time-series interactivity (dataZoom slider, inside zoom/pan), custom series for band rendering, grouped bar charts, tooltip formatting. Single library handles all chart types needed.
- **PapaParse:** Industry-standard CSV parser with web-worker support for non-blocking parsing of large files.
- **No framework:** A single dashboard page with six render sections does not justify React/Vue overhead. Vanilla TS with ECharts handles all state via chart instances.
- **Vite:** HMR during development, trivial static build, out-of-the-box TypeScript. `base: './'` is set so built assets resolve under the GitHub Pages subpath.

### Project Structure

```
phasewatch/
├── index.html              # Lean shell: head + body markup, loads /src/main.ts
├── package.json            # Scripts: dev, build, preview, lint, format
├── tsconfig.json           # strict + noUncheckedIndexedAccess, ES2022
├── vite.config.ts          # base: './', sourcemaps on
├── eslint.config.js        # flat config, @typescript-eslint + prettier
├── .prettierrc
├── .nvmrc                  # "24"
├── src/
│   ├── main.ts             # Entrypoint: imports CSS, wires DOM, orchestrates renders
│   ├── types.ts            # Row, Schema, Phase, Dataset, Point, Band
│   ├── constants.ts        # COLORS, VOLTAGE_* thresholds, MAX_POINTS
│   ├── csv/
│   │   ├── schema.ts       # detectSchema, SCHEMA_3PHASE, SCHEMA_1PHASE
│   │   └── load.ts         # parseCsv(file): Promise<Row[]> — PapaParse worker wrapper
│   ├── data/
│   │   ├── downsample.ts   # lttbDownsample, downsampleSeries, downsampleBand
│   │   └── aggregate.ts    # avg
│   ├── charts/
│   │   ├── shared.ts       # tooltipStyle, dataZoomConfig, setupTimeRangeButtons,
│   │   │                   # setActiveButton, bandColor
│   │   ├── voltage.ts      # renderVoltageChart (+ band custom series)
│   │   ├── voltageHeatmap.ts
│   │   ├── dailyEnergy.ts
│   │   └── power.ts
│   ├── ui/
│   │   ├── format.ts       # formatDate, formatDateTime
│   │   ├── dataInfo.ts
│   │   ├── statusCards.ts
│   │   ├── summaryTable.ts
│   │   └── fileDrop.ts     # wireFileDrop({ fileInput, dropZone, onFile })
│   └── styles/
│       ├── base.css        # reset, :root custom properties, body
│       ├── layout.css      # container, header, grids, responsive
│       └── components.css  # cards, chart-section, table, buttons, overlays
└── .github/workflows/static.yml  # npm ci → npm run build → upload dist/
```

### Data Flow

```
CSV File (user picks via file input or drag-and-drop)
  → wireFileDrop → onFile(file)
  → parseCsv(file)          — PapaParse in web worker, header: true, dynamicTyping
  → Row[] array
  → filter (valid timestamp) + sort ascending
  → detectSchema(rows[0])   — 3-phase vs 1-phase
  → build Dataset { rawData, timestamps (ms), dataRange, schema }
  → Render pipeline (main.ts passes the Dataset to each):
      → renderDataInfo       — record count, date range
      → renderStatusCards    — latest voltage per phase, total power
      → renderVoltageChart   — main time-series
      → renderVoltageHeatmap — hourly voltage averages
      → renderDailyEnergyChart — daily kWh stacked bars
      → renderPowerChart     — power stacked area
      → renderSummaryTable   — min/max/avg statistics
```

### Schema

A `Schema` object is computed once per load (`src/csv/schema.ts`) and drives every render function. It captures the two things that differ between 3-phase and 1-phase CSVs: the list of phases and how to resolve a per-phase column name.

```typescript
export const SCHEMA_3PHASE: Schema = {
  kind: '3phase',
  phases: [
    { key: 'a', name: 'Phase A', color: COLORS.phaseA },
    { key: 'b', name: 'Phase B', color: COLORS.phaseB },
    { key: 'c', name: 'Phase C', color: COLORS.phaseC },
  ],
  col(phaseKey, metric) { return phaseKey + '_' + metric; },
};

export const SCHEMA_1PHASE: Schema = {
  kind: '1phase',
  phases: [{ key: '', name: 'Voltage', color: COLORS.accent }],
  col(_phaseKey, metric) { return metric; },
};
```

Render functions iterate `schema.phases` and read values as `r[schema.col(p.key, 'avg_voltage')]`. The same code path produces three series for 3-phase CSVs and one for 1-phase. "Total" aggregations (total-power card, tooltip Total rows, summary Total row) are hidden when `schema.phases.length === 1` because the aggregate is identical to the single series.

### State Management

A `Dataset` object is constructed once per load and passed explicitly to each render function — there is no global mutable store. Each chart module holds its own ECharts instance in a file-local `let chart` and disposes it before re-init so re-loading a CSV does not leak.

| Field | Type | Purpose |
|-------|------|---------|
| `Dataset.rawData` | `Row[]` | Full parsed CSV rows (filtered for valid timestamps, sorted ascending) |
| `Dataset.timestamps` | `number[]` | Unix ms timestamps, parallel to `rawData` indices |
| `Dataset.dataRange` | `{ min, max }` | First and last timestamp in ms |
| `Dataset.schema` | `Schema` | Detected CSV shape (see above) |

The only module-level mutable state in `main.ts` is a `charts: ECharts[]` array used by the window-resize handler to call `.resize()` on each chart.

---

## 5. Design System

### 5.1 Color Palette

#### CSS Custom Properties

```css
:root {
  --bg: #0F172A;           /* Page background (dark navy) */
  --surface: #1E293B;      /* Card/panel background */
  --surface-hover: #263348; /* Card hover state */
  --text: #E2E8F0;         /* Primary text */
  --text-muted: #94A3B8;   /* Secondary/label text */
  --phase-a: #F59E0B;      /* Phase A — amber */
  --phase-b: #3B82F6;      /* Phase B — blue */
  --phase-c: #F43F5E;      /* Phase C — rose */
  --grid: #334155;         /* Grid lines, borders, dividers */
  --accent: #22D3EE;       /* Accent/highlight (cyan) */
  --danger: #EF4444;       /* Error/warning red */
  --success: #22C55E;      /* OK/success green */
  --border-radius: 12px;   /* Standard card radius */
}
```

#### JavaScript Color Constants

```javascript
const COLORS = {
  phaseA: '#F59E0B',
  phaseB: '#3B82F6',
  phaseC: '#F43F5E',
  accent: '#22D3EE',
  grid: '#334155',
  bg: '#0F172A',
  surface: '#1E293B',
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  danger: '#EF4444',
  success: '#22C55E',
  nominal: 'rgba(34, 211, 238, 0.3)'
};
```

#### Phase Band Colors (semi-transparent, for min/max areas)

| Phase | Band Color |
|-------|-----------|
| A | `rgba(245, 158, 11, 0.12)` |
| B | `rgba(59, 130, 246, 0.12)` |
| C | `rgba(244, 63, 94, 0.12)` |

#### Colorblind Accessibility

Phase colors (Amber/Blue/Rose) are ~120° apart on the color wheel and remain distinguishable under deuteranopia, protanopia, and tritanopia.

### 5.2 Typography

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;
```

| Role | Size | Weight | Other |
|------|------|--------|-------|
| Page title (h1) | 1.75rem | 700 | `letter-spacing: -0.02em` |
| Section heading (h2) | 1.1rem | 600 | — |
| Card label | 0.78rem | 600 | `text-transform: uppercase; letter-spacing: 0.06em` |
| Card value | 1.75rem | 700 | `letter-spacing: -0.02em` |
| Card unit | 0.9rem | 400 | color: `--text-muted` |
| Card detail | 0.8rem | 400 | color: `--text-muted` |
| Table header | 0.78rem | 600 | `text-transform: uppercase; letter-spacing: 0.06em` |
| Table cell | 0.9rem | 400 | `font-variant-numeric: tabular-nums` |
| Button text | 0.82rem | 600 | — |
| Tooltip text | 12px | 400 | — |
| Axis label | 11px | 400 | color: `--text-muted` |
| Data info bar | 0.85rem | 400 | color: `--text-muted` |

### 5.3 Spacing and Layout

| Property | Value |
|----------|-------|
| Max content width | 1440px, centered |
| Container padding | 0 24px 60px |
| Card border radius | 12px |
| Card padding | 20–24px |
| Section gap | 24px (margin-bottom) |
| Status card grid gap | 16px |
| Charts grid gap | 24px |

### 5.4 Iconography

The app uses inline SVGs (no icon library). Two icons are used:

1. **Lightning bolt** (logo/header icon): `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>` — Feather icons style, 22x22 in header, 36x36 on welcome screen. Rendered inside a 40x40 rounded square with gradient background (`linear-gradient(135deg, var(--accent), #0EA5E9)`).

2. **Upload arrow** (file input button): `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>` — 18x18.

---

## 6. Layout and Components

### 6.1 Page Structure

```
<body>
  ├── #drop-zone          — Full-screen overlay for drag-and-drop (hidden by default)
  ├── #loading-overlay     — Full-screen spinner during CSV parsing (hidden by default)
  └── .container (max-width: 1440px, centered)
       ├── <header>         — Title + file input
       ├── #welcome-screen  — Shown before data is loaded
       └── #dashboard       — Shown after data is loaded
            ├── .data-info           — Record count, date range, duration
            ├── .status-cards        — 4 cards: Phase A/B/C voltage + total power
            ├── .chart-section       — Voltage Over Time (main chart, 420px tall)
            ├── .charts-grid         — 2-column grid
            │    ├── .chart-section  — Voltage by Hour of Day (340px tall)
            │    └── .chart-section  — Daily Energy Consumption (340px tall)
            ├── .chart-section       — Power Consumption Over Time (380px tall)
            └── .chart-section       — Summary Statistics table
```

### 6.2 Header

- Flex layout, `space-between` alignment, wraps on mobile
- Left: Logo icon + "Phasewatch" title
- Right: File input (styled as a cyan button with upload icon) + filename display

### 6.3 Welcome Screen

Shown before any CSV is loaded. Centered vertically (min-height: 60vh). Contains:
- Large logo icon (80x80, gradient background)
- "Welcome to Phasewatch" heading
- Description text
- Dashed-border drop hint box

### 6.4 Loading Overlay

Full-screen fixed overlay (`rgba(15, 23, 42, 0.88)` with `backdrop-filter: blur(6px)`):
- CSS spinner (48x48, border animation, cyan top border)
- "Parsing CSV data..." text, updated to "Processing data..." after parse completes

### 6.5 Drop Zone

Full-screen fixed overlay for drag-and-drop visual feedback:
- `rgba(15, 23, 42, 0.92)` background with `backdrop-filter: blur(8px)`
- Dashed cyan border box with "Drop CSV File Here" text
- Activated via dragenter/dragleave counter pattern

### 6.6 Data Info Bar

Horizontal flex row showing:
- Green dot + "Data loaded"
- Record count (formatted with locale separator)
- Date range (e.g., "15 Feb 2026 — 20 Mar 2026")
- Duration in days

### 6.7 Status Cards

CSS Grid: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`, 16px gap.

**Per-phase card (3× for 3-phase, 1× for 1-phase):**
- Left edge: 4px tall colored bar (phase color — accent cyan for the 1-phase single card)
- Label: "Phase X Voltage" for 3-phase; just "Voltage" for 1-phase
- Value: voltage in V (1.75rem, bold)
- Warning badge: "OUT OF RANGE" if voltage < 207V or > 253V (red background)
- Detail: "Range: min – max V"
- Warning state: red border, red-tinted background, red value text

**Power card:**
- 3-phase: "Total Power (latest)" summing all three phases, with per-phase breakdown in the detail line
- 1-phase: "Power (latest)" showing the single phase's `max_act_power`, no breakdown line
- Left edge: cyan bar; value in cyan

Auto-formatted to kW when ≥ 1000W.

### 6.8 Chart Sections

Each chart section is a card (`.chart-section`) with:
- Surface background, 12px radius, 24px padding
- Header row: title (h2) + controls (time range buttons, reset zoom)
- Chart container: full width, fixed height (varies by chart)

**Time range buttons:** Pill-shaped segmented control with presets:
- `Last 24h`, `Last 7d`, `Last 30d`, `All`
- Active state: cyan background, dark text
- Container: dark background pill with 4px padding

**Reset zoom button:** Outlined button, shows on hover

### 6.9 Summary Statistics Table

Full-width table with horizontal scroll wrapper.

| Column | Alignment |
|--------|-----------|
| Phase | Left (with colored dot) |
| Min Voltage (V) | Right |
| Max Voltage (V) | Right |
| Avg Voltage (V) | Right |
| Max Current (A) | Right |
| Avg Current (A) | Right |
| Max Power (W) | Right |
| Total Energy (kWh) | Right |

Rows (3-phase): Phase A, Phase B, Phase C, **Total** (bold, top border, dashes for non-aggregatable columns).
Rows (1-phase): single "Voltage" row (accent dot). The Total row is omitted — it would duplicate the single data row.

---

## 7. Charts Specification

For 1-phase CSVs every multi-phase construct below collapses to a single series: the three "A/B/C" line/band/bar series become one "Voltage" / "Power" series in the accent cyan color, and tooltip "Total" rows are suppressed because the aggregate equals the single value. The chart types, axes, zoom behavior, and layout are otherwise unchanged.

### 7.1 Voltage Over Time (Main Chart)

**Type:** Multi-line time-series with custom polygon bands
**Height:** 420px
**Importance:** PRIMARY — largest chart, first after status cards

**Data series (7 total):**

| Series | Type | Data Source | Visual |
|--------|------|-------------|--------|
| A Band | `custom` (polygon) | `a_min_voltage`, `a_max_voltage` | `rgba(245, 158, 11, 0.12)` filled polygon |
| B Band | `custom` (polygon) | `b_min_voltage`, `b_max_voltage` | `rgba(59, 130, 246, 0.12)` filled polygon |
| C Band | `custom` (polygon) | `c_min_voltage`, `c_max_voltage` | `rgba(244, 63, 94, 0.12)` filled polygon |
| 230V Nominal | `line` (markLine) | Static | Dashed cyan line at y=230, label "230V" |
| Phase A | `line` | `a_avg_voltage` | Amber, 1.8px width, no symbols |
| Phase B | `line` | `b_avg_voltage` | Blue, 1.8px width, no symbols |
| Phase C | `line` | `c_avg_voltage` | Rose, 1.8px width, no symbols |

**Band rendering:** Uses ECharts `custom` series type. Each data point carries `[timestamp, min, max, prevTimestamp, prevMin, prevMax]`. The `renderItem` function draws a polygon connecting the previous and current min/max points, creating a filled area between the min and max voltage lines.

**Axes:**
- X: `type: 'time'`, auto-formatted labels
- Y: `type: 'value'`, name "Voltage (V)", `scale: true` (auto-range around data), dashed grid lines

**DataZoom (2 instances):**
1. `type: 'inside'` — mouse wheel zoom + drag pan
2. `type: 'slider'` — bottom slider bar (height 30px, cyan styling)

Both use `filterMode: 'none'` to avoid data filtering artifacts.

**Legend:** Top-right, shows Phase A/B/C only (not bands or nominal line). Click to toggle phases.

**Tooltip:** Axis-triggered, shows formatted datetime + voltage per visible phase. Excludes band series and nominal line.

### 7.2 Voltage by Hour of Day

**Type:** Grouped bar chart
**Height:** 340px
**Position:** Left column of 2-column grid

**Data preparation:**
1. Iterate all rows, group by `new Date(timestamp * 1000).getHours()` (0–23)
2. For each hour bucket, compute average of `a_avg_voltage`, `b_avg_voltage`, `c_avg_voltage`

**Series:** 3 bar series (one per phase), grouped (not stacked).
- Bar max width: 12px
- Border radius: `[3, 3, 0, 0]` (rounded top)

**Axes:**
- X: category, labels "0:00" through "23:00", interval 1
- Y: value, name "V", `scale: true`

**No zoom/pan** — this is a summary chart.

### 7.3 Daily Energy Consumption

**Type:** Stacked bar chart
**Height:** 340px
**Position:** Right column of 2-column grid

**Data preparation:**
1. Iterate all rows, group by date string (`YYYY-MM-DD`)
2. For each day, sum `a_total_act_energy`, `b_total_act_energy`, `c_total_act_energy`
3. Convert from Wh to kWh (divide by 1000)

**Series:** 3 bar series stacked (`stack: 'energy'`).
- Phase A on bottom, B in middle, C on top
- Bar max width: 20px
- Top series has border radius `[3, 3, 0, 0]`

**Axes:**
- X: category, labels formatted as "DD Mon" (e.g., "15 Feb"), rotated 45°
- Y: value, name "kWh"

**Tooltip:** Shows per-phase kWh + total with divider line.

### 7.4 Power Consumption Over Time

**Type:** Stacked area chart
**Height:** 380px

**Data source:** `a_max_act_power`, `b_max_act_power`, `c_max_act_power` (using max power for each interval).

**Series:** 3 line series with `stack: 'power'` and `areaStyle`:
- `lineStyle: { width: 0 }` — no visible line, just filled area
- `areaStyle: { opacity: 0.7 }`
- Phase A on bottom, B in middle, C on top
- `emphasis: { focus: 'series' }` — hover highlights one phase

**Axes:** Same pattern as voltage chart (time X, value Y with name "Power (W)")

**DataZoom:** Same dual slider+inside pattern as voltage chart.

**Tooltip:** Shows per-phase power + total with divider line.

**Time range buttons:** Same preset system (24h/7d/30d/All) + reset zoom.

---

## 8. Interactivity

### 8.1 File Loading

**File input:** `<input type="file" accept=".csv">` hidden, triggered by styled label button.

**Drag and drop:**
- Uses `dragenter`/`dragleave` counter pattern to handle nested elements
- `dragover` prevented (enables drop)
- On `drop`: checks file extension is `.csv`, calls `loadFile()`

**Parse pipeline:** `parseCsv(file)` in `src/csv/load.ts` wraps PapaParse in a Promise:

```typescript
Papa.parse<Row>(file, {
  header: true,         // First row as column names → object keys
  dynamicTyping: true,  // Auto-convert numbers
  skipEmptyLines: true,
  worker: true,         // Parse in a web worker (non-blocking)
  complete: (results) => resolve(results.data),
  error: reject,
});
```

**Post-parse processing:**
1. Filter rows where `timestamp` exists and is a number
2. Sort by `timestamp` ascending
3. Convert timestamps to milliseconds (`* 1000`)
4. Compute `dataRange` (first and last timestamp)
5. Hide welcome screen, show dashboard
6. Render all components
7. Attach window resize handler (debounced, 200ms) to resize all charts

### 8.2 Time Range Presets

Available on voltage chart and power chart. Each has a set of 4 buttons:

| Button | Behavior |
|--------|----------|
| Last 24h | Set dataZoom start to `max - 24h`, end to 100% |
| Last 7d | Set dataZoom start to `max - 7d`, end to 100% |
| Last 30d | Set dataZoom start to `max - 30d`, end to 100% |
| All | Set dataZoom start to 0%, end to 100% |

Implementation: Calculate start time, clamp to `dataRange.min`, convert to percentage of total range, dispatch `dataZoom` action.

Active button gets `.active` class (cyan background).

### 8.3 Zoom and Pan

All time-series charts (voltage, power) support:
- **Mouse wheel zoom** (via `dataZoom type: 'inside'`)
- **Click-drag pan** when zoomed (via `dataZoom type: 'inside'`)
- **Slider drag** (via `dataZoom type: 'slider'`)
- **Reset zoom button** — dispatches `dataZoom` to 0–100%

### 8.4 Tooltips

All charts use `trigger: 'axis'` tooltips with:
- Dark surface background (`#1E293B`)
- Grid-colored border (`#334155`)
- Light text (`#E2E8F0`)
- Custom formatters that:
  - Show formatted datetime (for time-series) or category label
  - List all visible series with colored markers
  - Show values with appropriate precision and units
  - For power/energy charts: include "Total" row with divider

### 8.5 Legend Toggles

All multi-phase charts include a clickable legend (top-right) showing Phase A/B/C. Clicking a legend item toggles that series' visibility.

### 8.6 Window Resize

All chart instances call `.resize()` on window resize, debounced to 200ms.

---

## 9. Performance

### 9.1 LTTB Downsampling

Time-series charts downsample to **2,000 points** maximum using the LTTB (Largest Triangle Three Buckets) algorithm.

**LTTB algorithm overview:**
1. Always keep first and last points
2. Divide remaining points into `threshold - 2` buckets
3. For each bucket, select the point that forms the largest triangle area with the selected point from the previous bucket and the average of the next bucket
4. This preserves the visual shape of the data far better than simple every-Nth sampling

**Implementation:** `lttbDownsample(xArr, yArr, threshold)` returns `{ x: [...], y: [...] }`.

**Wrapper:** `downsampleSeries(timestamps, values, maxPoints)` returns `[[ts, val], ...]` pairs ready for ECharts.

### 9.2 Band Downsampling

Voltage min/max bands use a different strategy: **bucket-based min/max preservation**.

```javascript
function downsampleBand(timestamps, minVals, maxVals, maxPoints) {
  // Divide into buckets of ceil(len/maxPoints) points
  // For each bucket: take the true minimum of minVals and true maximum of maxVals
  // Use the mid-point timestamp
  // Returns { min: [[ts, val], ...], max: [[ts, val], ...] }
}
```

This ensures that voltage spikes and dips are never hidden by downsampling.

### 9.3 CSV Parsing

PapaParse runs in **web worker mode** (`worker: true`), keeping the UI responsive during parsing of large files. A loading overlay with spinner is shown during parsing.

### 9.4 ECharts Renderer

All charts use `renderer: 'canvas'` for better performance with large datasets. The `large: true` flag is set on power chart series to enable ECharts' large data optimization.

---

## 10. Responsive Design

### 10.1 Breakpoints

| Breakpoint | Changes |
|------------|---------|
| `> 900px` | Full 2-column grid for voltage heatmap + daily energy |
| `<= 900px` | Charts grid collapses to single column |
| `<= 640px` | Header stacks vertically; status cards become 2-column grid; chart headers stack |

### 10.2 Status Cards Grid

```css
grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
```

Automatically wraps to fewer columns on narrow screens.

### 10.3 Charts Grid

```css
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* Desktop */
  gap: 24px;
}

@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }  /* Mobile */
}
```

### 10.4 Summary Table

Wrapped in a horizontally scrollable container with `-webkit-overflow-scrolling: touch`.

---

## 11. Alerts and Thresholds

### 11.1 Voltage Range

| Constant | Value | Source |
|----------|-------|--------|
| `VOLTAGE_NOMINAL` | 230V | EU standard |
| `VOLTAGE_MIN_SAFE` | 207V | EN 50160: 230V - 10% |
| `VOLTAGE_MAX_SAFE` | 253V | EN 50160: 230V + 10% |

### 11.2 Status Card Warnings

When any phase's latest `avg_voltage` is outside 207–253V:
- Card gets `.warning` class
- Red border: `border-color: var(--danger)`
- Red-tinted background: `rgba(239, 68, 68, 0.08)`
- Value text turns red
- "OUT OF RANGE" badge appears (red pill badge)

### 11.3 Nominal Reference Line

The voltage chart includes a dashed reference line at 230V with a "230V" label, rendered using ECharts `markLine` on an empty series.

---

## 12. Build and Deployment

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc --noEmit && vite build` — type-check then bundle to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint over `src/**/*.ts` |
| `npm run format` | Prettier over `src` and top-level files |

### Node version

Pinned in `.nvmrc` (currently `24`). CI reads it via `node-version-file: '.nvmrc'`. Locally: `nvm use`.

### Dependencies

Runtime:
- `echarts` (^5.5)
- `papaparse` (^5.4)

Development:
- `vite`, `typescript`
- `@types/papaparse`
- `eslint`, `@typescript-eslint/{parser,eslint-plugin}`, `prettier`, `eslint-config-prettier`

No other external dependencies — no runtime framework, no CSS preprocessor.

### Vite config

```typescript
// vite.config.ts
export default defineConfig({
  base: './',          // So Pages subpath works
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### GitHub Pages deployment

`.github/workflows/static.yml` triggers on pushes to `main`:

1. Checkout
2. Setup Node from `.nvmrc` (with npm cache)
3. `npm ci`
4. `npm run build`
5. `actions/upload-pages-artifact` with `path: 'dist'`
6. `actions/deploy-pages`

The project source tree is detailed in §4 Project Structure.

---

## 13. Future Enhancements

These are explicitly out of scope for v1 but documented for potential future development:

- **Live data via WebSocket/API:** Connect to Shelly Pro 3EM's local REST API for real-time updates
- **Cost calculator:** Configurable electricity rate (EUR/kWh) with daily/monthly cost projections
- **Linked crosshairs:** Hovering on one chart shows the same timestamp on all other time-series charts
- **Anomaly detection:** Automatic flagging of unusual patterns
- **Export:** PNG/PDF chart export, CSV export of processed/aggregated data
- **Multi-device:** Support for multiple Shelly devices on different circuits
- **Light/dark theme toggle**
- **Current chart:** Dedicated current (A) time-series chart
- **Voltage EN 50160 band:** Shaded horizontal band (207–253V) behind the voltage chart
- **Phase imbalance indicator:** Warning when voltage spread between phases exceeds 10V
- **Neutral current monitoring:** Alert when neutral current is unexpectedly high (> 2A indicates phase imbalance or harmonics)
- **Power factor display:** Per-phase power factor from active/apparent power ratio
- **Heatmaps:** Hour-of-day × day-of-week heatmaps for voltage and power pattern discovery
- **Hourly load profile:** Average power by hour with ±1 standard deviation band
