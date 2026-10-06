import type { Dataset } from '../types';
import { formatDate } from './format';

export function renderDataInfo(container: HTMLElement, dataset: Dataset): void {
  const { rawData, dataRange } = dataset;
  const startDate = new Date(dataRange.min);
  const endDate = new Date(dataRange.max);
  const days = ((dataRange.max - dataRange.min) / 86400000).toFixed(1);
  container.innerHTML =
    `<span><span class="dot"></span> Data loaded</span>` +
    `<span>${rawData.length.toLocaleString()} records</span>` +
    `<span>${formatDate(startDate)} &mdash; ${formatDate(endDate)}</span>` +
    `<span>${days} days</span>`;
}
