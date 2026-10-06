import { COLORS, VOLTAGE_MAX_SAFE, VOLTAGE_MIN_SAFE } from '../constants';
import type { Dataset } from '../types';

export function renderStatusCards(container: HTMLElement, dataset: Dataset): void {
  const { rawData, schema } = dataset;
  const latest = rawData[rawData.length - 1];
  if (!latest) return;

  const isSinglePhase = schema.phases.length === 1;
  let totalPower = 0;
  let html = '';

  for (const p of schema.phases) {
    const voltage = latest[schema.col(p.key, 'avg_voltage')]!;
    const minV = latest[schema.col(p.key, 'min_voltage')]!;
    const maxV = latest[schema.col(p.key, 'max_voltage')]!;
    const isWarning = voltage < VOLTAGE_MIN_SAFE || voltage > VOLTAGE_MAX_SAFE;
    totalPower += latest[schema.col(p.key, 'max_act_power')] ?? 0;

    const label = isSinglePhase ? 'Voltage' : p.name + ' Voltage';

    html += `
      <div class="status-card ${isWarning ? 'warning' : ''}">
        <div class="phase-indicator" style="background:${p.color}"></div>
        <div class="card-label">${label}</div>
        <div class="card-value">
          ${voltage.toFixed(1)}<span class="card-unit">V</span>
          ${isWarning ? '<span class="warning-badge">OUT OF RANGE</span>' : ''}
        </div>
        <div class="card-detail">
          Range: ${minV.toFixed(1)} &ndash; ${maxV.toFixed(1)} V
        </div>
      </div>`;
  }

  if (!isSinglePhase) {
    const detail = schema.phases
      .map(
        (p) =>
          `${p.name.replace('Phase ', '')}: ${(latest[schema.col(p.key, 'max_act_power')] ?? 0).toFixed(0)}W`
      )
      .join(' &nbsp; ');
    html += `
      <div class="status-card">
        <div class="phase-indicator" style="background:${COLORS.accent}"></div>
        <div class="card-label">Total Power (latest)</div>
        <div class="card-value" style="color:${COLORS.accent}">
          ${totalPower >= 1000 ? (totalPower / 1000).toFixed(2) : totalPower.toFixed(0)}<span class="card-unit">${totalPower >= 1000 ? 'kW' : 'W'}</span>
        </div>
        <div class="card-detail">${detail}</div>
      </div>`;
  } else {
    const single = schema.phases[0]!;
    const power = latest[schema.col(single.key, 'max_act_power')] ?? 0;
    html += `
      <div class="status-card">
        <div class="phase-indicator" style="background:${COLORS.accent}"></div>
        <div class="card-label">Power (latest)</div>
        <div class="card-value" style="color:${COLORS.accent}">
          ${power >= 1000 ? (power / 1000).toFixed(2) : power.toFixed(0)}<span class="card-unit">${power >= 1000 ? 'kW' : 'W'}</span>
        </div>
      </div>`;
  }

  container.innerHTML = html;
}
