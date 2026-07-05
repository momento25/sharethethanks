import { expect, test } from "vitest";
import { containsProfanity } from "@/lib/profanity";

test("금칙어 포함 시 true", () => {
  expect(containsProfanity("이 시발 왜이래")).toBe(true);
});

test("공백으로 회피해도 정규화 후 탐지", () => {
  expect(containsProfanity("시 발")).toBe(true);
});

test("정상 문장은 false", () => {
  expect(containsProfanity("오늘 친구가 밥을 사줬다")).toBe(false);
});
