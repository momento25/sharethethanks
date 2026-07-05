export type Sampleable = { id: string; createdAt: number };

const DAY_MS = 24 * 3600 * 1000;

export function weightOf(item: Sampleable, now: number): number {
  return now - item.createdAt <= DAY_MS ? 3 : 1;
}

/** 가중치 기반 비복원 추출. rand는 [0,1) 난수 주입(테스트 고정 가능). */
export function sample<T extends Sampleable>(
  items: T[],
  count: number,
  now: number,
  rand: () => number,
): T[] {
  const pool = items.slice();
  const result: T[] = [];
  const take = Math.min(count, pool.length);
  for (let n = 0; n < take; n++) {
    const weights = pool.map((it) => weightOf(it, now));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    let idx = 0;
    while (idx < weights.length - 1 && r >= weights[idx]) {
      r -= weights[idx];
      idx++;
    }
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
