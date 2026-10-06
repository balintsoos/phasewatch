import type { ECharts } from 'echarts';
import { COLORS } from '../constants';
import type { DataRange } from '../types';

export const tooltipStyle = {
  backgroundColor: COLORS.surface,
  borderColor: COLORS.grid,
  textStyle: { color: COLORS.text, fontSize: 12 },
};

export const dataZoomConfig = [
  {
    type: 'inside' as const,
    xAxisIndex: 0,
    filterMode: 'none' as const,
  },
  {
    type: 'slider' as const,
    xAxisIndex: 0,
    height: 30,
    bottom: 8,
    borderColor: COLORS.grid,
    backgroundColor: COLORS.bg,
    dataBackground: {
      lineStyle: { color: COLORS.accent, opacity: 0.5 },
      areaStyle: { color: COLORS.accent, opacity: 0.1 },
    },
    selectedDataBackground: {
      lineStyle: { color: COLORS.accent },
      areaStyle: { color: COLORS.accent, opacity: 0.2 },
    },
    handleStyle: { color: COLORS.accent, borderColor: COLORS.accent },
    moveHandleStyle: { color: COLORS.accent },
    fillerColor: 'rgba(34, 211, 238, 0.08)',
    textStyle: { color: COLORS.textMuted, fontSize: 10 },
    filterMode: 'none' as const,
  },
];

export function setupTimeRangeButtons(
  containerId: string,
  chart: ECharts,
  dataRange: DataRange
): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  const buttons = container.querySelectorAll<HTMLButtonElement>('button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const range = btn.dataset.range;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (range === 'all') {
        chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
      } else {
        const now = dataRange.max;
        let startTime: number | undefined;
        if (range === '24h') startTime = now - 24 * 3600 * 1000;
        else if (range === '7d') startTime = now - 7 * 24 * 3600 * 1000;
        else if (range === '30d') startTime = now - 30 * 24 * 3600 * 1000;
        if (startTime === undefined) return;

        if (startTime < dataRange.min) startTime = dataRange.min;
        const startPct = ((startTime - dataRange.min) / (dataRange.max - dataRange.min)) * 100;
        chart.dispatchAction({ type: 'dataZoom', start: startPct, end: 100 });
      }
    });
  });
}

export function setActiveButton(containerId: string, range: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  const buttons = container.querySelectorAll<HTMLButtonElement>('button');
  buttons.forEach((b) => {
    b.classList.toggle('active', b.dataset.range === range);
  });
}

export function bandColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}
