# Electricity Monitor Dashboard -- Design Document

## 1. Data Profile

Source: Shelly Pro 3EM via CSV export (`emdata_ECC9FFE83E40_*.csv`)

| Property | Value |
|---|---|
| Sampling interval | 60 seconds |
| Dataset duration | ~33 days (2026-02-15 to 2026-03-20) |
| Rows | ~47,000 |
| Phases | A, B, C + Neutral current |
| Metrics per phase | avg/min/max voltage, avg/min/max current, min/max active power, min/max apparent power, total active energy, reactive energy |

Observed value ranges:

| Metric | Phase A | Phase B | Phase C |
|---|---|---|---|
| Voltage (V) | 196 - 249, avg 228 | 191 - 249, avg 227 | 208 - 252, avg 230 |
| Current (A) | 0.1 - 12.9, avg 0.5 | 0.2 - 24.7, avg 0.8 | 0.2 - 20.2, avg 0.5 |
| Power (W) | 24 - 2854, avg 136 | 7 - 5501, avg 147 | 28 - 4943, avg 117 |

Energy fields are **per-interval** (Wh consumed in each 60s window), not cumulative.

---

## 2. Design Principles

1. **Glanceability** -- The most critical information (voltage health, total power right now) must be readable in under 2 seconds.
2. **Phase symmetry** -- Always show all 3 phases side-by-side with consistent color coding so anomalies on a single phase are immediately obvious.
3. **Progressive disclosure** -- Top-level summary cards first, detailed time-series and analysis below the fold.
4. **Information density over decoration** -- No ornamental gradients, no 3D charts, no donut charts. Every pixel earns its place.
5. **Accessible contrast** -- Minimum WCAG AA on all text. Phase colors chosen to be distinguishable under deuteranopia/protanopia.

---

## 3. Color System

### 3.1 Phase Colors

Traditional European electrical wiring colors are Brown/Black/Grey (L1/L2/L3). These do not work on screen -- too similar, poor on dark backgrounds. Instead, use a modern triad chosen for maximum distinguishability, including for color-blind users:

| Phase | Color | Hex | Usage |
|---|---|---|---|
| Phase A (L1) | Amber | `#F59E0B` | Lines, fills, badges |
| Phase B (L2) | Blue | `#3B82F6` | Lines, fills, badges |
| Phase C (L3) | Rose | `#F43F5E` | Lines, fills, badges |
| Neutral | Slate | `#94A3B8` | Neutral current line only |

These three hues are ~120 degrees apart on the color wheel, survive deuteranopia simulation, and are vivid enough on both light and dark backgrounds.

### 3.2 Background and Surface

The dashboard uses a **dark theme** (better for monitoring screens left on for long periods, reduces eye strain, makes colored lines pop).

| Element | Color | Hex |
|---|---|---|
| Page background | Near-black slate | `#0F172A` |
| Card / panel surface | Dark slate | `#1E293B` |
| Card border | Subtle slate | `#334155` |
| Primary text | White-ish | `#F1F5F9` |
| Secondary text | Muted slate | `#94A3B8` |
| Grid lines / axes | Very subtle | `#334155` |
| Danger / alert | Red | `#EF4444` |
| Warning | Yellow | `#EAB308` |
| OK / normal | Green | `#22C55E` |

### 3.3 Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Page title | Inter / system sans | 24px | 700 |
| Section heading | Inter / system sans | 16px | 600 |
| Card title | Inter / system sans | 13px | 600, uppercase, letter-spaced |
| Metric large number | JetBrains Mono / monospace | 32px | 700 |
| Metric unit | JetBrains Mono / monospace | 14px | 400 |
| Axis labels | Inter / system sans | 11px | 400 |
| Tooltip text | Inter / system sans | 12px | 400 |

---

## 4. Overall Layout

Single-page scrollable dashboard. No tabs -- everything visible on one continuous scroll so the user builds a spatial map ("voltage is at the top, energy is near the bottom").

The page is divided into horizontal **sections**, each spanning the full viewport width. Inside each section, content is arranged in a **CSS Grid** (12-column base grid at desktop).

