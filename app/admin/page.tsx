"use client";
import { useState } from "react";

type Row = { id: string; content: string; reportCount: number; hidden: boolean };

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/entries", { headers: { "x-admin-password": pw } });
    if (res.ok) setRows((await res.json()).entries);
    else alert("비밀번호가 틀렸어요");
  }

  async function toggle(id: string, hidden: boolean) {
    await fetch("/api/admin/entries", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ id, hidden }),
    });
    load();
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h1>신고 관리</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="관리자 비밀번호" />
        <button onClick={load}>불러오기</button>
      </div>
      <ul style={{ marginTop: 16, listStyle: "none", padding: 0 }}>
        {rows?.map((r) => (
          <li key={r.id} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
            <span style={{ opacity: r.hidden ? 0.4 : 1 }}>{r.content}</span>
            <small> (신고 {r.reportCount})</small>
            <button style={{ marginLeft: 8 }} onClick={() => toggle(r.id, !r.hidden)}>
              {r.hidden ? "복구" : "숨김"}
            </button>
          </li>
        ))}
        {rows?.length === 0 && <li>신고된 글이 없어요 🌿</li>}
      </ul>
    </main>
  );
}
