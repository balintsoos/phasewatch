export interface Phase {
  readonly key: string;
  readonly name: string;
  readonly color: string;
}

export interface Schema {
  readonly kind: '3phase' | '1phase';
  readonly phases: readonly Phase[];
  col(phaseKey: string, metric: string): string;
}

export type Row = Record<string, number> & { timestamp: number };

export interface DataRange {
  min: number;
  max: number;
}

export interface Dataset {
  rawData: Row[];
  timestamps: number[];
  dataRange: DataRange;
  schema: Schema;
}

export type Point = [number, number];

export interface Band {
  min: Point[];
  max: Point[];
}
