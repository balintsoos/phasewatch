import Papa from 'papaparse';
import type { Row } from '../types';

export function parseCsv(file: File): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      complete(results) {
        resolve(results.data);
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}
