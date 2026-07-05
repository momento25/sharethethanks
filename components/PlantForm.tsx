"use client";
import { useState } from "react";
import { MAX_LENGTH } from "@/lib/validation";

export function PlantForm({
  planted,
  onPlant,
}: {
  planted: boolean;
  onPlant: (content: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  if (planted) {
    return <p className="gg-plant-done">오늘의 감사는 이미 피었어요. 내일 또 만나요 🌙</p>;
  }

  async function submit() {
    const res = await onPlant(text);
    if (res.ok) {
      setText("");
      setMsg(null);
    } else if (res.error === "profanity") {
      setMsg("조금 더 다정한 말로 남겨볼까요 🌱");
    } else if (res.error === "already_today") {
      setMsg(null);
    } else {
      setMsg("잠시 후 다시 시도해주세요");
    }
  }

  return (
    <div className="gg-plant">
      <input
        value={text}
        maxLength={MAX_LENGTH}
        placeholder="오늘 감사했던 일을 한 줄 남겨보세요"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button onClick={submit} disabled={text.trim().length === 0}>
        심기
      </button>
      {msg && <small className="gg-msg">{msg}</small>}
    </div>
  );
}
