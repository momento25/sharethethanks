import { expect, test } from "vitest";
import { resolvePhase } from "@/lib/phase";

test("낮: 오전 6시부터 저녁 7시대까지", () => {
  expect(resolvePhase(6)).toBe("day");
  expect(resolvePhase(12)).toBe("day");
  expect(resolvePhase(19)).toBe("day");
});

test("밤: 저녁 8시부터 새벽 5시대까지", () => {
  expect(resolvePhase(20)).toBe("night");
  expect(resolvePhase(23)).toBe("night");
  expect(resolvePhase(0)).toBe("night");
  expect(resolvePhase(5)).toBe("night");
});
