import { desc, eq, gt, sql } from "drizzle-orm";
import { db, entries, reactions, reports } from "./client";

export async function createEntry(input: { content: string; deviceId: string; localDate: string }) {
  const [row] = await db
    .insert(entries)
    .values({ content: input.content, deviceId: input.deviceId, localDate: input.localDate })
    .returning({ id: entries.id, content: entries.content, createdAt: entries.createdAt });
  return { id: row.id, content: row.content, createdAt: row.createdAt.getTime() };
}

export async function lastLocalDateForDevice(deviceId: string): Promise<string | null> {
  const [row] = await db
    .select({ localDate: entries.localDate })
    .from(entries)
    .where(eq(entries.deviceId, deviceId))
    .orderBy(desc(entries.createdAt))
    .limit(1);
  return row?.localDate ?? null;
}

export async function getVisibleEntries(limit: number) {
  const rows = await db
    .select({
      id: entries.id,
      content: entries.content,
      createdAt: entries.createdAt,
      reactionCount: entries.reactionCount,
    })
    .from(entries)
    .where(eq(entries.hidden, false))
    .orderBy(desc(entries.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.getTime() }));
}

export async function addReaction(entryId: string, deviceId: string): Promise<boolean> {
  try {
    await db.insert(reactions).values({ entryId, deviceId });
  } catch {
    return false; // unique 위반 = 이미 반응함
  }
  await db
    .update(entries)
    .set({ reactionCount: sql`${entries.reactionCount} + 1` })
    .where(eq(entries.id, entryId));
  return true;
}

export async function addReport(entryId: string): Promise<void> {
  await db.insert(reports).values({ entryId });
  await db
    .update(entries)
    .set({ reportCount: sql`${entries.reportCount} + 1` })
    .where(eq(entries.id, entryId));
}

export async function listReported() {
  return db
    .select({
      id: entries.id,
      content: entries.content,
      reportCount: entries.reportCount,
      hidden: entries.hidden,
    })
    .from(entries)
    .where(gt(entries.reportCount, 0))
    .orderBy(desc(entries.reportCount));
}

export async function setHidden(entryId: string, hidden: boolean): Promise<void> {
  await db.update(entries).set({ hidden }).where(eq(entries.id, entryId));
}
