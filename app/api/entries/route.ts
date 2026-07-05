import { NextResponse } from "next/server";
import { validateEntry } from "@/lib/validation";
import { containsProfanity } from "@/lib/profanity";
import { canPlant, isValidLocalDate } from "@/lib/daily-limit";
import { sample } from "@/lib/sampling";
import { createEntry, getVisibleEntries, lastLocalDateForDevice } from "@/db/repository";

const POOL = 200;
const SHOW = 50;

export async function POST(req: Request) {
  const deviceId = req.headers.get("x-device-id");
  if (!deviceId) return NextResponse.json({ error: "no_device" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || typeof body.localDate !== "string") {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }
  if (!isValidLocalDate(body.localDate)) {
    return NextResponse.json({ error: "bad_date" }, { status: 400 });
  }

  const v = validateEntry(body.content);
  if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 400 });
  if (containsProfanity(v.value)) {
    return NextResponse.json({ error: "profanity" }, { status: 422 });
  }

  const last = await lastLocalDateForDevice(deviceId);
  if (!canPlant(last, body.localDate)) {
    return NextResponse.json({ error: "already_today" }, { status: 409 });
  }

  const entry = await createEntry({ content: v.value, deviceId, localDate: body.localDate });
  return NextResponse.json({ entry }, { status: 201 });
}

export async function GET() {
  const pool = await getVisibleEntries(POOL);
  const now = Date.now();
  const picked = sample(pool, SHOW, now, Math.random);
  return NextResponse.json({ entries: picked });
}
