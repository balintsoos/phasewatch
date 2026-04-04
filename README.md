# Phasewatch

Interactive dashboard for visualizing data from a **Shelly Pro 3EM** 3-phase energy monitor. Single static HTML file — no build step, no server, just open in a browser.

## Quick Start

1. Open `index.html` in your browser
2. Drag & drop your Shelly Pro 3EM CSV export (or click "Load CSV")
3. Explore your electricity data

## Features

| Section | Description |
|---------|-------------|
| **Status Cards** | Live voltage per phase with warnings if outside 207–253V (EU ±10% of 230V) and total power |
| **Voltage Over Time** | Main chart with average voltage lines + min/max bands per phase, 230V nominal reference line |
| **Voltage by Hour of Day** | Grouped bar chart revealing daily patterns (e.g. evening voltage drops) |
| **Daily Energy Consumption** | Stacked bar chart of kWh per day per phase |
| **Power Consumption** | Stacked area chart of active power over time |
| **Summary Statistics** | Min/max/avg voltage, current, power, and total energy per phase |

## Interactivity

- **Zoom & pan** on all time-series charts (mouse wheel + drag)
- **Time range presets**: Last 24h, 7d, 30d, All
- **Range slider** at the bottom of charts for fine-grained selection
- **Hover tooltips** with exact values and timestamps
- **Legend toggles** to show/hide individual phases
- **Drag & drop** CSV file loading with progress spinner

## Tech Stack

- [Apache ECharts 5.5.0](https://echarts.apache.org/) — charts and interactivity (loaded from CDN)
- [PapaParse 5.4.1](https://www.papaparse.com/) — CSV parsing (loaded from CDN)
- Single self-contained HTML file with inline CSS and JS

## Performance

The dashboard uses **LTTB (Largest Triangle Three Buckets) downsampling** to render ~47,000 data points efficiently by reducing to 2,000 points per chart while preserving visual shape. Min/max voltage bands use bucket-based downsampling to preserve true extremes.

## CSV Data Format

The dashboard expects CSV exports from a Shelly Pro 3EM device. The file contains 51 columns at 60-second intervals:

| Column Group | Metrics |
|-------------|---------|
| **Timestamp** | Unix epoch (seconds) |
| **Per phase (A, B, C)** | Active energy, fundamental energy, returned energy, reactive energy, min/max/avg voltage, min/max/avg current, min/max active power, min/max apparent power |
| **Neutral** | Min/max/avg current |

Column naming convention: `{phase}_{metric}` — e.g. `a_avg_voltage`, `b_max_act_power`, `c_total_act_energy`.

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
