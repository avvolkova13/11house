# Long Tunnel Click Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Продлить сформированный тоннель до трёх scroll-дистанций и открывать существующий `OneClientStory` только по CTA с коротким page-like переходом.

**Architecture:** `heroNarrative` остаётся источником scroll-timing; отдельный pure helper описывает click-gate и длину runway. `App` владеет состояниями `tunnel → covering → story`, а `CosmicHero` только отображает CTA по visual progress и сообщает о клике наружу. Следующая секция исключена из layout до клика, затем включается под непрозрачным cover и получает staged CSS reveal.

**Tech Stack:** React 19, TypeScript 5.9, Three.js 0.179, CSS, Vitest 3.2, Vite 7.

## Global Constraints

- Не менять первые шесть утверждённых narrative scenes, terrain-to-tunnel morph и anatomy product screenshots.
- `HERO_LAST_STAGE_INDEX` остаётся `6`; visual progress заканчивается на `9`.
- Tunnel-flight занимает `6…9`; CTA reveal занимает `8.45…8.9`.
- До клика `OneClientStory` не участвует в layout и accessibility tree.
- Переход не меняет URL/history и использует только opacity/transform.
- Reduced-motion путь не содержит scroll-flight и искусственных задержек.
- Новые dependencies и дополнительные WebGL draw calls не добавляются.
- Коммит и push выполняются только после отдельного прямого разрешения пользователя.

---

### Task 1: Extended tunnel timing

**Files:**
- Modify: `src/hero/heroNarrative.test.ts`
- Modify: `src/hero/heroNarrative.ts`
- Modify: `src/scroll/PageScrollCoordinator.test.ts`

**Interfaces:**
- Produces: `HERO_LAST_VISUAL_INDEX = 9`
- Produces: `getTunnelCtaReveal(progress: number): number`
- Keeps: `getTunnelDive(progress: number): number`

- [ ] **Step 1: Write failing timing tests**

```ts
expect(HERO_LAST_VISUAL_INDEX).toBe(9)
expect(getTunnelDive(6)).toBe(0)
expect(getTunnelDive(7.5)).toBeCloseTo(0.5)
expect(getTunnelDive(9)).toBe(1)
expect(getTunnelCtaReveal(8.45)).toBe(0)
expect(getTunnelCtaReveal(8.675)).toBeCloseTo(0.5)
expect(getTunnelCtaReveal(8.9)).toBe(1)
expect(getHeroCorridorMetrics(1440, 900, false).travelEnd).toBe(6840)
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/hero/heroNarrative.test.ts src/scroll/PageScrollCoordinator.test.ts --run`

Expected: FAIL because the visual end is still `7` and `getTunnelCtaReveal` is missing.

- [ ] **Step 3: Implement minimal timing**

```ts
export const HERO_LAST_VISUAL_INDEX = HERO_LAST_STAGE_INDEX + 3
export const getTunnelDive = (progress: number) => smoothstep(6, HERO_LAST_VISUAL_INDEX, progress)
export const getTunnelCtaReveal = (progress: number) => smoothstep(8.45, 8.9, progress)
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/hero/heroNarrative.test.ts src/scroll/PageScrollCoordinator.test.ts --run`

Expected: both files PASS with desktop `travelEnd: 6840` and unchanged reduced-motion metrics.

### Task 2: Pure handoff state and runway gate

**Files:**
- Create: `src/scroll/heroHandoff.test.ts`
- Create: `src/scroll/heroHandoff.ts`

**Interfaces:**
- Produces: `HeroHandoffPhase = 'tunnel' | 'covering' | 'story'`
- Produces: `beginHeroHandoff(phase: HeroHandoffPhase): HeroHandoffPhase`
- Produces: `completeHeroHandoff(phase: HeroHandoffPhase): HeroHandoffPhase`
- Produces: `getHeroRunwayEnd(metrics: HeroCorridorMetrics, phase: HeroHandoffPhase): number`

- [ ] **Step 1: Write failing state tests**

```ts
expect(beginHeroHandoff('tunnel')).toBe('covering')
expect(beginHeroHandoff('covering')).toBe('covering')
expect(completeHeroHandoff('covering')).toBe('story')
expect(getHeroRunwayEnd(metrics, 'tunnel')).toBe(metrics.travelEnd)
expect(getHeroRunwayEnd(metrics, 'story')).toBe(metrics.corridorEnd)
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/scroll/heroHandoff.test.ts --run`

Expected: FAIL because `heroHandoff.ts` does not exist.

- [ ] **Step 3: Implement the state helper**

```ts
export type HeroHandoffPhase = 'tunnel' | 'covering' | 'story'

export const beginHeroHandoff = (phase: HeroHandoffPhase) => (
  phase === 'tunnel' ? 'covering' : phase
)

export const completeHeroHandoff = (phase: HeroHandoffPhase) => (
  phase === 'covering' ? 'story' : phase
)

export const getHeroRunwayEnd = (metrics: HeroCorridorMetrics, phase: HeroHandoffPhase) => (
  phase === 'tunnel' ? metrics.travelEnd : metrics.corridorEnd
)
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/scroll/heroHandoff.test.ts --run`

