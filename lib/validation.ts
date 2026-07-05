export const MAX_LENGTH = 100;

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; reason: "empty" | "too_long" };

export function validateEntry(raw: string): ValidationResult {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, reason: "empty" };
  if (value.length > MAX_LENGTH) return { ok: false, reason: "too_long" };
  return { ok: true, value };
}
