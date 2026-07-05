# 감사의 정원 (Gratitude Garden) MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 익명으로 하루 한 줄 감사를 남기면 낮엔 꽃·밤엔 별이 되어 하나의 풍경을 이루고, 서로의 감사를 랜덤하게 감상하며 조용한 반응을 나누는 웹앱을 만든다.

**Architecture:** Next.js(App Router) 단일 앱. 순수 로직(시간대 판정, 비속어 필터, 검증, 샘플링, 하루제한)을 `lib/`에 두고 단위 테스트로 고정한다. DB 접근은 얇은 repository로 격리하고, API Route Handler는 `lib` + repository를 호출하는 얇은 층으로 유지한다. 낮/밤 표현 분기와 애니메이션은 렌더링 레이어에서만 처리하며, 데이터는 하나다. 디자인 v0 시안이 나오기 전까지는 기능이 동작하는 최소 스타일로 만들고, 이후 같은 컴포넌트를 리스킨한다.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, Supabase Postgres, Drizzle ORM(postgres-js 드라이버), Vitest, 순수 CSS 애니메이션.

## Global Constraints

- 언어: TypeScript, strict 모드.
- 감사글: 최대 100자, 공백 트림 후 비어있으면 거부, 완전 익명(닉네임 없음).
- 하루 하나 제한: 기기(브라우저) 기준. 기기 식별은 클라이언트가 생성한 UUID를 `x-device-id` 헤더로 전송. 하루 경계는 **사용자 로컬 자정**(클라이언트가 `localDate`=`YYYY-MM-DD` 문자열을 함께 전송).
- 낮/밤 경계: 낮 `06:00–19:59`, 밤 `20:00–05:59`. 판정 기준은 **보는 사람의 로컬 현재 시각**(클라이언트에서 계산). 저장 데이터는 시간대와 무관.
- 반응: "마음 전하기" 1종만. 댓글 없음. 기기당 글 1회. 반응 수는 강조 표시하지 않음.
- 안전장치: 심을 때 한국어 비속어 1차 필터, 각 글 신고 가능, 관리자만 숨김 처리. 숨겨진 글은 조회에서 제외.
- 반응·조회는 절대 500으로 죽지 않고 조용히 실패 처리(UI는 평온 유지).
- 패키지 매니저: `npm`.
- 환경변수: `DATABASE_URL`(Supabase Postgres 연결 문자열 — 런타임은 **Connection Pooler(port 6543, transaction 모드)**, `db:push`(DDL)는 **Direct connection(port 5432)** 권장), `ADMIN_PASSWORD`(관리자 게이트).

---

## File Structure

```
gratitude-garden/
├─ app/
│  ├─ layout.tsx                # 루트 레이아웃, 전역 CSS
│  ├─ page.tsx                  # 메인: 풍경 + 심기 (클라이언트 셸)
│  ├─ globals.css               # Tailwind + CSS 애니메이션 키프레임
│  ├─ admin/page.tsx            # 관리자 페이지(보호)
│  └─ api/
│     ├─ entries/route.ts               # POST 심기 / GET 랜덤
│     ├─ entries/[id]/react/route.ts    # POST 마음 전하기
│     ├─ entries/[id]/report/route.ts   # POST 신고
│     └─ admin/entries/route.ts         # GET 신고목록 / PATCH 숨김
├─ lib/
│  ├─ phase.ts                  # 낮/밤 판정 (순수)
│  ├─ profanity.ts              # 비속어 필터 (순수)
│  ├─ validation.ts             # 감사글 검증 (순수)
│  ├─ sampling.ts               # 랜덤 가중 샘플링 (순수, seedable)
│  ├─ daily-limit.ts            # 하루제한 날짜 로직 (순수)
│  ├─ device.ts                 # 클라이언트 기기 UUID (localStorage)
│  ├─ client-time.ts            # 클라이언트 로컬 날짜/시각
│  └─ admin-auth.ts             # 관리자 비밀번호 확인
├─ db/
│  ├─ schema.ts                 # Drizzle 테이블 정의
│  ├─ client.ts                 # Drizzle 클라이언트
│  └─ repository.ts             # 데이터 접근 함수
├─ components/
│  ├─ Scene.tsx                 # 풍경 컨테이너(낮/밤 배경 + 아이템 배치)
│  ├─ GratitudeItem.tsx         # 꽃/별 하나 + 반응 인터랙션
│  ├─ PlantForm.tsx             # 심기 입력창 + 피어남 트리거
│  └─ useGarden.ts              # 데이터 훅
├─ tests/                       # Vitest 단위 테스트 (lib 미러링)
├─ drizzle.config.ts
├─ vitest.config.ts
└─ package.json
```

---

