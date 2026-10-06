export function avg(arr: readonly number[]): number {
  if (arr.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i]!;
  return s / arr.length;
}