```
+===========================================================================+
|  HEADER BAR                                                               |
|  [Logo/Title]                    [Time Range Selector]  [Settings Gear]   |
+===========================================================================+
|                                                                           |
|  SECTION 1: STATUS OVERVIEW  (always visible, sticky-ish)                 |
|  +------------------+ +------------------+ +------------------+           |
|  | PHASE A  STATUS  | | PHASE B  STATUS  | | PHASE C  STATUS  |          |
|  |    228.3 V       | |    226.9 V       | |    230.1 V       |          |
|  |    0.48 A        | |    0.82 A        | |    0.51 A        |          |
|  |    109 W         | |    186 W         | |    118 W         |          |
|  |    PF: 0.92      | |    PF: 0.68      | |    PF: 0.87      |          |
|  +------------------+ +------------------+ +------------------+           |
|  +----------------------------------------------------------------+      |
|  | TOTAL POWER:  413 W          TOTAL ENERGY TODAY:  4.82 kWh     |      |
|  +----------------------------------------------------------------+      |
|                                                                           |
+---------------------------------------------------------------------------+
|                                                                           |
|  SECTION 2: VOLTAGE OVER TIME                                             |
|  +----------------------------------------------------------------+      |
|  |  [Line Chart -- 3 phase voltages overlaid]                     |      |
|  |                                                                |      |
|  |  240V -----.                  .----.                            |      |
|  |           / \   Phase C      /    \                             |      |
|  |  230V --/---\--/-----------/------\---  <- nominal             |      |
|  |        /     \/  Phase A  /        \                            |      |
|  |  220V /      Phase B     /          \                           |      |
|  |      /                  /            \                          |      |
|  |  210V                                                          |      |
|  |      06:00  09:00  12:00  15:00  18:00  21:00  00:00           |      |
|  +----------------------------------------------------------------+      |
|  [Phase toggles: (x) A  (x) B  (x) C ]                                   |
|                                                                           |
+---------------------------------------------------------------------------+
|                                                                           |
|  SECTION 3: CURRENT AND POWER                                             |
|  +-------------------------------+ +-------------------------------+     |
|  | CURRENT (A) -- Line Chart     | | ACTIVE POWER (W) -- Area Chart|     |
|  |                                | |                               |     |
|  |   12A  .                       | | 2.8kW  .                      |     |
|  |       / \                      | |       / \                     |     |
|  |   8A /   \                     | | 2.0kW/   \                    |     |
|  |     /     \  <- A              | |     /     \  <- stacked       |     |
|  |   4A       \                   | | 1.0kW      \                  |     |
|  |   ------------- B,C           | |   ----------                  |     |
|  |   06:00   12:00   18:00       | |   06:00   12:00   18:00       |     |
|  +-------------------------------+ +-------------------------------+     |
|                                                                           |
+---------------------------------------------------------------------------+
|                                                                           |
|  SECTION 4: ENERGY CONSUMPTION                                            |
|  +----------------------------------------------------------------+      |
|  | DAILY ENERGY (kWh) -- Stacked Bar Chart                        |      |
|  |                                                                |      |
|  |  20kWh  |     ___                                              |      |
|  |         |    |CCC|  ___                                        |      |
|  |  15kWh  |    |BBB| |CCC|                                       |      |
|  |         |    |AAA| |BBB|  ___                                  |      |
|  |  10kWh  | ___|   | |AAA| |   | ...                             |      |
|  |         ||   |   | |   | |   |                                 |      |
|  |   5kWh  ||   |   | |   | |   |                                 |      |
|  |         ||___|___| |___|_|___|                                 |      |
|  |         Feb15  Feb16 Feb17 Feb18 ...                           |      |
|  +----------------------------------------------------------------+      |
|                                                                           |
+---------------------------------------------------------------------------+
|                                                                           |
|  SECTION 5: PATTERN ANALYSIS                                              |
|  +-------------------------------+ +-------------------------------+     |
|  | VOLTAGE HEATMAP               | | POWER HEATMAP                 |     |
|  | (hour-of-day x day-of-week)   | | (hour-of-day x day-of-week)   |     |
|  |                                | |                               |     |
|  |     00 03 06 09 12 15 18 21   | |     00 03 06 09 12 15 18 21   |     |
|  | Mon [                       ]  | | Mon [                       ] |     |
|  | Tue [       gradient fill   ]  | | Tue [       gradient fill   ] |     |
|  | Wed [                       ]  | | Wed [                       ] |     |
|  | Thu [                       ]  | | Thu [                       ] |     |
|  | Fri [                       ]  | | Fri [                       ] |     |
|  | Sat [                       ]  | | Sat [                       ] |     |
|  | Sun [                       ]  | | Sun [                       ] |     |
|  +-------------------------------+ +-------------------------------+     |
|                                                                           |
|  +----------------------------------------------------------------+      |
|  | HOURLY AVERAGE PROFILE                                         |      |
|  | (avg power by hour-of-day, all days overlaid)                  |      |
|  |                                                                |      |
|  |  300W  .                                            .          |      |
|  |       / \                                          / \         |      |
|  |  200W/   \                                        /   \        |      |
|  |    /     \          ----                         /     \       |      |
|  |  100W     \        /    \          ----         /       \      |      |
|  |            \------/      \--------/    \-------/         \     |      |
|  |   50W                                                          |      |
|  |      00  02  04  06  08  10  12  14  16  18  20  22  00        |      |
|  +----------------------------------------------------------------+      |
|                                                                           |
+---------------------------------------------------------------------------+
|                                                                           |
|  SECTION 6: SUMMARY STATISTICS TABLE                                      |
|  +----------------------------------------------------------------+      |
|  |          |  Phase A   |  Phase B   |  Phase C   |    Total     |      |
|  |----------|------------|------------|------------|--------------|      |
|  | Voltage  |            |            |            |              |      |
|  |   Min    |  196.0 V   |  190.5 V   |  208.2 V   |    --        |      |
|  |   Max    |  248.6 V   |  248.6 V   |  251.8 V   |    --        |      |
|  |   Avg    |  227.5 V   |  226.9 V   |  230.3 V   |    --        |      |
|  | Current  |            |            |            |              |      |
|  |   Min    |   0.1 A    |   0.2 A    |   0.2 A    |    --        |      |
|  |   Max    |  12.9 A    |  24.7 A    |  20.2 A    |    --        |      |
|  |   Avg    |   0.5 A    |   0.8 A    |   0.5 A    |   1.8 A      |      |
|  | Power    |            |            |            |              |      |
|  |   Min    |  23.5 W    |   7.1 W    |  27.8 W    |    --        |      |
|  |   Max    | 2853.8 W   | 5500.6 W   | 4942.8 W   |    --        |      |
|  |   Avg    |  136.0 W   |  146.8 W   |  117.2 W   |  400.0 W     |      |
|  | Energy   |            |            |            |              |      |
|  |   Total  |  xxx kWh   |  xxx kWh   |  xxx kWh   |  xxx kWh     |      |
|  +----------------------------------------------------------------+      |
|                                                                           |
+---------------------------------------------------------------------------+
|  FOOTER: Data range: 2026-02-15 to 2026-03-20 | 47,268 readings          |
+===========================================================================+
```

