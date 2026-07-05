import { expect, test } from "vitest";
import { canPlant, isValidLocalDate } from "@/lib/daily-limit";

test("날짜 형식 검사", () => {
  expect(isValidLocalDate("2026-07-03")).toBe(true);
  expect(isValidLocalDate("2026-7-3")).toBe(false);
  expect(isValidLocalDate("hello")).toBe(false);
});

test("오늘 안 심었으면 심을 수 있음", () => {
  expect(canPlant(null, "2026-07-03")).toBe(true);
  expect(canPlant("2026-07-02", "2026-07-03")).toBe(true);
});

test("오늘 이미 심었으면 못 심음", () => {
  expect(canPlant("2026-07-03", "2026-07-03")).toBe(false);
});
