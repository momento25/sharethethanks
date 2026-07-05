import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { listReported, setHidden } from "@/db/repository";

function guard(req: Request) {
  return checkAdmin(req.headers.get("x-admin-password"));
}

export async function GET(req: Request) {
  if (!guard(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ entries: await listReported() });
}

export async function PATCH(req: Request) {
  if (!guard(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }
  await setHidden(body.id, body.hidden);
  return NextResponse.json({ ok: true });
}