---

## 5. Section-by-Section Design Detail

### 5.1 Header Bar

- Fixed/sticky at top, 48px tall, background `#0F172A` with bottom border `#334155`.
- Left: Title "Electricity Monitor" in 18px bold.
- Center-right: **Time Range Selector** -- a segmented control with presets: `24h | 7d | 30d | All` plus a date-range picker icon for custom ranges.
- Far right: Settings gear icon (for future: threshold config, export options).

### 5.2 Section 1 -- Status Overview Cards

**Purpose**: At-a-glance health check. "Is everything normal right now?"

Three equal-width cards, one per phase. Each card shows:

```
+-----------------------------+
| PHASE A                [*]  |   [*] = colored dot (amber)
|                             |
|   228.3 V                   |   <- large monospace number
|   0.48 A    109 W           |   <- secondary metrics
|   PF: 0.92                  |   <- power factor
|                             |
|   [==========--------] 92%  |   <- voltage health bar (% of 230V nominal)
+-----------------------------+
```

**Voltage health bar**: A thin horizontal bar showing where the current voltage sits within the EN 50160 tolerance band (230V +10%/-10% = 207-253V). Green in the middle, yellow at edges, red if outside.

Below the three cards: a **summary strip** spanning full width:
```
TOTAL POWER: 413 W  |  TODAY: 4.82 kWh  |  THIS MONTH: 142.3 kWh  |  COST EST: EUR 42.70
```
(Cost estimate = configurable rate, e.g., EUR 0.30/kWh.)

### 5.3 Section 2 -- Voltage Over Time

**Chart type**: Multi-line time-series chart.

- Three overlapping lines (one per phase in phase colors) on a shared Y-axis.
- Y-axis range: auto-scale but always include the 207-253V band.
- A **shaded horizontal band** from 207V to 253V (EN 50160 tolerance) rendered as a subtle green-tinted rectangle behind the lines. This makes voltage excursions immediately obvious -- any line that leaves the band is a problem.
- A dashed horizontal reference line at exactly 230V (nominal).
- X-axis: time, formatted based on zoom level (HH:MM for <24h, MMM-DD for >7d).
- **Crosshair on hover**: vertical line snapping to nearest data point, tooltip showing exact timestamp and all three voltage values.

