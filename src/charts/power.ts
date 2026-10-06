import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { COLORS, MAX_POINTS } from '../constants';
import { downsampleSeries } from '../data/downsample';
import type { Dataset } from '../types';
import { formatDateTime } from '../ui/format';
import { dataZoomConfig, setActiveButton, setupTimeRangeButtons, tooltipStyle } from './shared';

let chart: ECharts | undefined;

export function renderPowerChart(dom: HTMLElement, dataset: Dataset): ECharts {
  const { rawData, timestamps, dataRange, schema } = dataset;
  if (chart) chart.dispose();
  chart = echarts.init(dom, null, { renderer: 'canvas' });

  const perPhase = schema.phases.map((p) => {
    const power = rawData.map((r) => r[schema.col(p.key, 'max_act_power')] ?? 0);
    return { phase: p, dataDS: downsampleSeries(timestamps, power, MAX_POINTS) };
  });

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
        let total = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const p of params as any[]) {
          total += p.value[1];
          s +=
            `<div style="display:flex;justify-content:space-between;gap:16px">` +
            `<span>${p.marker} ${p.seriesName}</span>` +
            `<span style="font-weight:600">${p.value[1].toFixed(1)} W</span></div>`;
        }
        if (params.length > 1) {
          s +=
            `<div style="border-top:1px solid ${COLORS.grid};margin-top:4px;padding-top:4px;display:flex;justify-content:space-between;gap:16px;font-weight:600">` +
            `<span>Total</span><span>${total.toFixed(1)} W</span></div>`;
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
      name: 'Power (W)',
      nameTextStyle: { color: COLORS.textMuted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: COLORS.textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: COLORS.grid, type: 'dashed' } },
    },
    dataZoom: dataZoomConfig,
    series: perPhase.map((pp) => ({
      name: pp.phase.name,
      type: 'line',
      stack: 'power',
      data: pp.dataDS,
      symbol: 'none',
      lineStyle: { width: 0 },
      areaStyle: { color: pp.phase.color, opacity: 0.7 },
      itemStyle: { color: pp.phase.color },
      emphasis: { focus: 'series' },
      large: true,
    })),
  };

  chart.setOption(option);

  setupTimeRangeButtons('power-time-range', chart, dataRange);
  const resetBtn = document.getElementById('power-reset-zoom');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      chart!.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
      setActiveButton('power-time-range', 'all');
    });
  }

  return chart;
}
