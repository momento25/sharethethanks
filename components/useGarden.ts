"use client";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { resolvePhase, type Phase } from "@/lib/phase";
import { getDeviceId } from "@/lib/device";
import { getLocalDate, getLocalHour } from "@/lib/client-time";

export type Entry = { id: string; content: string; createdAt: number; reactionCount: number };

const subscribe = () => () => {};

export function useGarden() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [planted, setPlanted] = useState(false);

  // phase는 보는 사람의 브라우저 로컬 시각에서 파생된다.
  // 서버 스냅샷은 "day"로 고정해 하이드레이션 불일치를 피하고, 클라이언트에서 실제 시각으로 확정된다.
  const phase = useSyncExternalStore<Phase>(
    subscribe,
    () => resolvePhase(getLocalHour()),
    () => "day",
  );

  useEffect(() => {
    fetch("/api/entries")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {});
  }, []);

  const plant = useCallback(async (content: string) => {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": getDeviceId() },
      body: JSON.stringify({ content, localDate: getLocalDate() }),
    });
    if (res.status === 201) {
      const { entry } = await res.json();
      setEntries((prev) => [{ ...entry, reactionCount: 0 }, ...prev]);
      setPlanted(true);
      return { ok: true as const };
    }
    const { error } = await res.json().catch(() => ({ error: "unknown" }));
    if (error === "already_today") setPlanted(true);
    return { ok: false as const, error };
  }, []);

  const react = useCallback(async (id: string) => {
    await fetch(`/api/entries/${id}/react`, {
      method: "POST",
      headers: { "x-device-id": getDeviceId() },
    }).catch(() => {});
  }, []);

  const report = useCallback(async (id: string) => {
    await fetch(`/api/entries/${id}/report`, { method: "POST" }).catch(() => {});
  }, []);

  return { entries, phase, planted, plant, react, report };
}