**Why line chart**: Voltage is a continuous signal over time; line charts preserve temporal continuity and make trends/oscillations obvious. Bar charts would obscure the waveform shape.

### 5.4 Section 3 -- Current and Power (Side by Side)

Two charts, each taking 50% width (6 columns).

**Left: Current (A) -- Multi-line chart**
- Same structure as voltage chart but Y-axis in Amps.
- Auto-scaling Y-axis (important because current varies dramatically: 0.1A to 25A).
- No reference band needed, but could add a configurable **breaker threshold line** (e.g., 25A for a typical European circuit breaker) as a dashed red horizontal line.

**Right: Active Power (W) -- Stacked area chart**
- Three stacked semi-transparent areas (Phase A on bottom, B in middle, C on top).
- The top edge of the stack = total instantaneous power.
- Stacked area is chosen over overlapping lines because:
  - Power is what you pay for, and total power is the sum of the phases.
  - Stacking shows both per-phase contribution AND total at a glance.
  - Overlapping lines for power would be confusing since you cannot add them visually.
- Fill opacity: 40% per phase, 80% combined. Line on top edge of each area for clarity.

### 5.5 Section 4 -- Energy Consumption

**Chart type**: Stacked vertical bar chart.

- One bar per day, segments colored by phase.
- Y-axis: kWh.
- Bar width should be comfortable -- not hairline thin. At 33 days of data this means bars will be well-sized.
- On hover: tooltip showing date, per-phase kWh, total kWh.
- Optionally, a **cumulative line** overlaid (secondary Y-axis on right) showing running total kWh over the period.

**Why stacked bar**: Energy is a discrete daily quantity (not continuous). Bars naturally represent "amount per bucket." Stacking shows the per-phase breakdown and the total height gives total consumption.

### 5.6 Section 5 -- Pattern Analysis

Three sub-components:

**5.6.1 Voltage Heatmap** (left half)
- X-axis: Hour of day (0-23).
- Y-axis: Day of week (Mon-Sun).
- Cell color: Sequential color scale from blue (low voltage ~210V) through white (nominal ~230V) to red (high voltage ~250V). Diverging scale centered on 230V.
- Cell value: average voltage across all data for that (hour, weekday) combination.
- This reveals patterns like "voltage drops every weekday evening 18:00-21:00" or "weekends have higher voltage during the day."

**5.6.2 Power Heatmap** (right half)
- Same structure, but color = average total power.
- Sequential scale: dark blue (low, <50W) to bright yellow/orange (high, >500W).
- Reveals usage patterns: "heavy loads on weekday mornings" etc.

**5.6.3 Hourly Average Profile** (full width, below heatmaps)
- X-axis: Hour of day (0-23).
- Y-axis: Average power (W).
- Three lines (one per phase) plus a thick "total" line in white.
- Each line = mean power at that hour, averaged over all days in the dataset.
- Shows the typical daily load shape: base load overnight, morning peak, evening peak, etc.
- **Optional enhancement**: a faint band around each line showing +/- 1 standard deviation, rendered as a semi-transparent fill.

### 5.7 Section 6 -- Summary Statistics Table

A clean data table with:
- Rows: Voltage, Current, Power, Energy -- each with Min / Max / Avg sub-rows.
- Columns: Phase A, Phase B, Phase C, Total (where applicable).
- Numbers right-aligned, monospaced font, units appended.
- Cells with anomalous values highlighted:
  - Voltage below 207V or above 253V: red background.
  - Current above 80% of breaker rating: yellow background.
- **Sparklines** in each cell (tiny inline line charts showing the metric over time) would be an excellent enhancement for v2 but are not required for v1.

---

## 6. Chart Type Justification Summary

| Metric | Chart Type | Why |
|---|---|---|
| Voltage over time | Multi-line | Continuous signal; overlaid lines reveal phase imbalance |
| Current over time | Multi-line | Same rationale as voltage |
| Active power over time | Stacked area | Shows per-phase contribution AND total simultaneously |
| Daily energy | Stacked bar | Discrete daily quantities; stacking shows composition |
| Voltage patterns | Heatmap (diverging) | 2D pattern discovery (hour x weekday) |
| Power patterns | Heatmap (sequential) | 2D pattern discovery (hour x weekday) |
| Hourly profile | Multi-line + band | Average daily shape; band shows variability |
| Status / current values | Numeric cards | Fastest to read; no chart overhead |

