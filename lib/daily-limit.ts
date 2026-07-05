const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidLocalDate(s: string): boolean {
  return DATE_RE.test(s);
}

/** 마지막 심은 로컬 날짜가 오늘과 다르면(또는 기록 없으면) 심기 가능. */
export function canPlant(lastLocalDate: string | null, todayLocalDate: string): boolean {
  return lastLocalDate !== todayLocalDate;
}