## Task 1: 프로젝트 스캐폴드 (Next.js + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tests/smoke.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 동작하는 Next.js 앱, `npm test`로 Vitest 실행 가능.

- [ ] **Step 1: 프로젝트 생성**

프로젝트 폴더에 이미 문서(`PRD.md`, `SPEC.md`, `docs/`)와 git 저장소가 있으므로, 빈 임시 폴더에 스캐폴드한 뒤 병합한다(create-next-app은 비어있지 않은 폴더에서 충돌 에러를 냄).

Run:
```bash
npx create-next-app@latest /tmp/gg-scaffold --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm
rsync -a --exclude '.git' /tmp/gg-scaffold/ ~/gratitude-garden/
rm -rf /tmp/gg-scaffold
```
Expected: `~/gratitude-garden`에 `app/`, `package.json` 등이 생성되고 기존 문서는 유지됨.

- [ ] **Step 2: Vitest 설치**

Run:
```bash
npm install -D vitest
```

- [ ] **Step 3: vitest 설정 작성**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 4: test 스크립트 추가**

Modify `package.json` scripts 에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: 스모크 테스트 작성**

Create `tests/smoke.test.ts`:
```typescript
import { expect, test } from "vitest";

test("smoke: math works", () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (1 passed)

- [ ] **Step 7: 커밋**

git 저장소는 이미 초기화되어 있다(컨트롤러가 부트스트랩). 스캐폴드 결과를 커밋만 한다.

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

## Task 2: 낮/밤 판정 로직 (lib/phase.ts)

**Files:**
- Create: `lib/phase.ts`, `tests/phase.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `export type Phase = "day" | "night"`; `export function resolvePhase(hour: number): Phase` — 0–23 정수 시각(로컬)을 받아 `06:00–19:59`→`"day"`, 그 외→`"night"`.

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/phase.test.ts`:
```typescript
import { expect, test } from "vitest";
import { resolvePhase } from "@/lib/phase";

test("낮: 오전 6시부터 저녁 7시대까지", () => {
  expect(resolvePhase(6)).toBe("day");
  expect(resolvePhase(12)).toBe("day");
  expect(resolvePhase(19)).toBe("day");
});

