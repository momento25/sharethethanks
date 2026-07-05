export type Phase = "day" | "night";

/** 로컬 시각(0-23)을 받아 낮/밤을 판정한다. 낮 06:00–19:59, 밤 20:00–05:59. */
export function resolvePhase(hour: number): Phase {
  return hour >= 6 && hour < 20 ? "day" : "night";
}
