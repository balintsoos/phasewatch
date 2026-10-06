import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { COLORS } from '../constants';
import { avg } from '../data/aggregate';
import type { Dataset } from '../types';
import { tooltipStyle } from './shared';

let chart: ECharts | undefined;

export function renderVoltageHeatmap(dom: HTMLElement, dataset: Dataset): ECharts {
  const { rawData, schema } = dataset;
  if (chart) chart.dispose();
  chart = echarts.init(dom, null, { renderer: 'canvas' });

  const hourlyData: Record<number, Record<string, number[]>> = {};
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = {};
    for (const p of schema.phases) hourlyData[h]![p.key] = [];
  }

  for (const r of rawData) {
    const h = new Date(r.timestamp * 1000).getHours();
    for (const p of schema.phases) {
      hourlyData[h]![p.key]!.push(r[schema.col(p.key, 'avg_voltage')]!);
    }
  }

  const hours: string[] = [];
  const perPhaseHourly: number[][] = schema.phases.map(() => []);
  for (let h = 0; h < 24; h++) {
    hours.push(h + ':00');
    schema.phases.forEach((p, i) => {
      perPhaseHourly[i]!.push(avg(hourlyData[h]![p.key]!));
    });
  }

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        let s = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValue}</div>`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const p of params as any[]) {
          s +=
            `<div style="display:flex;justify-content:space-between;gap:16px">` +
            `<span>${p.marker} ${p.seriesName}</span>` +
            `<span style="font-weight:600">${p.value.toFixed(2)} V</span></div>`;
        }
        return s;
      },
    },
    legend: {
      data: schema.phases.map((p) => p.name),
      top: 0,
      right: 0,
      textStyle: { color: COLORS.textMuted, fontSize: 11 },
      itemWidth: 14,
      itemHeight: 3,
    },
    grid: { left: 50, right: 12, top: 36, bottom: 28 },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: COLORS.grid } },
      axisTick: { lineStyle: { color: COLORS.grid }, alignWithLabel: true },
      axisLabel: { color: COLORS.textMuted, fontSize: 10, interval: 1 },
    },
    yAxis: {
      type: 'value',
      name: 'V',
      nameTextStyle: { color: COLORS.textMuted, fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: COLORS.textMuted, fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.grid, type: 'dashed' } },
      scale: true,
    },
    series: schema.phases.map((p, i) => ({
      name: p.name,
      type: 'bar',
      data: perPhaseHourly[i]!,
      itemStyle: { color: p.color, borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 12,
    })),
  };

  chart.setOption(option);
  return chart;
}