Expected: PASS.

### Task 3: CTA and click-gated application transition

**Files:**
- Modify: `src/components/CosmicHero.tsx`
- Modify: `src/App.tsx`
- Modify: `src/sections/OneClientStory.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `CosmicHero` consumes `onEnterStory: () => void` and `handoffPhase: HeroHandoffPhase`.
- `App` consumes the Task 2 helpers and owns all timers.
- `OneClientStory` exposes `id="client-story-title"` as a programmatic focus target with `tabIndex={-1}`.

- [ ] **Step 1: Connect CTA to visual progress**

Track raw `visualProgress` alongside clamped `copyProgress`, compute `ctaReveal = reducedMotion ? 1 : getTunnelCtaReveal(visualProgress)`, and render:

```tsx
<div
  aria-hidden={!ctaInteractive}
  className="hero-tunnel-action"
  style={{ '--hero-cta-reveal': ctaReveal } as CSSProperties}
>
  <button
    type="button"
    tabIndex={ctaInteractive ? 0 : -1}
    onClick={ctaInteractive ? onEnterStory : undefined}
  >
    Продолжить
  </button>
</div>
```

`ctaInteractive` becomes true at visual progress `8.9` and becomes false after handoff begins.

- [ ] **Step 2: Implement App-owned transition lifecycle**

Use `HeroHandoffPhase`, guard repeat clicks, and for full motion start a `200ms` cover timer. When phase becomes `story`, include the next layout, scroll to `main.offsetTop` under the cover, then focus `#client-story-title` with `{ preventScroll: true }`. For reduced motion switch directly to `story`. Clear timer and animation-frame handles on unmount.

- [ ] **Step 3: Gate layout and accessibility**

Before `story`, render the main container with `hidden` and `aria-hidden="true"`. In `story`, remove both and use corridor height so reverse scroll reaches the Hero. Keep all existing `OneClientStory` data and markup unchanged except the focusable heading.

- [ ] **Step 4: Add scoped transition styles**

Add only `.hero-tunnel-action`, `.hero-handoff-cover`, and `.landing-sections[data-entered]` selectors. CTA uses centered positioning over the tunnel throat, high-contrast gold/ivory ElevenHouse treatment, visible `:focus-visible`, and pointer-events only after reveal. Cover fades in for `200ms` and out after the story layout is positioned. Story header/anchor reveal first; rail/stage/footer follow with a short delay, completing within `900ms`.

- [ ] **Step 5: Add reduced-motion CSS**

Under `@media (prefers-reduced-motion: reduce)` and the existing dev reduced-motion selector, disable CTA/cover/story transition durations and transforms while preserving focus and legibility.

- [ ] **Step 6: Run focused regression tests**

Run: `npm test -- src/hero/heroNarrative.test.ts src/scroll/PageScrollCoordinator.test.ts src/scroll/HeroScrollAdapter.test.ts src/scroll/heroHandoff.test.ts --run`

Expected: PASS with no warnings.

### Task 4: Browser, responsive, accessibility, and build QA

**Files:**
- Verify only: `src/App.tsx`, `src/components/CosmicHero.tsx`, `src/styles.css`

**Interfaces:**
- Consumes the running Vite page at `http://127.0.0.1:5188/`.

- [ ] **Step 1: Verify desktop scroll hold**

At `1440×900`, inspect progress near `6`, `7.5`, and `9`. Confirm the tunnel advances slowly for three stages, CTA is absent before `8.45`, fully operable at `8.9`, and further wheel input cannot expose `OneClientStory` before click.

- [ ] **Step 2: Verify click transition**

Activate CTA by pointer and keyboard. Confirm the dark cover reaches full opacity, the next section is placed at the top without a visible vertical jump, header/Анна appear first, product scene follows, focus lands on the story heading, and URL remains unchanged.

- [ ] **Step 3: Verify reverse scroll**

After the reveal, scroll upward. Confirm the Hero reappears at terminal tunnel state and then reverses through `6…0` without an abrupt camera jump.

- [ ] **Step 4: Verify mobile**

At `390×844`, repeat terminal scroll and click. Confirm the throat and CTA fit the viewport, there is no horizontal overflow, and the story reveal stays inside the viewport.

- [ ] **Step 5: Verify reduced motion**

Open `?reduced-motion=1`, confirm CTA is immediately keyboard-accessible and click reveals/focuses the story without animated flight or delay.

- [ ] **Step 6: Run final verification**

Run: `npm test -- --run`

Expected: all tests PASS.

Run: `npm run build`

Expected: TypeScript and Vite build succeed.

Run: `git diff --check`

Expected: no whitespace errors.
