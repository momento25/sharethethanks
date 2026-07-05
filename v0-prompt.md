# v0 프롬프트 — 감사의 정원 (sharethethanks)

> 사용법: 아래 블록을 v0.dev에 붙여넣고, 찾은 **디자인 레퍼런스 이미지**를 함께 첨부한 뒤
> "Match the mood/palette of the attached reference"를 덧붙이면 된다.
> 이 프롬프트는 구현 계획의 컴포넌트/프롭 구조(`Scene`, `GratitudeItem`, `PlantForm`, `Entry`)와
> 일치하도록 작성되어, 나중에 실제 데이터/API를 그대로 꽂을 수 있다.

---

Build a peaceful, cute **single-page web UI** called **"감사의 정원" (Gratitude Garden)**. All UI copy is in **Korean**.

Concept: a shared space where people leave **one line of gratitude, anonymously**. Each gratitude shows as a **flower in the daytime** and the **same gratitude becomes a star at night**. It should feel calm, soft, and healing — not a busy social feed.

**Tech:** Next.js (App Router) + TypeScript + Tailwind CSS. **Pure CSS animations only** — no canvas, WebGL, or animation libraries. **Mock data only**, no backend. Design components so data and handlers arrive as **props** (real API will be wired in later).

## Visual mode — `phase` prop: `"day" | "night"`
- **day:** soft green meadow with a bright, peaceful sky gradient (light blue → soft green). Each gratitude is a **flower 🌼**.
- **night:** deep calm night sky (navy → indigo) with soft glow. Each gratitude is a **star ⭐**.
- Add a small **dev toggle** (corner) to switch day/night for preview.
- Background transitions **smoothly** when phase changes.

## Components (keep names & prop shapes exactly)

### `Entry` type
`{ id: string; content: string; createdAt: number; reactionCount: number }`

### 1. `Scene` (main, full viewport)
- Renders the phase-based background.
- Scatters gratitude tokens across the field/sky at pseudo-random positions (avoid overlap with the form).
- Docks the plant form at the **bottom center**.
- No nav bar, no menu — this one screen is the entire experience.

### 2. `GratitudeItem`
Props: `{ entry, phase, onReact(id), onReport(id) }`
- Renders one **flower (day)** or **star (night)** token.
- Clicking the token opens a small **bubble/popover** showing:
  - the gratitude text
  - a **"마음 전하기 🤍"** button (calls `onReact`)
  - a subtle, low-emphasis **"신고"** link (calls `onReport`)
- Reaction count is **not emphasized** (no big numbers, no ranking) — keep it gentle.

### 3. `PlantForm`
Props: `{ planted: boolean, onPlant(content: string) }`
- Text input (max **100** chars) + **"심기"** button.
- Placeholder: **"오늘 감사했던 일을 한 줄 남겨보세요"**.
- "심기" disabled when input is empty (trimmed).
- When `planted === true`: hide the input and show **"오늘의 감사는 이미 피었어요. 내일 또 만나요 🌙"**.

## Interactions / animations (CSS only)
- **bloom:** a new/entering token scales `0 → 1` with fade-in, ~600ms.
- **sway (day):** gentle back-and-forth rotate loop. **twinkle (night):** soft opacity + glow loop.
- **pop:** when "마음 전하기" is pressed, the token briefly pops/scales with a **gold glow**, ~700ms.
- Respect **`prefers-reduced-motion: reduce`** → disable animations.

## Feel / style
Peaceful, soft, cute. Rounded shapes, gentle shadows, calm muted palette, comfortable whitespace. Nothing competitive or number-heavy. Cozy and reassuring.

## Mock data
Seed ~30 gratitude items with short, warm Korean gratitude sentences (e.g. "오늘 커피가 유난히 맛있었다", "친구가 안부를 물어줬다"), scattered at pseudo-random positions.

Deliver small, clearly named components (`Scene`, `GratitudeItem`, `PlantForm`) with the exact prop shapes above.

---

> 참고: **관리자 페이지(`/admin`)는 v0로 만들 필요 없음** — 기능성 화면이라 별도로 최소 구현한다.
