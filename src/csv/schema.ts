import { COLORS } from '../constants';
import type { Row, Schema } from '../types';

export const SCHEMA_3PHASE: Schema = {
  kind: '3phase',
  phases: [
    { key: 'a', name: 'Phase A', color: COLORS.phaseA },
    { key: 'b', name: 'Phase B', color: COLORS.phaseB },
    { key: 'c', name: 'Phase C', color: COLORS.phaseC },
  ],
  col(phaseKey, metric) {
    return phaseKey + '_' + metric;
  },
};

export const SCHEMA_1PHASE: Schema = {
  kind: '1phase',
  phases: [{ key: '', name: 'Voltage', color: COLORS.accent }],
  col(_phaseKey, metric) {
    return metric;
  },
};

export function detectSchema(row: Row | undefined): Schema | null {
  if (!row) return null;
  if ('a_avg_voltage' in row) return SCHEMA_3PHASE;
  if ('avg_voltage' in row) return SCHEMA_1PHASE;
  return null;
}
