export function safeNumber(input: string, fallback: number): number {
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function makeSkuBase(base: string): string {
  return base.trim().toUpperCase().replace(/\s+/g, "-");
}

export function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]]
  );
}
