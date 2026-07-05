# 감사의 정원 (sharethethanks)

익명으로 하루 한 줄 감사를 남기면 낮엔 꽃·밤엔 별이 되는 공유 풍경.

낮(06:00–19:59)엔 감사글이 꽃 🌼, 밤(20:00–05:59)엔 별 ⭐로 보입니다. 하루에 하나씩, 로그인 없이 남기고, 서로의 감사에 "마음 전하기"로 조용히 반응합니다.

## 기술 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase Postgres · Drizzle ORM · Vitest

## 환경변수

`.env.local` 에 설정:

```
# 런타임은 Connection Pooler(6543, transaction 모드), db:push는 Direct(5432) 권장
DATABASE_URL=postgresql://...supabase...
# 관리자 페이지(/admin) 비밀번호
ADMIN_PASSWORD=change-me
```

## 개발

```bash
npm install
npm run db:push   # Supabase에 스키마 반영 (DATABASE_URL 필요)
npm run dev
```

## 테스트

```bash
npm test          # 순수 로직 단위 테스트 (Vitest)
```

## 구조

- `lib/` — 순수 로직(낮/밤 판정, 검증, 비속어 필터, 하루제한, 샘플링)
- `db/` — Drizzle 스키마·클라이언트·repository
- `app/api/` — 라우트 핸들러(심기·조회·반응·신고·관리자)
- `components/` — 풍경 UI(Scene·GratitudeItem·PlantForm) + `useGarden` 훅
- `docs/`, `PRD.md`, `SPEC.md` — 기획·명세

> UI는 현재 임시 스킨입니다. v0 디자인 시안으로 컴포넌트를 리스킨할 예정(프롭 계약 유지).
