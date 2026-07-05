import { NextResponse } from "next/server";
import { addReport } from "@/db/repository";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await addReport(id);
  return NextResponse.json({ ok: true });
}
