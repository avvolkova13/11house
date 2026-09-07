# Obscura Pricing Motion V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перестроить тарифный carousel в единую физическую 3D-ленту с цельной деформацией карточек и синхронными отражёнными срезами по референсу Obscura.

**Architecture:** Чистый reducer продолжает определять active, target, direction и roles. `PricingSection` отвечает только за таймеры и lifecycle. `PricingOrbit` рендерит отдельную визуальную surface внутри доступной button hit-area, reflection slices и spectral edges. Все CSS-анимации используют одну сетку процентов, один duration token и совпадающие финальные transforms.

**Tech Stack:** React 19, TypeScript, scoped CSS animations, Vitest, Vite. Без новых зависимостей.

## Global Constraints

- Пауза чтения: `4 500 мс`.
- Переход: `980 мс`.
- Автоматический порядок: `Pro -> Studio -> Старт -> Pro`.
- Hover не останавливает автоматический цикл.
- Reduced motion отключает auto-cycle и делает ручной выбор мгновенным.
- Locked Hero, global selectors, package files и конфигурацию не менять.
- Не коммитить и не пушить без прямого запроса пользователя.

---

### Task 1: Зафиксировать новый timing и lifecycle контракт

**Files:**
- Modify: `src/sections/pricingMotion.test.ts`
- Modify: `src/sections/pricingMotion.ts`
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/sections/PricingSection.tsx`

**Interfaces:**
- Produces: `PRICING_HOLD_MS = 4500`, `PRICING_TRANSITION_MS = 980`, `PRICING_CYCLE_MS = 5480`.
- Preserves: `PricingMotionState`, `beginPricingTransition`, `completePricingTransition`, `getPricingCardRole`.

- [ ] **Step 1: Write the failing timing test**

```ts
it('keeps each tariff readable for 4.5 seconds before a reference-paced transition', () => {
  expect(PRICING_HOLD_MS).toBe(4500)
  expect(PRICING_TRANSITION_MS).toBe(980)
  expect(PRICING_CYCLE_MS).toBe(5480)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/sections/pricingMotion.test.ts --run`

Expected: FAIL because the current values are `4800`, `1150`, `5950`.

- [ ] **Step 3: Implement the timing constants**

```ts
export const PRICING_HOLD_MS = 4500
export const PRICING_TRANSITION_MS = 980
export const PRICING_CYCLE_MS = PRICING_HOLD_MS + PRICING_TRANSITION_MS
```

- [ ] **Step 4: Add a source contract that pointer hover does not pause auto-cycle**

```ts
it('does not bind pointer hover as an automatic-cycle pause condition', () => {
  const html = renderToStaticMarkup(<PricingSection />)
  expect(html).not.toContain('data-pause-on-hover')
})
```

Also remove `isPointerInside`, `onPointerEnter` and `onPointerLeave` from the cycle guard. Keep focus, viewport, visibility and reduced-motion guards.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/sections/pricingMotion.test.ts src/sections/PricingSection.test.tsx --run`

Expected: PASS.

### Task 2: Создать цельную card surface и reflection DOM

**Files:**
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/sections/PricingOrbit.tsx`

**Interfaces:**
- Produces: `.pricing-orbit-card__surface`, `.pricing-orbit-reflection`, `.pricing-orbit-reflection__slice`, `.pricing-orbit__spectral-edge`.
- Consumes: `data-card-role`, `data-motion-phase`, `data-motion-direction`, `data-plan`.

- [ ] **Step 1: Write failing structural tests**

```ts
it('moves art and copy inside one deformable surface', () => {
  const html = renderToStaticMarkup(<PricingSection />)
  expect(html.match(/pricing-orbit-card__surface/g)).toHaveLength(3)
  expect(html).toContain('pricing-orbit-card__art')
  expect(html).toContain('pricing-orbit-card__content')
})

it('renders compact reflected art slices and two spectral edges', () => {
  const html = renderToStaticMarkup(<PricingSection />)
  expect(html.match(/data-reflection-plan=/g)).toHaveLength(6)
  expect(html.match(/pricing-orbit__spectral-edge/g)).toHaveLength(2)
  expect(html).not.toContain('pricing-orbit__echo')
})
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: FAIL because the current DOM renders art and content directly in the button and uses echo nodes.

- [ ] **Step 3: Extract reusable visual art markup**

```tsx
function PricingArtwork() {
  return (
    <span className="pricing-orbit-card__art" aria-hidden="true">
      <i />
    </span>
  )
}
```

Render `PricingArtwork` and `.pricing-orbit-card__content` inside `.pricing-orbit-card__surface`. Keep the outer button responsible for focus and click.

- [ ] **Step 4: Replace mirror echoes with compact reflection slices**

```tsx
<div className="pricing-orbit-reflection pricing-orbit-reflection--top" aria-hidden="true">
  {plans.map((plan) => (
    <span
      className={`pricing-orbit-reflection__slice pricing-orbit-reflection__slice--${plan.key}`}
      data-reflection-plan={plan.key}
      data-reflection-role={getPricingCardRole(plan.key, motionState, planKeys)}
      key={plan.key}
    ><i /></span>
  ))}
</div>
```

Render the same structure for `--bottom`. Add two empty `.pricing-orbit__spectral-edge` spans with `aria-hidden="true"`.

- [ ] **Step 5: Run the component test and verify GREEN**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: PASS.

### Task 3: Replace role-swaps with synchronized 3D choreography

**Files:**
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/styles.css` inside existing `.pricing-*` selectors and pricing keyframes only.

**Interfaces:**
- Consumes: DOM from Task 2 and `--pricing-transition-duration: 980ms`.
- Produces: shared `0/12/38/50/54/78/92/100%` choreography for incoming, outgoing and relay.

- [ ] **Step 1: Add failing CSS vocabulary checks**

Read `src/styles.css` in the test and require:

```ts
expect(css).toContain('@keyframes pricing-surface-enter-forward')
expect(css).toContain('@keyframes pricing-surface-exit-forward')
expect(css).toContain('@keyframes pricing-surface-relay-forward')
expect(css).toContain('rotateY(88deg)')
expect(css).not.toContain('@keyframes pricing-art-incoming')
expect(css).not.toContain('filter: blur(18px)')
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: FAIL on the new keyframes and retained old art-only morph.

- [ ] **Step 3: Define hold positions with exact settle endpoints**

```css
.pricing-orbit-card[data-card-role="active"] .pricing-orbit-card__surface {
  opacity: 1;
  transform: translate3d(0, 0, 180px) rotateY(0deg) scale3d(1, 1, 1);
}

.pricing-orbit-card[data-card-role="previous"] .pricing-orbit-card__surface {
  opacity: .62;
  transform: translate3d(-118%, 0, -210px) rotateY(42deg) scale3d(.72, .72, 1);
}

.pricing-orbit-card[data-card-role="next"] .pricing-orbit-card__surface {
  opacity: .62;
  transform: translate3d(118%, 0, -210px) rotateY(-42deg) scale3d(.72, .72, 1);
}
```

The outer buttons share a centered, stable hit-area. All spatial motion moves to the surfaces.

- [ ] **Step 4: Implement synchronized forward keyframes**

Use the same percentage stops for every role. At `50%`, outgoing reaches `rotateY(88deg)` and incoming reaches `rotateY(-88deg)`. At `100%`, every transform must exactly equal its next static hold role.

```css
@keyframes pricing-surface-enter-forward {
  0% { opacity: .62; transform: translate3d(118%, 0, -210px) rotateY(-42deg) scale3d(.72, .72, 1); }
  12% { opacity: .72; transform: translate3d(104%, 0, -180px) rotateY(-48deg) scale3d(.76, .75, 1); }
  38% { opacity: .76; transform: translate3d(58%, 0, -90px) rotateY(-72deg) scale3d(.82, .88, 1); }
  50% { opacity: .42; transform: translate3d(24%, 0, -24px) rotateY(-88deg) scale3d(.9, .98, 1); }
  54% { opacity: .7; transform: translate3d(13%, 0, 52px) rotateY(-62deg) scale3d(.94, 1.015, 1); }
  78% { opacity: 1; transform: translate3d(-2.5%, 0, 188px) rotateY(2.2deg) scale3d(1.018, 1.006, 1); }
  92% { opacity: 1; transform: translate3d(.8%, 0, 182px) rotateY(-.7deg) scale3d(1.004, 1.002, 1); }
  100% { opacity: 1; transform: translate3d(0, 0, 180px) rotateY(0deg) scale3d(1, 1, 1); }
}
```

Implement outgoing and relay with the same stops, mirrored backward variants, and no independent delays.

- [ ] **Step 5: Move morph to the whole surface**

At `38-54%`, animate the surface from a low-radius rectangle through a narrow asymmetric silhouette and back. Do not animate `.pricing-orbit-card__art` independently. Keep button focus outline outside the clipped surface.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: PASS.

### Task 4: Build synchronized reflection optics

**Files:**
- Modify: `src/styles.css` inside pricing selectors and keyframes.
- Test: `src/sections/PricingSection.test.tsx`

**Interfaces:**
- Consumes: reflection roles from Task 2.
- Produces: compact top/bottom slices, chromatic fringe and local exposure pulse.

- [ ] **Step 1: Write failing reflection CSS checks**

```ts
expect(css).toContain('@keyframes pricing-reflection-enter-forward')
expect(css).toContain('@keyframes pricing-reflection-exit-forward')
expect(css).toContain('pricing-orbit__spectral-edge')
expect(css).not.toContain('width: min(78vw, 1080px)')
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: FAIL because old wide mirror geometry remains.

- [ ] **Step 3: Implement compact reflection geometry**

```css
.pricing-orbit-reflection {
  position: absolute;
  left: 50%;
  width: min(52vw, 670px);
  height: clamp(64px, 8vw, 104px);
  overflow: hidden;
  pointer-events: none;
  transform: translateX(-50%);
  mask-image: linear-gradient(90deg, transparent 0, #000 18%, #000 82%, transparent 100%);
}

.pricing-orbit-reflection--top { top: 4%; transform: translateX(-50%) scaleY(-1); }
.pricing-orbit-reflection--bottom { bottom: 4%; }
```

Each slice uses the matching `--pricing-spectrum`, a maximum blur of `6px`, and two offset pseudo-elements for cyan/gold fringe.

- [ ] **Step 4: Synchronize reflection keyframes with card stops**

Use the same `0/12/38/50/54/78/92/100%` stops. At `50%`, slices are narrow and brightest. At `100%`, the incoming slice exactly matches the active static slice.

- [ ] **Step 5: Restrict exposure and spectral edges to the edge-on beat**

```css
@keyframes pricing-scene-exposure {
  0%, 38%, 64%, 100% { opacity: 0; }
  48% { opacity: .18; }
  54% { opacity: .34; }
}
```

Spectral edges remain opacity zero outside `40-62%`.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: PASS.

### Task 5: Responsive, reduced-motion and visual QA

**Files:**
- Modify: `src/styles.css` pricing media queries only.
- Verify: all pricing files.

**Interfaces:**
- Produces: stable desktop, tablet, mobile and reduced-motion states.

- [ ] **Step 1: Add explicit responsive and reduced-motion contracts**

Require pricing selectors under `max-width: 900px`, `max-width: 560px` and `prefers-reduced-motion: reduce`. Reduced motion must remove all pricing animations and hide reflection/spectral transition layers.

- [ ] **Step 2: Run the full test suite**

Run: `npm test -- --run`

Expected: all tests PASS.

- [ ] **Step 3: Build the production bundle**

Run: `npm run build`

Expected: TypeScript and Vite exit `0`.

- [ ] **Step 4: Run browser QA at three viewports**

Verify `1440x900`, `1024x768`, `390x844` at hold, `38%`, `50%`, `78%` and settled frames. Check card alignment, edge-on beat, reflection position, text legibility, tab synchronization and horizontal overflow.

- [ ] **Step 5: Verify interaction and lifecycle**

Confirm auto transition starts after `4 500 мс`, hover does not pause, manual selection uses the same `980 мс` transition, focus and hidden document pause future cycles, and reduced motion is static.

- [ ] **Step 6: Review the diff boundary**

Run: `git diff -- src/sections/PricingSection.tsx src/sections/PricingOrbit.tsx src/sections/pricingMotion.ts src/sections/PricingSection.test.tsx src/sections/pricingMotion.test.ts src/styles.css`

Expected: only pricing behavior and scoped pricing styles changed. No locked Hero files, global selectors, dependencies or configuration files changed.