---

## 7. Interactivity Specification

### 7.1 Time Range Selector (Global)
- Affects Sections 2, 3, 4 (time-series charts).
- Presets: `24h`, `7d`, `30d`, `All`.
- Custom: Date-range picker (two calendar popups).
- On change: all time-series charts re-render with animation. Pattern analysis section (Section 5) also recomputes over the selected range.

### 7.2 Phase Toggle
- A set of three toggle buttons/checkboxes (`Phase A`, `Phase B`, `Phase C`), each in its phase color.
- Located below Section 2 but acts **globally** on all charts.
- Toggling a phase off fades it to ~10% opacity (not fully hidden, so the user retains context).
- At least one phase must remain active; the last toggle cannot be turned off.

### 7.3 Crosshair and Tooltips
- On any time-series chart, moving the mouse shows:
  - A vertical crosshair line.
  - A floating tooltip box anchored near the cursor.
  - Tooltip content: Timestamp + value for each visible phase.
- **Linked crosshairs**: Moving the mouse on the voltage chart also shows the crosshair at the same timestamp on the current and power charts below. This is critical for correlating events ("when voltage dropped, what happened to current?").

### 7.4 Zoom and Pan
- Time-series charts support:
  - **Click-drag to zoom**: Select a horizontal region to zoom into that time range.
  - **Scroll-wheel zoom**: Zoom in/out centered on cursor position.
  - **Pan**: When zoomed in, click-drag pans left/right.
  - **Double-click to reset**: Returns to the full selected time range.
- Zoom state should be **synchronized** across all time-series charts.

### 7.5 Hover on Heatmap
- Hovering a heatmap cell shows: "Monday 18:00-19:00: avg 221.3V (based on 5 data points)".

### 7.6 Click on Daily Bar
- Clicking a bar in the daily energy chart sets the time range to that specific day (zooms all time-series charts to that 24h period).

---

## 8. Responsive Design

### 8.1 Breakpoints

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Desktop (XL) | >= 1280px | Full layout as described above |
| Desktop (L) | 1024-1279px | Same layout, tighter margins |
| Tablet | 768-1023px | Side-by-side charts stack vertically; cards remain horizontal |
| Mobile | < 768px | Everything single-column; cards become a horizontal scroll strip |

### 8.2 Specific Adaptations

**Tablet (768-1023px)**:
- Section 3 (Current + Power): Stack vertically instead of side-by-side.
- Section 5 heatmaps: Stack vertically.
- Summary table: Horizontal scroll with sticky first column.

**Mobile (<768px)**:
- Phase status cards: Horizontal scrollable strip (swipe between phases) or collapsed accordion.
- All charts: Full width, reduced height (200px instead of 300px).
- Heatmaps: Rotated so hours are on Y-axis (portrait orientation).
- Summary table: Card-based layout (one card per metric instead of a table).
- Time range selector: Collapses into a dropdown instead of segmented control.
- Crosshair/tooltip: Tap instead of hover. Tap and hold for linked crosshair.

### 8.3 Chart Sizing

Charts should use `aspect-ratio` based sizing:
- Desktop: Chart containers are 3:1 (width:height) for time-series, 2:1 for bar charts.
- Heights never go below 180px or above 400px.
- All charts should be rendered in `<canvas>` or `<svg>` with `width: 100%` and redrawn on resize.

---

## 9. Visual Hierarchy

Ordered by visual prominence (most prominent first):

1. **Status Overview Cards** (Section 1) -- The first thing the eye hits. Large numbers, colored accents, full width. This answers "is everything OK right now?"

2. **Voltage Chart** (Section 2) -- Largest single chart on the page. Voltage quality is the most important grid health indicator.

3. **Total Power Summary Strip** -- Bold number in the summary strip (Section 1, below cards). Answers "how much am I using right now?"

4. **Power Area Chart** (Section 3, right) -- Second most important time-series. Shows consumption shape.

5. **Daily Energy Bars** (Section 4) -- Third tier. Shows cumulative impact (cost-relevant).

6. **Current Chart** (Section 3, left) -- Important but secondary to power (power = voltage x current, so power is the "result").

7. **Pattern Analysis** (Section 5) -- Analytical, not operational. Sits lower on the page.

8. **Summary Table** (Section 6) -- Reference data. Least urgent but important for reports.

---

## 10. Alerts and Thresholds

Visual indicators integrated into the dashboard (no separate alerts page needed for v1):

