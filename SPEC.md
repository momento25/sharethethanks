# SPEC — 감사의 정원 (sharethethanks)

> 기술 명세 (technical spec). PRD가 "무엇을·왜"라면, 이 문서는 "규칙·계약·데이터·API"의 단일 진실이다.
> 기능이 늘어나면 이 문서에 계약을 추가한다. 최종 갱신: 2026-07-03 (MVP)

---

## 1. 용어

| 용어 | 정의 |
|------|------|
| entry (감사글) | 사용자가 남긴 한 줄 감사. 익명. |
| phase (시간대) | 보는 사람의 로컬 시각 기준 `day` 또는 `night`. |
| token (토큰) | entry의 시각적 표현. day=꽃, night=별. 데이터는 동일, 렌더만 분기. |
| device (기기) | 브라우저 localStorage에 저장된 UUID. 익명 식별자. |

## 2. 도메인 규칙 (business rules)

- **R1 (익명):** entry는 작성자 개인정보를 담지 않는다. `device_id`는 내부 제한용이며 공개되지 않는다.
- **R2 (길이):** entry 본문은 트림 후 1–100자. 그 외 거부.
- **R3 (하루 하나):** 한 device는 자신의 로컬 날짜(`YYYY-MM-DD`) 기준 하루 1개만 심을 수 있다. 경계는 사용자 로컬 자정.
- **R4 (시간대 표현):** `06:00–19:59` → day(꽃), `20:00–05:59` → night(별). 판정은 조회하는 클라이언트의 로컬 시각. 저장 데이터는 시간대 독립.
- **R5 (반응):** "마음 전하기" 1종. device당 entry 1회. 중복은 조용히 무시.
- **R6 (신고):** 누구나 신고 가능. 신고는 즉시 숨기지 않고 `report_count`만 올린다. 숨김은 관리자만.
- **R7 (비속어):** 심기 시 1차 필터로 차단. 필터는 완전하지 않으며 신고+관리자가 2차 방어선.
- **R8 (가시성):** `hidden = true`인 entry는 모든 공개 조회에서 제외.
- **R9 (평온):** 조회·반응·신고 실패는 사용자에게 오류를 크게 노출하지 않고 조용히 처리한다.

## 3. 데이터 모델

### entries
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid pk | 자동 |
| content | text | 1–100자 (R2) |
| device_id | text | 내부 전용 (R1, R3) |
| local_date | text | `YYYY-MM-DD`, 작성 device의 로컬 날짜 (R3) |
| created_at | timestamptz | default now |
| reaction_count | int | default 0 |
| report_count | int | default 0 |
| hidden | boolean | default false (R8) |

### reactions
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid pk | |
| entry_id | uuid fk→entries | |
| device_id | text | |
| created_at | timestamptz | |
| — | unique(entry_id, device_id) | 중복 반응 방지 (R5) |

### reports
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid pk | |
| entry_id | uuid fk→entries | |
| created_at | timestamptz | |

> **확장 여지:** 로그인/개인 정원 도입 시 `entries.user_id`(nullable) 추가, `device_id` 기반 규칙을 user 기반으로 승격.

## 4. API 계약

기본: JSON. 기기 식별이 필요한 요청은 헤더 `x-device-id` 필수.

### POST /api/entries — 심기
- Headers: `x-device-id`
- Body: `{ content: string, localDate: string }`
- 201 → `{ entry: { id, content, createdAt } }`
- 400 → `no_device` | `bad_body` | `bad_date` | `empty` | `too_long`
- 409 → `already_today` (R3)
- 422 → `profanity` (R7)

### GET /api/entries — 랜덤 감상
- 200 → `{ entries: { id, content, createdAt, reactionCount }[] }`
- 규칙: `hidden=false` 최근 `POOL`개 풀에서 최근 24h 가중치(3배) 비복원 샘플 최대 `SHOW`개.
- MVP 파라미터: `POOL=200`, `SHOW=50`.

### POST /api/entries/:id/react — 마음 전하기
- Headers: `x-device-id`
- 200 → `{ ok: true, added: boolean }` (added=false: 이미 반응함, R5)

### POST /api/entries/:id/report — 신고
- 200 → `{ ok: true }` (R6)

### GET /api/admin/entries — 신고 목록 (관리자)
- Headers: `x-admin-password`
- 200 → `{ entries: { id, content, reportCount, hidden }[] }` | 401

### PATCH /api/admin/entries — 숨김/복구 (관리자)
- Headers: `x-admin-password`
- Body: `{ id: string, hidden: boolean }`
- 200 → `{ ok: true }` | 400 | 401

## 5. 클라이언트 계약

- `getDeviceId()` — localStorage `gg-device-id`, 없으면 `crypto.randomUUID()` 생성·저장.
- `getLocalDate()` → `YYYY-MM-DD` (로컬).
- `getLocalHour()` → 0–23 (로컬).
- phase = `resolvePhase(getLocalHour())`.

## 6. 인터랙션 / 애니메이션 계약 (MVP)

CSS 4종만 사용 (canvas/WebGL/물리엔진 금지):
1. **bloom** — 신규/등장 토큰 `scale(0→1)+opacity`, 600ms 1회.
2. **sway/twinkle** — day는 좌우 흔들림, night는 반짝임. 무한 keyframe.
3. **pop** — 반응 시 튐+글로우, 700ms 1회.
4. **day/night 배경** — 그라데이션 전환.
- 접근성: `prefers-reduced-motion: reduce` 시 애니메이션 비활성화.

## 7. 비기능 요구사항

- **인증(관리자):** `ADMIN_PASSWORD` 헤더 비교 (MVP 수준). 추후 강화 가능.
- **제한 우회:** device 기반 제한은 localStorage 초기화/시크릿모드로 우회 가능 — 의도된 "부드러운 제한".
- **가용성:** 공개 조회/반응은 부분 실패해도 화면은 평온을 유지 (R9).
- **접근성:** 색 대비, reduced-motion 존중.

## 8. 범위 밖 (이후 로드맵)

로그인/계정, 개인 정원, 꾸미기 아이템/결제, 댓글·팔로우·알림, 다중 반응. 상세는 PRD §10.

## 9. 미결 / 튜닝 포인트

- `POOL`/`SHOW`/가중치 값 실사용 기반 조정.
- 비속어 목록 확장 (한국어 우선).
- 관리자 인증 강화 시점.
