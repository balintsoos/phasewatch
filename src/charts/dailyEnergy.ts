import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { COLORS } from '../constants';
import type { Dataset } from '../types';
import { tooltipStyle } from './shared';

let chart: ECharts | undefined;

export function renderDailyEnergyChart(dom: HTMLElement, dataset: Dataset): ECharts {
  const { rawData, schema } = dataset;
  if (chart) chart.dispose();
  chart = echarts.init(dom, null, { renderer: 'canvas' });

  const daily: Record<string, Record<string, number>> = {};
  for (const r of rawData) {
    const d = new Date(r.timestamp * 1000);
    const key =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
    if (!daily[key]) {
      daily[key] = {};
      for (const p of schema.phases) daily[key]![p.key] = 0;
    }
    for (const p of schema.phases) {
      daily[key]![p.key] =
        (daily[key]![p.key] ?? 0) + (r[schema.col(p.key, 'total_act_energy')] ?? 0);
    }
  }

  const days = Object.keys(daily).sort();
  const perPhaseDaily = schema.phases.map((p) =>
    days.map((d) => +((daily[d]![p.key] ?? 0) / 1000).toFixed(3))
  );
  const dayLabels = days.map((d) => {
    const parts = d.split('-');
    return (
      parseInt(parts[2]!) + ' ' + new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })
    );
  });

  const lastIdx = schema.phases.length - 1;

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        let s = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValue}</div>`;
        let total = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const p of params as any[]) {
          total += p.value;
          s +=
            `<div style="display:flex;justify-content:space-between;gap:16px">` +
            `<span>${p.marker} ${p.seriesName}</span>` +
            `<span style="font-weight:600">${p.value.toFixed(2)} kWh</span></div>`;
        }
        if (params.length > 1) {
          s +=
            `<div style="border-top:1px solid ${COLORS.grid};margin-top:4px;padding-top:4px;display:flex;justify-content:space-between;gap:16px;font-weight:600">` +
            `<span>Total</span><span>${total.toFixed(2)} kWh</span></div>`;
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
    grid: { left: 50, right: 12, top: 36, bottom: 36 },
    xAxis: {
      type: 'category',
      data: dayLabels,
      axisLine: { lineStyle: { color: COLORS.grid } },
      axisTick: { lineStyle: { color: COLORS.grid }, alignWithLabel: true },
      axisLabel: { color: COLORS.textMuted, fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameTextStyle: { color: COLORS.textMuted, fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: COLORS.textMuted, fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.grid, type: 'dashed' } },
    },
    series: schema.phases.map((p, i) => ({
      name: p.name,
      type: 'bar',
      stack: 'energy',
      data: perPhaseDaily[i]!,
      itemStyle: {
        color: p.color,
        borderRadius: i === lastIdx ? [3, 3, 0, 0] : [0, 0, 0, 0],
      },
      barMaxWidth: 20,
    })),
  };

  chart.setOption(option);
  return chart;
}
