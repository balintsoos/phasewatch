# Next Steps

Backlog of improvements to the build and codebase. Nothing here is urgent — the current setup works. Ordered by payoff.

## High value

### 1. Tree-shake ECharts

**Why:** The bundle is currently 1.07 MB (356 kB gzip) because `src/charts/*.ts` does `import * as echarts from 'echarts'`, pulling the whole library. Vite can't tree-shake a wildcard import across a lib that ships monolithic entry points. Expected savings: 60–70% off the JS bundle.

**How:**
- Replace the top-level import in every `src/charts/*.ts` with imports from `echarts/core` + specific components.
- Create a single `src/charts/echarts.ts` that re-exports a configured instance so the registration lives in one place:

  ```typescript
  // src/charts/echarts.ts
  import * as echarts from 'echarts/core';
  import { BarChart, CustomChart, LineChart } from 'echarts/charts';
  import {
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    MarkLineComponent,
    TooltipComponent,
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';

  echarts.use([
    LineChart,
    BarChart,
    CustomChart,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    MarkLineComponent,
    DataZoomComponent,
    CanvasRenderer,
  ]);

  export { echarts };
  export type { ECharts, EChartsOption } from 'echarts/core';
  ```

- Chart modules import from `./echarts` instead of `echarts`.

**Verify:** `npm run build` output shrinks; manual CSV load still renders every chart (including the custom-series voltage band and the 230V markLine).

### 2. Add Vitest for pure logic

**Why:** `src/data/downsample.ts`, `src/csv/schema.ts`, and `src/data/aggregate.ts` are pure functions with no DOM dependency — the LTTB/band math is the subtlest code in the repo and currently has zero coverage.

**How:**
- `npm i -D vitest`.
- Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- Add `src/data/downsample.test.ts`, `src/csv/schema.test.ts`, `src/data/aggregate.test.ts`.
- Minimum cases:
  - `lttbDownsample`: `threshold >= len` returns unchanged; threshold `<= 2` returns unchanged; first and last point are always preserved; a known small input matches a hand-computed expected output.
  - `downsampleBand`: bucket min/max preservation — construct a series with a known spike and assert it survives.
  - `detectSchema`: 3-phase row → `SCHEMA_3PHASE`; 1-phase row → `SCHEMA_1PHASE`; unknown row → `null`; `undefined` row → `null`.
  - `avg`: empty array → 0; non-empty → arithmetic mean.
- No DOM/jsdom needed — these are pure.

**Verify:** `npm run test` is green.

### 3. CI workflow for pull requests

**Why:** Nothing currently blocks a broken PR from merging. The Pages workflow runs on `push: main` and will deploy whatever lands.

**How:** Add `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      # - run: npm run test   # enable after step 2
```

**Verify:** Open a dummy PR with a lint error, confirm the check fails.

## Medium value

### 4. Type the ECharts tooltip formatters

**Why:** Each chart module has at least one `// eslint-disable-next-line @typescript-eslint/no-explicit-any` on the `formatter(params: any)` callback. ECharts ships proper types.

**How:** Import `CallbackDataParams` (or `TopLevelFormatterParams`) from `echarts/types/dist/shared` (or `echarts/core` depending on version) and use it for the formatter parameter. Remove the eslint-disable comments.

**Verify:** `npm run lint` + `npm run build` clean.

### 5. Factor a `renderChart` helper

**Why:** `voltage.ts`, `voltageHeatmap.ts`, `dailyEnergy.ts`, `power.ts` all repeat: file-local `let chart`, dispose if exists, `echarts.init`, `setOption`, optional `setupTimeRangeButtons` + reset-zoom wiring. One helper collapses the boilerplate.

**How:** In `src/charts/shared.ts`:

```typescript
export interface RenderChartOptions {
  dom: HTMLElement;
  option: EChartsOption;
  timeRange?: { containerId: string; resetButtonId: string; dataRange: DataRange };
}

export function renderChart(prev: ECharts | undefined, opts: RenderChartOptions): ECharts {
  prev?.dispose();
  const chart = echarts.init(opts.dom, null, { renderer: 'canvas' });
  chart.setOption(opts.option);
  if (opts.timeRange) {
    setupTimeRangeButtons(opts.timeRange.containerId, chart, opts.timeRange.dataRange);
    document.getElementById(opts.timeRange.resetButtonId)?.addEventListener('click', () => {
      chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
      setActiveButton(opts.timeRange.containerId, 'all');
    });
  }
  return chart;
}
```

Each chart module becomes `let chart; export function render(...) { chart = renderChart(chart, {...}); return chart; }`.

**Verify:** Behavior identical in dev; no regressions in resize/reload cycles.

### 6. Extract Dataset construction

**Why:** `main.ts` currently inlines filter + sort + schema detect + range calc. Pulling it into a helper tightens the entrypoint and makes the pipeline unit-testable.

**How:** Add `src/csv/dataset.ts`:

```typescript
export function buildDataset(rows: Row[]): Dataset | { error: string } {
  const filtered = rows.filter((r) => r.timestamp && !isNaN(r.timestamp));
  if (filtered.length === 0) return { error: 'No valid rows...' };
  const schema = detectSchema(filtered[0]);
  if (!schema) return { error: 'Unrecognized CSV format...' };
  filtered.sort((a, b) => a.timestamp - b.timestamp);
  const timestamps = filtered.map((r) => r.timestamp * 1000);
  return {
    rawData: filtered,
    timestamps,
    dataRange: { min: timestamps[0]!, max: timestamps[timestamps.length - 1]! },
    schema,
  };
}
```

`main.ts` handles the error-vs-dataset discriminant and keeps the `alert()` calls at the UI boundary. The helper is pure and testable.

**Verify:** Error paths for empty CSV and unknown schema still show the same alerts.

## Lower value / optional

### 7. Add a concurrency group to the Pages workflow

Already present. Could add the same to a future CI workflow (step 3 already includes it) to cancel superseded PR runs.

### 8. Path aliases

`@/charts/...` instead of `../../charts/...`. Set `paths` in `tsconfig.json` and `resolve.alias` in `vite.config.ts`. Not worth it at the current tree depth — relative imports are two levels max.

### 9. A `scripts/` directory

For dev utilities beyond `npm run *` — e.g., a tiny CSV sampler that slices `testdata/*.csv` into a smaller fixture file for tests. Only add once there is something to put in it.

### 10. Source map handling

`vite.config.ts` currently emits a 6 MB source map alongside the JS bundle. For Pages deployment that is 6 MB of extra artifact per deploy. Options: leave as-is (useful for `view-source` debugging), set `build.sourcemap: 'hidden'` (map file ships but no reference comment), or `false` for production. Low priority — Pages has no bandwidth concern.

## Pick order

If tackling piecemeal: **1 → 3 → 2** (bundle win first, then safety net, then test infrastructure to build on). **4, 5, 6** are cleanup rounds that chain naturally after that.
