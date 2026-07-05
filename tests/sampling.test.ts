import { expect, test } from "vitest";
import { sample, weightOf } from "@/lib/sampling";

const NOW = 1_000_000_000_000;

test("최근 24시간이면 가중치 3, 아니면 1", () => {
  expect(weightOf({ id: "a", createdAt: NOW - 1000 }, NOW)).toBe(3);
  expect(weightOf({ id: "b", createdAt: NOW - 48 * 3600 * 1000 }, NOW)).toBe(1);
});

test("count보다 적으면 전부 반환", () => {
  const items = [{ id: "a", createdAt: NOW }, { id: "b", createdAt: NOW }];
  const out = sample(items, 5, NOW, () => 0.5);
  expect(out).toHaveLength(2);
});

test("비복원: 중복 없이 count개", () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: String(i), createdAt: NOW }));
  const out = sample(items, 4, NOW, () => 0.5);
  expect(out).toHaveLength(4);
  expect(new Set(out.map((x) => x.id)).size).toBe(4);
});
