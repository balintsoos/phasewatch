import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { COLORS, MAX_POINTS } from '../constants';
import { downsampleBand, downsampleSeries } from '../data/downsample';
import type { Band, Dataset } from '../types';
import { formatDateTime } from '../ui/format';
import {
  bandColor,
  dataZoomConfig,
  setActiveButton,
  setupTimeRangeButtons,
  tooltipStyle,
} from './shared';

let chart: ECharts | undefined;

type BandRow = [number, number, number, number, number, number];

function buildBandData(band: Band): BandRow[] {
  const result: BandRow[] = [];
  const first = band.min[0];
  const firstMax = band.max[0];
  if (!first || !firstMax) return result;
  result.push([first[0], first[1], firstMax[1], first[0], first[1], firstMax[1]]);
  for (let i = 1; i < band.min.length; i++) {
    const curMin = band.min[i]!;
    const curMax = band.max[i]!;
    const prevMin = band.min[i - 1]!;
    const prevMax = band.max[i - 1]!;
    result.push([curMin[0], curMin[1], curMax[1], prevMin[0], prevMin[1], prevMax[1]]);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBandItem(params: any, api: any): unknown {
  if (params.dataIndex === 0) return;
  const currCoord0 = api.coord([api.value(0), api.value(1)]);
  const currCoord1 = api.coord([api.value(0), api.value(2)]);
  const prevCoord0 = api.coord([api.value(3), api.value(4)]);
  const prevCoord1 = api.coord([api.value(3), api.value(5)]);
  return {
    type: 'polygon',
    shape: {
      points: [prevCoord1, currCoord1, currCoord0, prevCoord0],
    },
    style: api.style(),
  };
}

export function renderVoltageChart(dom: HTMLElement, dataset: Dataset): ECharts {
  const { rawData, timestamps, dataRange, schema } = dataset;
  if (chart) chart.dispose();
  chart = echarts.init(dom, null, { renderer: 'canvas' });

  const perPhase = schema.phases.map((p) => {
    const avgSeries = rawData.map((r) => r[schema.col(p.key, 'avg_voltage')]!);
    const minSeries = rawData.map((r) => r[schema.col(p.key, 'min_voltage')]!);
    const maxSeries = rawData.map((r) => r[schema.col(p.key, 'max_voltage')]!);
    return {
      phase: p,
      avgDS: downsampleSeries(timestamps, avgSeries, MAX_POINTS),
      band: downsampleBand(timestamps, minSeries, maxSeries, MAX_POINTS),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesList: any[] = [];
  for (const pp of perPhase) {
    seriesList.push({
      name: pp.phase.name + ' Band',
      type: 'custom',
      renderItem: renderBandItem,
      dimensions: ['ts', 'min', 'max', 'prevTs', 'prevMin', 'prevMax'],
      encode: { x: 0, y: [1, 2] },
      data: buildBandData(pp.band),
      itemStyle: { color: bandColor(pp.phase.color) },
      z: 1,
      silent: true,
    });
  }
  seriesList.push({
    name: '230V Nominal',
    type: 'line',
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { color: COLORS.nominal, type: 'dashed', width: 1.5 },
      label: {
        show: true,
        formatter: '230V',
        color: COLORS.textMuted,
        fontSize: 10,
        position: 'insideEndTop',
      },
      data: [{ yAxis: 230 }],
    },
    data: [],
    symbol: 'none',
    lineStyle: { opacity: 0 },
  });
  for (const pp of perPhase) {
    seriesList.push({
      name: pp.phase.name,
      type: 'line',
      data: pp.avgDS,
      symbol: 'none',
      lineStyle: { width: 1.8, color: pp.phase.color },
      itemStyle: { color: pp.phase.color },
      z: 5,
    });
  }

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        if (!params || params.length === 0) return '';
        const d = new Date(params[0].value[0]);
        let s = `<div style="font-weight:600;margin-bottom:6px">${formatDateTime(d)}</div>`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const p of params as any[]) {
          if (p.seriesName.includes('Band')) continue;
          if (p.seriesName === '230V Nominal') continue;
          s +=
            `<div style="display:flex;justify-content:space-between;gap:16px">` +
            `<span>${p.marker} ${p.seriesName}</span>` +
            `<span style="font-weight:600">${p.value[1].toFixed(2)} V</span></div>`;
        }
        return s;
      },
    },
    legend: {
      data: schema.phases.map((p) => p.name),
      top: 0,
      right: 0,
      textStyle: { color: COLORS.textMuted },
      itemWidth: 16,
      itemHeight: 3,
      selectedMode: true,
    },
    grid: { left: 60, right: 20, top: 40, bottom: 70 },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: COLORS.grid } },
      axisTick: { lineStyle: { color: COLORS.grid } },
      axisLabel: { color: COLORS.textMuted, fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Voltage (V)',
      nameTextStyle: { color: COLORS.textMuted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: COLORS.textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: COLORS.grid, type: 'dashed' } },
      scale: true,
    },
    dataZoom: dataZoomConfig,
    series: seriesList,
  };

  chart.setOption(option);

  setupTimeRangeButtons('voltage-time-range', chart, dataRange);
  const resetBtn = document.getElementById('voltage-reset-zoom');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      chart!.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
      setActiveButton('voltage-time-range', 'all');
    });
  }

  return chart;
}
