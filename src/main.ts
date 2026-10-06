import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import type { ECharts } from 'echarts';
import { parseCsv } from './csv/load';
import { detectSchema } from './csv/schema';
import { renderDailyEnergyChart } from './charts/dailyEnergy';
import { renderPowerChart } from './charts/power';
import { renderVoltageChart } from './charts/voltage';
import { renderVoltageHeatmap } from './charts/voltageHeatmap';
import type { Dataset, Row } from './types';
import { renderDataInfo } from './ui/dataInfo';
import { wireFileDrop } from './ui/fileDrop';
import { renderStatusCards } from './ui/statusCards';
import { renderSummaryTable } from './ui/summaryTable';

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el as T;
}

const fileInput = byId<HTMLInputElement>('file-input');
const fileNameEl = byId('file-name');
const welcomeScreen = byId('welcome-screen');
const dashboard = byId('dashboard');
const loadingOverlay = byId('loading-overlay');
const loadingText = byId('loading-text');
const dropZone = byId('drop-zone');

const charts: ECharts[] = [];

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (...args: unknown[]) {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  } as T;
}

async function loadFile(file: File): Promise<void> {
  fileNameEl.textContent = file.name;
  loadingText.textContent = 'Parsing CSV data...';
  loadingOverlay.classList.add('active');

  try {
    const data = await parseCsv(file);
    loadingText.textContent = 'Processing data...';
    // Yield so the loading overlay repaints
    await new Promise((r) => setTimeout(r, 50));
    processData(data);
  } catch (err) {
    alert('Error parsing CSV: ' + (err instanceof Error ? err.message : String(err)));
  } finally {
    loadingOverlay.classList.remove('active');
  }
}

function processData(data: Row[]): void {
  const filtered = data.filter((r) => r.timestamp && !isNaN(r.timestamp));
  if (filtered.length === 0) {
    alert('No valid rows found in CSV. The file must contain a "timestamp" column with numeric values.');
    return;
  }

  const schema = detectSchema(filtered[0]);
  if (!schema) {
    alert(
      'Unrecognized CSV format. Expected Shelly Pro 3EM (columns like "a_avg_voltage") or Shelly 1EM / Pro EM (columns like "avg_voltage").'
    );
    return;
  }

  filtered.sort((a, b) => a.timestamp - b.timestamp);
  const timestamps = filtered.map((r) => r.timestamp * 1000);
  const dataset: Dataset = {
    rawData: filtered,
    timestamps,
    dataRange: { min: timestamps[0]!, max: timestamps[timestamps.length - 1]! },
    schema,
  };

  welcomeScreen.style.display = 'none';
  dashboard.classList.add('active');

  renderDataInfo(byId('data-info'), dataset);
  renderStatusCards(byId('status-cards'), dataset);

  charts.length = 0;
  charts.push(renderVoltageChart(byId('voltage-chart'), dataset));
  charts.push(renderVoltageHeatmap(byId('voltage-heatmap-chart'), dataset));
  charts.push(renderDailyEnergyChart(byId('daily-energy-chart'), dataset));
  charts.push(renderPowerChart(byId('power-chart'), dataset));

  renderSummaryTable(byId('summary-tbody'), dataset);
}

window.addEventListener(
  'resize',
  debounce(() => {
    for (const c of charts) c.resize();
  }, 200)
);

wireFileDrop({ fileInput, dropZone, onFile: loadFile });
