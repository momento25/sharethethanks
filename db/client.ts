import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase 연결 문자열. 서버리스/풀러(transaction 모드)에서는 prepare: false 필요.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
export const { entries, reactions, reports } = schema;
