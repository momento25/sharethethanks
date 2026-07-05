// MVP 최소 한국어 금칙어. 신고/관리자 숨김이 2차 방어선이므로 완벽할 필요는 없다.
const BANNED = ["시발", "씨발", "병신", "개새끼", "좆", "지랄", "fuck", "shit"];

/** 공백 제거 + 소문자화 후 금칙어 부분일치 검사. */
export function containsProfanity(text: string): boolean {
  const normalized = text.replace(/\s+/g, "").toLowerCase();
  return BANNED.some((word) => normalized.includes(word));
}
