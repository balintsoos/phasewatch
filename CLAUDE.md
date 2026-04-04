# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Phasewatch — a single-file static HTML dashboard for visualizing 3-phase electricity data from a Shelly Pro 3EM device. No build step, no server, no dependencies beyond two CDN scripts.

## Development

There is no build, test, or lint toolchain. The entire application lives in `index.html`. To test changes, open the file in a browser and load a CSV via drag-and-drop or file picker.

## Architecture

`index.html` is a self-contained ~1,600 line file structured as:

1. **CDN scripts** — PapaParse 5.4.1 (CSV parsing) and Apache ECharts 5.5.0 (charting)
2. **`<style>`** — All CSS (~460 lines), dark theme via CSS custom properties in `:root`
3. **HTML body** — Drop zone overlay, loading overlay, header, welcome screen, dashboard container
4. **`<script>`** — Single IIFE containing all application logic (~1,000 lines)

### Data flow

CSV file → PapaParse (web worker mode) → `rawData[]` (typed objects) → `timestamps[]` (Unix ms) → 6 render functions, each creating/updating an ECharts instance.

### State

All state is module-scoped inside the IIFE: `rawData`, `timestamps`, `dataRange`, and 4 ECharts chart instances (`voltageChart`, `voltageHeatmapChart`, `dailyEnergyChart`, `powerChart`).

### Key algorithms

- **LTTB downsampling** (`lttbDownsample`): Reduces ~47K points to 2,000 for time-series charts while preserving visual shape. Used by voltage and power charts.
- **Band downsampling** (`downsampleBand`): Bucket-based min/max preservation for voltage bands — never hides spikes or dips.
- **Custom band rendering** (`renderBandItem`): ECharts custom series drawing polygons between consecutive min/max points to show voltage range.

### Conventions

- All CSS theming through `:root` custom properties (e.g., `--phase-a`, `--bg`, `--surface`)
- JS color constants mirror CSS vars in the `COLORS` object
- Phase colors: A=amber `#F59E0B`, B=blue `#3B82F6`, C=rose `#F43F5E` (colorblind-accessible)
- EU voltage thresholds: nominal 230V, safe range 207–253V (EN 50160 ±10%)
- ECharts uses `filterMode: 'none'` on all dataZoom to prevent rendering artifacts
- CSV energy values are per-interval Wh (not cumulative) — sum for daily totals, divide by 1000 for kWh

## Key files

- `SPECIFICATION.md` — Complete spec covering data format, design system, chart configs, and all implementation details. Sufficient to regenerate the project from scratch.
- `index.html` — The entire application.