### 10.1 Voltage Out of Range
- If any phase's current voltage is outside 207-253V, the corresponding status card gets a pulsing red border.
- On the voltage chart, the out-of-range segments of the line are drawn thicker and in red.

### 10.2 Phase Imbalance
- If the difference between the highest and lowest phase voltages exceeds 10V, show a small warning badge on the summary strip: "Phase imbalance: 12.4V spread".

### 10.3 High Current
- If any phase current exceeds a configurable threshold (default 20A), the status card flashes the current value in red.

### 10.4 Neutral Current
- The dataset includes neutral current (`n_avg_current`). In a balanced 3-phase system, neutral current should be near zero. If `n_avg_current` > 2A, show an info indicator in the summary strip.

---

## 11. Technical Recommendations

### 11.1 Charting Library
Recommended: **Apache ECharts** or **Chart.js** (with zoom plugin).
- ECharts: Better for linked crosshairs, heatmaps, large datasets, and brush-to-zoom.
- Chart.js: Lighter weight, simpler API, but needs plugins for heatmap and zoom.
- Avoid D3 for this use case -- too low-level, development time not justified for standard chart types.

### 11.2 Data Handling
- 47,000 rows is manageable in-browser, but for >24h views, **downsample** before rendering:
  - 24h view: full resolution (1,440 points) -- fine.
  - 7d view: 5-minute averages (2,016 points) -- fine.
  - 30d view: 15-minute averages (2,880 points) -- fine.
  - All data: 1-hour averages (~792 points) -- fine.
- Downsampling should preserve min/max (use LTTB algorithm or min-max-avg bucketing) so spikes are not lost.

### 11.3 Framework
- A single-page app in vanilla JS with a bundler, or a lightweight framework (Svelte, Preact) would be appropriate.
- No need for React/Vue complexity for a single dashboard page.

### 11.4 Data Loading
- For v1: Load the CSV client-side with PapaParse, process in a Web Worker.
- For v2: A small backend (Python/Flask or Node) that pre-processes and serves JSON via API.

---

## 12. Color-Blind Accessibility Verification

The chosen phase colors (Amber #F59E0B, Blue #3B82F6, Rose #F43F5E) have been selected to remain distinguishable under:

- **Deuteranopia** (red-green): Amber appears as dull yellow, Blue stays blue, Rose appears as brownish-gold. Three distinct tones.
- **Protanopia** (red-blind): Amber appears as yellow-green, Blue stays blue, Rose appears as dark amber. Still distinguishable.
- **Tritanopia** (blue-yellow): Amber appears as pinkish, Blue appears as teal, Rose appears as red. Still distinguishable.

Additionally, line charts should use **distinct line styles** (solid, dashed, dotted) as a redundant encoding channel alongside color.

---

## 13. Status Card Detail Mockup

```
+---[ PHASE A ]----------------------------------------+
|                                                       |
|  Voltage          Current          Power              |
|  228.3 V          0.48 A           109 W              |
|                                                       |
|  Apparent Power        Power Factor                   |
|  118 VA                0.92                            |
|                                                       |
|  [|||||||||||||||||||-------] 228.3V                   |
|  207V              230V              253V              |
|  (EN 50160 tolerance band)                            |
|                                                       |
+-------------------------------------------------------+

Legend for the voltage bar:
  [green zone] = 220-240V (ideal)
  [yellow zone] = 207-220V or 240-253V (acceptable)
  [red zone] = <207V or >253V (violation)
  [black marker] = current reading position
```

---

## 14. Empty / Error States

- **No data loaded**: Show a centered upload prompt: "Drop a Shelly 3EM CSV file here, or click to browse."
- **Data loading**: Skeleton cards with pulse animation (grey rectangles where numbers will appear).
- **Partial data**: If a phase has all-zero readings, grey out that phase's card and show "No data for Phase X."
- **Stale data**: If the most recent timestamp is >1 hour old, show a banner: "Data last updated 3 hours ago."

---

## 15. Future Enhancements (Out of Scope for v1)

- **Live data via WebSocket**: Connect directly to the Shelly Pro 3EM's local API for real-time updates.
- **Cost calculator**: Configurable electricity rate with daily/monthly cost projections.
- **Anomaly detection**: Automatic flagging of unusual patterns (e.g., appliance turned on at unusual time).
- **Export**: PNG/PDF export of charts, CSV export of processed data.
- **Multi-device**: Support for monitoring multiple Shelly devices on different circuits.
- **Dark/Light toggle**: User preference for theme.
