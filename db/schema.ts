import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const entries = pgTable("entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  deviceId: text("device_id").notNull(),
  localDate: text("local_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  reactionCount: integer("reaction_count").default(0).notNull(),
  reportCount: integer("report_count").default(0).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
});

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id").notNull().references(() => entries.id),
    deviceId: text("device_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uniq_reaction").on(t.entryId, t.deviceId)],
);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id").notNull().references(() => entries.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
