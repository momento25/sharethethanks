"use client";
import { useState } from "react";
import type { Phase } from "@/lib/phase";
import type { Entry } from "./useGarden";

export function GratitudeItem({
  entry,
  phase,
  onReact,
  onReport,
}: {
  entry: Entry;
  phase: Phase;
  onReact: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sparkle, setSparkle] = useState(false);

  function react() {
    setSparkle(true);
    onReact(entry.id);
    setTimeout(() => setSparkle(false), 700);
  }

  return (
    <div className="gg-item">
      <button
        className={`gg-token gg-${phase} ${sparkle ? "gg-sparkle" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {phase === "day" ? "🌼" : "⭐"}
      </button>
      {open && (
        <div className="gg-bubble">
          <p>{entry.content}</p>
          <div className="gg-bubble-actions">
            <button onClick={react}>마음 전하기 🤍</button>
            <button onClick={() => onReport(entry.id)} className="gg-report">
              신고
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
