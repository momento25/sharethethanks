import { NextResponse } from "next/server";
import { addReaction } from "@/db/repository";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deviceId = req.headers.get("x-device-id");
  if (!deviceId) return NextResponse.json({ error: "no_device" }, { status: 400 });
  const added = await addReaction(id, deviceId);
  return NextResponse.json({ ok: true, added });
}
