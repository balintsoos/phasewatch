import type { Band, Point } from '../types';

export function lttbDownsample(
  xArr: readonly number[],
  yArr: readonly number[],
  threshold: number
): { x: number[]; y: number[] } {
  const len = xArr.length;
  if (threshold >= len || threshold <= 2) {
    return { x: xArr.slice(), y: yArr.slice() };
  }
  const sampledX: number[] = [xArr[0]!];
  const sampledY: number[] = [yArr[0]!];
  const every = (len - 2) / (threshold - 2);

  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    let avgRangeEnd = Math.floor((i + 2) * every) + 1;
    if (avgRangeEnd > len) avgRangeEnd = len;
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += xArr[j]!;
      avgY += yArr[j]!;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    const rangeOffs = Math.floor(i * every) + 1;
    let rangeTo = Math.floor((i + 1) * every) + 1;
    if (rangeTo > len) rangeTo = len;

    let maxArea = -1;
    let nextA = rangeOffs;
    const pointAX = xArr[a]!;
    const pointAY = yArr[a]!;
    for (let j = rangeOffs; j < rangeTo; j++) {
      const area =
        Math.abs(
          (pointAX - avgX) * (yArr[j]! - pointAY) - (pointAX - xArr[j]!) * (avgY - pointAY)
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }
    sampledX.push(xArr[nextA]!);
    sampledY.push(yArr[nextA]!);
    a = nextA;
  }
  sampledX.push(xArr[len - 1]!);
  sampledY.push(yArr[len - 1]!);
  return { x: sampledX, y: sampledY };
}

export function downsampleSeries(
  timestamps: readonly number[],
  values: readonly number[],
  maxPoints: number
): Point[] {
  if (timestamps.length <= maxPoints) {
    return timestamps.map((t, i) => [t, values[i]!]);
  }
  const result = lttbDownsample(timestamps, values, maxPoints);
  return result.x.map((t, i) => [t, result.y[i]!]);
}

export function downsampleBand(
  timestamps: readonly number[],
  minVals: readonly number[],
  maxVals: readonly number[],
  maxPoints: number
): Band {
  const len = timestamps.length;
  if (len <= maxPoints) {
    return {
      min: timestamps.map((t, i) => [t, minVals[i]!]),
      max: timestamps.map((t, i) => [t, maxVals[i]!]),
    };
  }
  const bucket = Math.ceil(len / maxPoints);
  const minResult: Point[] = [];
  const maxResult: Point[] = [];
  for (let i = 0; i < len; i += bucket) {
    const end = Math.min(i + bucket, len);
    let lo = Infinity;
    let hi = -Infinity;
    const midIdx = Math.min(i + Math.floor(bucket / 2), len - 1);
    for (let j = i; j < end; j++) {
      if (minVals[j]! < lo) lo = minVals[j]!;
      if (maxVals[j]! > hi) hi = maxVals[j]!;
    }
    minResult.push([timestamps[midIdx]!, lo]);
    maxResult.push([timestamps[midIdx]!, hi]);
  }
  return { min: minResult, max: maxResult };
}
