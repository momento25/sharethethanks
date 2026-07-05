import { expect, test } from "vitest";
import { validateEntry } from "@/lib/validation";

test("빈 문자열/공백만 → empty", () => {
  expect(validateEntry("")).toEqual({ ok: false, reason: "empty" });
  expect(validateEntry("   ")).toEqual({ ok: false, reason: "empty" });
});

test("100자 초과 → too_long", () => {
  expect(validateEntry("가".repeat(101))).toEqual({ ok: false, reason: "too_long" });
});

test("정상 → 트림된 값 반환", () => {
  expect(validateEntry("  오늘 햇살이 좋았다  ")).toEqual({ ok: true, value: "오늘 햇살이 좋았다" });
});
