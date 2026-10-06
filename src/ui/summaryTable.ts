import { COLORS } from '../constants';
import type { Dataset } from '../types';

export function renderSummaryTable(tbody: HTMLElement, dataset: Dataset): void {
  const { rawData, schema } = dataset;
  let html = '';

  for (const p of schema.phases) {
    let minV = Infinity;
    let maxV = -Infinity;
    let sumV = 0;
    let maxI = -Infinity;
    let sumI = 0;
    let maxP = -Infinity;
    let totalE = 0;
    const n = rawData.length;

    for (const r of rawData) {
      const v = r[schema.col(p.key, 'avg_voltage')]!;
      const mn = r[schema.col(p.key, 'min_voltage')]!;
      const mx = r[schema.col(p.key, 'max_voltage')]!;
      if (mn < minV) minV = mn;
      if (mx > maxV) maxV = mx;
      sumV += v;
      const ci = r[schema.col(p.key, 'max_current')]!;
      const ai = r[schema.col(p.key, 'avg_current')]!;
      if (ci > maxI) maxI = ci;
      sumI += ai;
      const pw = r[schema.col(p.key, 'max_act_power')]!;
      if (pw > maxP) maxP = pw;
      totalE += r[schema.col(p.key, 'total_act_energy')] ?? 0;
    }

    html += `<tr>
      <td><span class="phase-label"><span class="phase-dot" style="background:${p.color}"></span>${p.name}</span></td>
      <td class="num">${minV.toFixed(2)}</td>
      <td class="num">${maxV.toFixed(2)}</td>
      <td class="num">${(sumV / n).toFixed(2)}</td>
      <td class="num">${maxI.toFixed(3)}</td>
      <td class="num">${(sumI / n).toFixed(3)}</td>
      <td class="num">${maxP.toFixed(1)}</td>
      <td class="num">${(totalE / 1000).toFixed(2)}</td>
    </tr>`;
  }

  if (schema.phases.length > 1) {
    let totalEnergy = 0;
    let totalMaxPower = -Infinity;
    for (const r of rawData) {
      let rowEnergy = 0;
      let rowPower = 0;
      for (const p of schema.phases) {
        rowEnergy += r[schema.col(p.key, 'total_act_energy')] ?? 0;
        rowPower += r[schema.col(p.key, 'max_act_power')] ?? 0;
      }
      totalEnergy += rowEnergy;
      if (rowPower > totalMaxPower) totalMaxPower = rowPower;
    }
    html += `<tr style="font-weight:600;border-top:2px solid ${COLORS.grid}">
      <td><span class="phase-label"><span class="phase-dot" style="background:${COLORS.accent}"></span>Total</span></td>
      <td class="num">&mdash;</td>
      <td class="num">&mdash;</td>
      <td class="num">&mdash;</td>
      <td class="num">&mdash;</td>
      <td class="num">&mdash;</td>
      <td class="num">${totalMaxPower.toFixed(1)}</td>
      <td class="num">${(totalEnergy / 1000).toFixed(2)}</td>
    </tr>`;
  }

  tbody.innerHTML = html;
}