test("밤: 저녁 8시부터 새벽 5시대까지", () => {
  expect(resolvePhase(20)).toBe("night");
  expect(resolvePhase(23)).toBe("night");
  expect(resolvePhase(0)).toBe("night");
  expect(resolvePhase(5)).toBe("night");
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- phase`
Expected: FAIL ("Cannot find module '@/lib/phase'")

- [ ] **Step 3: 구현**

Create `lib/phase.ts`:
```typescript
export type Phase = "day" | "night";

/** 로컬 시각(0-23)을 받아 낮/밤을 판정한다. 낮 06:00–19:59, 밤 20:00–05:59. */
export function resolvePhase(hour: number): Phase {
  return hour >= 6 && hour < 20 ? "day" : "night";
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- phase`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/phase.ts tests/phase.test.ts
git commit -m "feat: add day/night phase resolver"
```

---

## Task 3: 감사글 검증 로직 (lib/validation.ts)

**Files:**
- Create: `lib/validation.ts`, `tests/validation.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `export const MAX_LENGTH = 100`; `export type ValidationResult = { ok: true; value: string } | { ok: false; reason: "empty" | "too_long" }`; `export function validateEntry(raw: string): ValidationResult` — 트림 후 빈 문자열이면 `empty`, 100자 초과면 `too_long`, 아니면 트림된 값 반환.

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/validation.test.ts`:
```typescript
import { expect, test } from "vitest";
import { validateEntry } from "@/lib/validation";

test("빈 문자열/공백만 → empty", () => {
  expect(validateEntry("")).toEqual({ ok: false, reason: "empty" });
  expect(validateEntry("   ")).toEqual({ ok: false, reason: "empty" });
});

test("100자 초과 → too_long", () => {
  expect(validateEntry("가".repeat(101))).toEqual({ ok: false, reason: "too_long" });
});

test("정상 → 트림된 값 반환", () => {
  expect(validateEntry("  오늘 햇살이 좋았다  ")).toEqual({ ok: true, value: "오늘 햇살이 좋았다" });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- validation`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `lib/validation.ts`:
```typescript
export const MAX_LENGTH = 100;

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; reason: "empty" | "too_long" };

export function validateEntry(raw: string): ValidationResult {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, reason: "empty" };
  if (value.length > MAX_LENGTH) return { ok: false, reason: "too_long" };
  return { ok: true, value };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- validation`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/validation.ts tests/validation.test.ts
git commit -m "feat: add gratitude entry validation"
```

---

## Task 4: 비속어 필터 (lib/profanity.ts)

**Files:**
- Create: `lib/profanity.ts`, `tests/profanity.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `export function containsProfanity(text: string): boolean` — 내부 금칙어 목록 중 하나라도 포함하면 true(대소문자·공백 무시). 목록은 파일 상단 `BANNED: string[]` 상수로 관리(추후 확장).

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/profanity.test.ts`:
```typescript
import { expect, test } from "vitest";
import { containsProfanity } from "@/lib/profanity";

test("금칙어 포함 시 true", () => {
  expect(containsProfanity("이 시발 왜이래")).toBe(true);
});

test("공백으로 회피해도 정규화 후 탐지", () => {
  expect(containsProfanity("시 발")).toBe(true);
});

test("정상 문장은 false", () => {
  expect(containsProfanity("오늘 친구가 밥을 사줬다")).toBe(false);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- profanity`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `lib/profanity.ts`:
```typescript
// MVP 최소 한국어 금칙어. 신고/관리자 숨김이 2차 방어선이므로 완벽할 필요는 없다.
const BANNED = ["시발", "씨발", "병신", "개새끼", "좆", "지랄", "fuck", "shit"];

/** 공백 제거 + 소문자화 후 금칙어 부분일치 검사. */
export function containsProfanity(text: string): boolean {
  const normalized = text.replace(/\s+/g, "").toLowerCase();
  return BANNED.some((word) => normalized.includes(word));
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- profanity`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/profanity.ts tests/profanity.test.ts
git commit -m "feat: add minimal Korean profanity filter"
```

---

## Task 5: 하루 하나 제한 로직 (lib/daily-limit.ts)

**Files:**
- Create: `lib/daily-limit.ts`, `tests/daily-limit.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `export function isValidLocalDate(s: string): boolean` — `YYYY-MM-DD` 형식 검사. `export function canPlant(lastLocalDate: string | null, todayLocalDate: string): boolean` — 마지막으로 심은 로컬 날짜가 오늘과 다르면(또는 없으면) true.

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/daily-limit.test.ts`:
```typescript
import { expect, test } from "vitest";
import { canPlant, isValidLocalDate } from "@/lib/daily-limit";

test("날짜 형식 검사", () => {
  expect(isValidLocalDate("2026-07-03")).toBe(true);
  expect(isValidLocalDate("2026-7-3")).toBe(false);
  expect(isValidLocalDate("hello")).toBe(false);
});

test("오늘 안 심었으면 심을 수 있음", () => {
  expect(canPlant(null, "2026-07-03")).toBe(true);
  expect(canPlant("2026-07-02", "2026-07-03")).toBe(true);
});

test("오늘 이미 심었으면 못 심음", () => {
  expect(canPlant("2026-07-03", "2026-07-03")).toBe(false);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- daily-limit`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `lib/daily-limit.ts`:
```typescript
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidLocalDate(s: string): boolean {
  return DATE_RE.test(s);
}

/** 마지막 심은 로컬 날짜가 오늘과 다르면(또는 기록 없으면) 심기 가능. */
export function canPlant(lastLocalDate: string | null, todayLocalDate: string): boolean {
  return lastLocalDate !== todayLocalDate;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- daily-limit`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/daily-limit.ts tests/daily-limit.test.ts
git commit -m "feat: add daily-one-entry limit logic"
```

---

## Task 6: 가중 랜덤 샘플링 (lib/sampling.ts)

**Files:**
- Create: `lib/sampling.ts`, `tests/sampling.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `export type Sampleable = { id: string; createdAt: number }`
  - `export function weightOf(item: Sampleable, now: number): number` — 최근 24시간 내면 3, 아니면 1.
  - `export function sample<T extends Sampleable>(items: T[], count: number, now: number, rand: () => number): T[]` — 가중치 기반 비복원 추출로 최대 `count`개 반환. `rand`는 `[0,1)` 난수 주입(테스트 시 고정).

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/sampling.test.ts`:
```typescript
import { expect, test } from "vitest";
import { sample, weightOf } from "@/lib/sampling";

const NOW = 1_000_000_000_000;

test("최근 24시간이면 가중치 3, 아니면 1", () => {
  expect(weightOf({ id: "a", createdAt: NOW - 1000 }, NOW)).toBe(3);
  expect(weightOf({ id: "b", createdAt: NOW - 48 * 3600 * 1000 }, NOW)).toBe(1);
});

test("count보다 적으면 전부 반환", () => {
  const items = [{ id: "a", createdAt: NOW }, { id: "b", createdAt: NOW }];
  const out = sample(items, 5, NOW, () => 0.5);
  expect(out).toHaveLength(2);
});

test("비복원: 중복 없이 count개", () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: String(i), createdAt: NOW }));
  const out = sample(items, 4, NOW, () => 0.5);
  expect(out).toHaveLength(4);
  expect(new Set(out.map((x) => x.id)).size).toBe(4);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- sampling`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `lib/sampling.ts`:
```typescript
export type Sampleable = { id: string; createdAt: number };

const DAY_MS = 24 * 3600 * 1000;

export function weightOf(item: Sampleable, now: number): number {
  return now - item.createdAt <= DAY_MS ? 3 : 1;
}

/** 가중치 기반 비복원 추출. rand는 [0,1) 난수 주입(테스트 고정 가능). */
export function sample<T extends Sampleable>(
  items: T[],
  count: number,
  now: number,
  rand: () => number,
): T[] {
  const pool = items.slice();
  const result: T[] = [];
  const take = Math.min(count, pool.length);
  for (let n = 0; n < take; n++) {
    const weights = pool.map((it) => weightOf(it, now));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    let idx = 0;
    while (idx < weights.length - 1 && r >= weights[idx]) {
      r -= weights[idx];
      idx++;
    }
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- sampling`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/sampling.ts tests/sampling.test.ts
git commit -m "feat: add recency-weighted random sampling"
```

---

## Task 7: DB 스키마 + Drizzle 클라이언트

**Files:**
- Create: `db/schema.ts`, `db/client.ts`, `drizzle.config.ts`, `.env.local`(로컬, 커밋 안 함)
- Modify: `package.json`(drizzle 스크립트)

**Interfaces:**
- Consumes: `DATABASE_URL`
- Produces:
  - 테이블 `entries(id uuid pk, content text, device_id text, local_date text, created_at timestamptz default now, reaction_count int default 0, report_count int default 0, hidden boolean default false)`
  - 테이블 `reactions(id uuid pk, entry_id uuid fk, device_id text, created_at timestamptz, unique(entry_id, device_id))`
  - 테이블 `reports(id uuid pk, entry_id uuid fk, created_at timestamptz)`
  - `export const db` (Drizzle 클라이언트), `export { entries, reactions, reports }`

- [ ] **Step 1: 의존성 설치**

Run:
```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

- [ ] **Step 2: 스키마 작성**

Create `db/schema.ts`:
```typescript
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
  (t) => ({ uniqReaction: uniqueIndex("uniq_reaction").on(t.entryId, t.deviceId) }),
);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id").notNull().references(() => entries.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

- [ ] **Step 3: 클라이언트 작성**

Create `db/client.ts`:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase 연결 문자열. 서버리스/풀러(transaction 모드)에서는 prepare: false 필요.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
export const { entries, reactions, reports } = schema;
```

- [ ] **Step 4: drizzle 설정 + 스크립트**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

Modify `package.json` scripts 에 추가:
```json
"db:push": "drizzle-kit push"
```

- [ ] **Step 5: 스키마 반영 (수동)**

`.env.local` 에 Supabase `DATABASE_URL` 설정 후 Run:
```bash
npm run db:push
```
Expected: 세 테이블이 생성됨. (Supabase 프로젝트가 없으면 https://supabase.com 에서 무료 생성 → Project Settings → Database → Connection string. **`db:push`(DDL)에는 Direct connection(5432) URL**, 런타임 앱에는 Connection Pooler(6543, transaction 모드) URL 사용 권장.)

> 이 태스크는 순수 로직이 아니므로 자동 테스트 없음. `db:push` 성공 및 Supabase 콘솔에서 테이블 확인으로 검증한다.

- [ ] **Step 6: 커밋**

```bash
git add db/schema.ts db/client.ts drizzle.config.ts package.json package-lock.json
git commit -m "feat: add Drizzle schema and Supabase client"
```

---

## Task 8: Repository 함수

**Files:**
- Create: `db/repository.ts`

**Interfaces:**
- Consumes: `db`, `entries`, `reactions`, `reports` (Task 7)
- Produces:
  - `createEntry(input: { content: string; deviceId: string; localDate: string }): Promise<{ id: string; content: string; createdAt: number }>`
  - `lastLocalDateForDevice(deviceId: string): Promise<string | null>`
  - `getVisibleEntries(limit: number): Promise<{ id: string; content: string; createdAt: number; reactionCount: number }[]>` — hidden=false, 최신 `limit`개.
  - `addReaction(entryId: string, deviceId: string): Promise<boolean>` — 신규면 true, 중복이면 false. 성공 시 `reaction_count` 증가.
  - `addReport(entryId: string): Promise<void>` — reports 추가 + `report_count` 증가.
  - `listReported(): Promise<{ id: string; content: string; reportCount: number; hidden: boolean }[]>`
  - `setHidden(entryId: string, hidden: boolean): Promise<void>`

- [ ] **Step 1: 구현**

Create `db/repository.ts`:
```typescript
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
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add db/repository.ts
git commit -m "feat: add data repository functions"
```

---

## Task 9: 심기 + 랜덤 조회 API (app/api/entries/route.ts)

**Files:**
- Create: `app/api/entries/route.ts`

**Interfaces:**
- Consumes: `validateEntry`(Task 3), `containsProfanity`(Task 4), `canPlant`/`isValidLocalDate`(Task 5), `sample`(Task 6), `createEntry`/`lastLocalDateForDevice`/`getVisibleEntries`(Task 8)
- Produces:
  - `POST /api/entries` body `{ content: string; localDate: string }` + header `x-device-id`. 성공 201 `{ entry: { id, content, createdAt } }`. 실패: 400(검증/형식), 409(하루제한), 422(비속어).
  - `GET /api/entries` → 200 `{ entries: { id, content, createdAt, reactionCount }[] }` — 최근 200개에서 최대 50개 가중 샘플.

- [ ] **Step 1: 구현**

Create `app/api/entries/route.ts`:
```typescript
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
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 수동 검증 (dev 서버)**

Run: `npm run dev` 후 다른 터미널에서:
```bash
curl -s -X POST localhost:3000/api/entries -H "x-device-id: test-1" \
  -H "content-type: application/json" \
  -d '{"content":"오늘 커피가 맛있었다","localDate":"2026-07-03"}'
curl -s localhost:3000/api/entries
```
Expected: 첫 요청 201 + entry 반환, 두 번째로 같은 device+date 재요청 시 409, GET은 방금 글 포함 목록 반환.

- [ ] **Step 4: 커밋**

```bash
git add app/api/entries/route.ts
git commit -m "feat: add plant + random-view entries API"
```

---

## Task 10: 반응 + 신고 API

**Files:**
- Create: `app/api/entries/[id]/react/route.ts`, `app/api/entries/[id]/report/route.ts`

**Interfaces:**
- Consumes: `addReaction`, `addReport` (Task 8)
- Produces:
  - `POST /api/entries/:id/react` + header `x-device-id` → 200 `{ ok: true; added: boolean }` (added=false면 이미 반응함).
  - `POST /api/entries/:id/report` → 200 `{ ok: true }`.

- [ ] **Step 1: 반응 라우트 구현**

Create `app/api/entries/[id]/react/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { addReaction } from "@/db/repository";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deviceId = req.headers.get("x-device-id");
  if (!deviceId) return NextResponse.json({ error: "no_device" }, { status: 400 });
  const added = await addReaction(id, deviceId);
  return NextResponse.json({ ok: true, added });
}
```

- [ ] **Step 2: 신고 라우트 구현**

Create `app/api/entries/[id]/report/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { addReport } from "@/db/repository";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await addReport(id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 타입 체크 + 수동 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음. dev 서버에서 위 GET으로 얻은 id로 react/report POST 시 200.

- [ ] **Step 4: 커밋**

```bash
git add "app/api/entries/[id]"
git commit -m "feat: add reaction and report API"
```

---

## Task 11: 관리자 인증 + 관리 API + 페이지

**Files:**
- Create: `lib/admin-auth.ts`, `app/api/admin/entries/route.ts`, `app/admin/page.tsx`

**Interfaces:**
- Consumes: `ADMIN_PASSWORD`, `listReported`, `setHidden` (Task 8)
- Produces:
  - `checkAdmin(password: string | null): boolean` — `ADMIN_PASSWORD`와 일치 검사.
  - `GET /api/admin/entries` (header `x-admin-password`) → 200 신고목록 / 401.
  - `PATCH /api/admin/entries` body `{ id, hidden }` (header `x-admin-password`) → 200 / 401.
  - `/admin` 페이지: 비밀번호 입력 → 신고목록 표 + 숨김/복구 버튼.

- [ ] **Step 1: 인증 헬퍼**

Create `lib/admin-auth.ts`:
```typescript
export function checkAdmin(password: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && password === expected;
}
```

- [ ] **Step 2: 관리 API**

Create `app/api/admin/entries/route.ts`:
```typescript
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
```

- [ ] **Step 3: 관리자 페이지**

Create `app/admin/page.tsx`:
```tsx
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
```

- [ ] **Step 4: 타입 체크 + 수동 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음. `.env.local`에 `ADMIN_PASSWORD` 설정 후 `/admin`에서 로그인→신고목록→숨김 토글 동작 확인.

- [ ] **Step 5: 커밋**

```bash
git add lib/admin-auth.ts app/api/admin app/admin
git commit -m "feat: add admin auth, moderation API and page"
```

---

## Task 12: 클라이언트 기기 ID + API 클라이언트 훅

**Files:**
- Create: `lib/device.ts`, `lib/client-time.ts`, `components/useGarden.ts`

**Interfaces:**
- Consumes: `resolvePhase`/`Phase`(Task 2)
- Produces:
  - `getDeviceId(): string` — localStorage `gg-device-id` 없으면 `crypto.randomUUID()`로 생성·저장.
  - `getLocalDate(): string` — 로컬 `YYYY-MM-DD`.
  - `getLocalHour(): number` — 로컬 시각 0–23.
  - `useGarden()` 훅 — `{ entries, phase, planted, plant, react, report }` 제공. `entries` 로드/추가, `phase`는 `resolvePhase(getLocalHour())`.
  - `export type Entry = { id: string; content: string; createdAt: number; reactionCount: number }`

- [ ] **Step 1: 기기/시간 헬퍼**

Create `lib/device.ts`:
```typescript
export function getDeviceId(): string {
  const KEY = "gg-device-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

Create `lib/client-time.ts`:
```typescript
export function getLocalDate(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function getLocalHour(): number {
  return new Date().getHours();
}
```

- [ ] **Step 2: 데이터 훅**

Create `components/useGarden.ts`:
```typescript
"use client";
import { useCallback, useEffect, useState } from "react";
import { resolvePhase, type Phase } from "@/lib/phase";
import { getDeviceId } from "@/lib/device";
import { getLocalDate, getLocalHour } from "@/lib/client-time";

export type Entry = { id: string; content: string; createdAt: number; reactionCount: number };

export function useGarden() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [phase, setPhase] = useState<Phase>("day");
  const [planted, setPlanted] = useState(false);

  useEffect(() => {
    setPhase(resolvePhase(getLocalHour()));
    fetch("/api/entries")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {});
  }, []);

  const plant = useCallback(async (content: string) => {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": getDeviceId() },
      body: JSON.stringify({ content, localDate: getLocalDate() }),
    });
    if (res.status === 201) {
      const { entry } = await res.json();
      setEntries((prev) => [{ ...entry, reactionCount: 0 }, ...prev]);
      setPlanted(true);
      return { ok: true as const };
    }
    const { error } = await res.json().catch(() => ({ error: "unknown" }));
    if (error === "already_today") setPlanted(true);
    return { ok: false as const, error };
  }, []);

  const react = useCallback(async (id: string) => {
    await fetch(`/api/entries/${id}/react`, {
      method: "POST",
      headers: { "x-device-id": getDeviceId() },
    }).catch(() => {});
  }, []);

  const report = useCallback(async (id: string) => {
    await fetch(`/api/entries/${id}/report`, { method: "POST" }).catch(() => {});
  }, []);

  return { entries, phase, planted, plant, react, report };
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add lib/device.ts lib/client-time.ts components/useGarden.ts
git commit -m "feat: add client device id, local time, and garden hook"
```

---

## Task 13: 풍경 UI + 심기 폼 (기능 동작 최소 스타일 / v0 디자인 대기)

> **NOTE:** v0 디자인 시안이 준비되면 이 태스크의 컴포넌트를 그 시안으로 리스킨한다. 프롭 구조(`Scene`, `GratitudeItem({ entry, phase, onReact, onReport })`, `PlantForm({ planted, onPlant })`, `Entry`)는 유지한다. 시안이 없으면 아래 최소 스타일로 먼저 동작시킨다.

**Files:**
- Create: `components/Scene.tsx`, `components/GratitudeItem.tsx`, `components/PlantForm.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useGarden`/`Entry`(Task 12), `Phase`(Task 2), `MAX_LENGTH`(Task 3)
- Produces: 낮/밤 배경 + 아이템(꽃/별) 배치 + 심기 폼이 붙은 동작하는 메인 화면.

- [ ] **Step 1: 아이템 컴포넌트**

Create `components/GratitudeItem.tsx`:
```tsx
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
      <button className={`gg-token gg-${phase} ${sparkle ? "gg-sparkle" : ""}`} onClick={() => setOpen((v) => !v)}>
        {phase === "day" ? "🌼" : "⭐"}
      </button>
      {open && (
        <div className="gg-bubble">
          <p>{entry.content}</p>
          <div className="gg-bubble-actions">
            <button onClick={react}>마음 전하기 🤍</button>
            <button onClick={() => onReport(entry.id)} className="gg-report">신고</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 심기 폼**

Create `components/PlantForm.tsx`:
```tsx
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
      <button onClick={submit} disabled={text.trim().length === 0}>심기</button>
      {msg && <small className="gg-msg">{msg}</small>}
    </div>
  );
}
```

- [ ] **Step 3: Scene + page 연결**

Create `components/Scene.tsx`:
```tsx
"use client";
import { useGarden } from "./useGarden";
import { GratitudeItem } from "./GratitudeItem";
import { PlantForm } from "./PlantForm";

export function Scene() {
  const { entries, phase, planted, plant, react, report } = useGarden();
  return (
    <main className={`gg-scene gg-scene-${phase}`}>
      <div className="gg-field">
        {entries.map((e) => (
          <GratitudeItem key={e.id} entry={e} phase={phase} onReact={react} onReport={report} />
        ))}
      </div>
      <PlantForm planted={planted} onPlant={plant} />
    </main>
  );
}
```

Modify `app/page.tsx` (전체 교체):
```tsx
import { Scene } from "@/components/Scene";

export default function Home() {
  return <Scene />;
}
```

- [ ] **Step 4: 동작 확인**

Run: `npm run dev` → 브라우저에서 심기, 아이템 클릭→말풍선, 마음 전하기, 신고 동작 확인. 기기 시간을 밤(20시~)으로 바꾸면 별로 보이는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add components/Scene.tsx components/GratitudeItem.tsx components/PlantForm.tsx app/page.tsx
git commit -m "feat: add functional garden scene, item, and plant form"
```

---

## Task 14: CSS 애니메이션 4종 + 낮/밤 무드 (v0 디자인 대기)

> **NOTE:** v0 디자인이 오면 이 CSS를 시안 스타일로 대체/보강한다. 클래스명 계약은 유지.

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 13이 사용하는 클래스명(`gg-scene-day`, `gg-scene-night`, `gg-token`, `gg-sparkle`, `gg-field`, `gg-item`, `gg-bubble` 등)
- Produces: (1) 피어남(신규 아이템 scale/opacity), (2) 은은한 흔들림/반짝임(무한 keyframe), (3) 반응 반짝 튐(1회 keyframe), (4) 낮/밤 배경 그라데이션.

- [ ] **Step 1: 애니메이션/무드 CSS 추가**

Append to `app/globals.css`:
```css
/* ── 낮/밤 배경 ── */
.gg-scene { min-height: 100dvh; display: flex; flex-direction: column; transition: background 1.5s ease; overflow: hidden; }
.gg-scene-day { background: linear-gradient(180deg, #cdeafe 0%, #eafbe7 100%); }
.gg-scene-night { background: linear-gradient(180deg, #0b1026 0%, #1b2450 100%); }
.gg-scene-night .gg-bubble { color: #1b2450; }

/* ── 아이템 배치 ── */
.gg-field { flex: 1; display: flex; flex-wrap: wrap; gap: 18px; align-content: flex-start; padding: 32px; }
.gg-item { position: relative; }

/* ── 피어남(신규/최초 등장) ── */
.gg-token { border: none; background: none; font-size: 28px; cursor: pointer; animation: gg-bloom 600ms ease-out; }
@keyframes gg-bloom { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* ── 은은한 흔들림(낮)/반짝임(밤) ── */
.gg-day { animation: gg-bloom 600ms ease-out, gg-sway 4s ease-in-out infinite 600ms; }
.gg-night { animation: gg-bloom 600ms ease-out, gg-twinkle 3s ease-in-out infinite 600ms; }
@keyframes gg-sway { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes gg-twinkle { 0%,100% { opacity: 1; filter: drop-shadow(0 0 2px #fff); } 50% { opacity: 0.6; filter: drop-shadow(0 0 8px #fff); } }

/* ── 반응 반짝 튐(1회) ── */
.gg-sparkle { animation: gg-pop 700ms ease-out !important; }
@keyframes gg-pop { 0% { transform: scale(1); } 30% { transform: scale(1.5); filter: drop-shadow(0 0 12px gold); } 100% { transform: scale(1); } }

/* ── 말풍선 / 심기 폼 ── */
.gg-bubble { position: absolute; z-index: 5; top: 36px; left: 0; min-width: 180px; background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.15); }
.gg-bubble-actions { display: flex; gap: 8px; margin-top: 8px; }
.gg-report { opacity: 0.4; font-size: 12px; }
.gg-plant { display: flex; gap: 8px; padding: 20px; justify-content: center; }
.gg-plant input { flex: 1; max-width: 420px; padding: 12px 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.1); }
.gg-plant-done { text-align: center; padding: 24px; opacity: 0.8; }
.gg-msg { display: block; text-align: center; }
@media (prefers-reduced-motion: reduce) {
  .gg-token, .gg-day, .gg-night, .gg-sparkle { animation: none !important; }
}
```

- [ ] **Step 2: 동작 확인**

Run: `npm run dev` → 심을 때 피어남, 낮엔 흔들림/밤엔 반짝임, 마음 전하기 시 튐, 낮↔밤 배경 차이 확인. OS 접근성 "동작 줄이기" 설정 시 애니메이션 꺼지는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add app/globals.css
git commit -m "feat: add CSS bloom/sway/twinkle/sparkle animations and day-night mood"
```

---

## Task 15: 전체 통합 점검 + 빌드 + 배포 준비

**Files:**
- Modify: `app/layout.tsx`(메타데이터), `README.md`(생성)

**Interfaces:**
- Consumes: 전체
- Produces: 프로덕션 빌드 통과, 배포 문서.

- [ ] **Step 1: 전체 단위 테스트**

Run: `npm test`
Expected: phase/validation/profanity/daily-limit/sampling/smoke 전부 PASS.

- [ ] **Step 2: 타입 + 린트 + 빌드**

Run:
```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: 에러 없이 빌드 성공.

- [ ] **Step 3: 메타데이터/제목**

Modify `app/layout.tsx`의 `metadata`:
```typescript
export const metadata = {
  title: "감사의 정원",
  description: "오늘 감사했던 일을 한 줄 남기면, 낮엔 꽃 밤엔 별이 됩니다.",
};
```

- [ ] **Step 4: README + 환경변수 문서화**

Create `README.md`:
```markdown
# 감사의 정원 (sharethethanks)

익명으로 하루 한 줄 감사를 남기면 낮엔 꽃·밤엔 별이 되는 공유 풍경.

## 환경변수
- `DATABASE_URL` — Supabase Postgres 연결 문자열 (런타임은 Connection Pooler/6543, `db:push`는 Direct/5432 권장)
- `ADMIN_PASSWORD` — 관리자 페이지(`/admin`) 비밀번호

## 개발
npm install
npm run db:push   # DB 스키마 반영
npm run dev

## 테스트
npm test
```

- [ ] **Step 5: 커밋**

```bash
git add app/layout.tsx README.md
git commit -m "chore: metadata, README, and deploy prep"
```

- [ ] **Step 6: (선택) Vercel 배포**

Vercel 프로젝트에 `DATABASE_URL`, `ADMIN_PASSWORD` 환경변수 설정 후 배포. (vercel:deploy 스킬 사용 가능)

---

## Self-Review

**Spec coverage (PRD 대비):**
- 감사글 심기(익명·100자·하루하나) → Task 3,5,9,12,13 ✅
- 변환(낮 꽃/밤 별, 8시 경계, 보는 사람 로컬시각) → Task 2,12,13,14 ✅
- 랜덤 감상(가중 샘플, 과밀 방지) → Task 6,8,9 ✅
- 반응(조용한 1종, 댓글 없음, 중복 방지) → Task 8,10,13,14 ✅
- 비속어 필터 → Task 4,9 ✅
- 신고 + 관리자 숨김(보호된 페이지) → Task 8,10,11 ✅
- 숨김 글 조회 제외 → Task 8(`getVisibleEntries` hidden=false) ✅
- 데이터 모델(entries/reactions/reports, 이후 user_id 확장 여지) → Task 7 ✅
- CSS 애니메이션 4종 한정, 비싼 것 제외 → Task 14 ✅
- 접근성(동작 줄이기) → Task 14 ✅ (PRD 외 추가 안전장치)

**미결 항목(PRD §11)의 처리:**
- 랜덤 표본 개수/가중치 → Task 6/9에서 SHOW=50, POOL=200, 최근24h 가중치 3으로 **구체값 확정**(추후 튜닝).
- 관리자 인증 방식 → Task 11에서 `ADMIN_PASSWORD` 헤더 비교로 **확정**(MVP 수준, 추후 강화 가능).
- 비속어 필터 범위 → Task 4에서 한국어 우선 최소 목록으로 **확정**.

**Placeholder scan:** 모든 코드 스텝에 실제 코드 포함. "TBD/적절히 처리" 없음. ✅

**Type consistency:** `Entry`(id/content/createdAt/reactionCount), `Phase`("day"/"night"), repository 시그니처가 Task 8↔9↔10↔12에서 일치. `getVisibleEntries`·`sample`·`resolvePhase` 이름 전 태스크 통일. ✅

**주의(구현자 참고):**
- Task 8 `addReaction`의 unique 위반 catch는 드라이버 에러를 광범위 catch하므로, 다른 DB 에러도 "중복"으로 오인될 수 있음. MVP 허용, 추후 에러코드 분기 권장.
- 하루제한/반응중복은 기기(localStorage) 기준이라 브라우저 초기화·시크릿모드로 우회 가능. 의도된 "부드러운 제한" 수준.
