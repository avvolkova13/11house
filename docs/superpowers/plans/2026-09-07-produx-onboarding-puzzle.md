# Produx-style Onboarding Puzzle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four simultaneous onboarding cards in `04 · Возможности` with four sequential centered scroll scenes whose interface screenshots assemble from a Produx-style 7 × 4 puzzle.

**Architecture:** A pure `onboardingPuzzleMotion` module maps normalized onboarding progress to the active step plus 28 deterministic fragment states. A focused `OnboardingPuzzle` component exposes one imperative render method so the existing `ProductProof` animation-frame loop can update transforms without React rendering on every scroll tick. Scoped CSS provides the centered desktop sticky scene and static mobile/reduced-motion sequence.

**Tech Stack:** React 19, TypeScript 5.9, CSS custom properties, native `requestAnimationFrame`, Vitest, Vite. No new dependencies.

## Global Constraints

- Do not modify `CosmicHero`, `src/cosmic/**`, Hero dependencies, global root/body rules, package files, or public product assets.
- Preserve the four approved onboarding titles, the following five-card process chapter, and the section order.
- Use exactly one painted 28-fragment puzzle on desktop; do not animate four full filter stacks.
- Animate only `transform`, `opacity`, and `filter`.
- Mobile at or below 900px and reduced motion render a static centered sequence.
- Do not commit, push, publish, or install dependencies.

---

### Task 1: Deterministic puzzle motion model

**Files:**
- Create: `src/sections/onboardingPuzzleMotion.ts`
- Create: `src/sections/onboardingPuzzleMotion.test.ts`

**Interfaces:**
- Produces: `PUZZLE_COLUMNS = 7`, `PUZZLE_ROWS = 4`, `PUZZLE_FRAGMENT_COUNT = 28`.
- Produces: `getOnboardingPuzzlePosition(progress: number, stepCount: number): { stepIndex: number; local: number }`.
- Produces: `getOnboardingFragmentState(local: number, fragmentIndex: number): OnboardingFragmentState`.
- Produces: `getOnboardingCopyState(local: number): OnboardingCopyState`.
- Produces: `getPuzzleBackgroundPosition(fragmentIndex: number): { x: number; y: number }`.

- [ ] **Step 1: Write the failing model test.**

```ts
import { describe, expect, it } from 'vitest'
import {
  PUZZLE_FRAGMENT_COUNT,
  getOnboardingCopyState,
  getOnboardingFragmentState,
  getOnboardingPuzzlePosition,
  getPuzzleBackgroundPosition,
} from './onboardingPuzzleMotion'

describe('onboardingPuzzleMotion', () => {
  it('maps progress into four reversible step intervals', () => {
    expect(getOnboardingPuzzlePosition(0, 4)).toEqual({ stepIndex: 0, local: 0 })
    expect(getOnboardingPuzzlePosition(0.375, 4)).toEqual({ stepIndex: 1, local: 0.5 })
    expect(getOnboardingPuzzlePosition(1, 4)).toEqual({ stepIndex: 3, local: 1 })
  })

  it('builds a complete seven-by-four image atlas', () => {
    expect(PUZZLE_FRAGMENT_COUNT).toBe(28)
    expect(getPuzzleBackgroundPosition(0)).toEqual({ x: 0, y: 0 })
    expect(getPuzzleBackgroundPosition(6)).toEqual({ x: 100, y: 0 })
    expect(getPuzzleBackgroundPosition(27)).toEqual({ x: 100, y: 100 })
  })

  it('starts dispersed, assembles crisply, then disperses again', () => {
    const start = getOnboardingFragmentState(0, 0)
    const hold = getOnboardingFragmentState(0.72, 0)
    const exit = getOnboardingFragmentState(1, 0)
    expect(start.opacity).toBe(0)
    expect(start.blur).toBe(40)
    expect(hold).toMatchObject({ x: 0, y: 0, z: 0, scale: 1, opacity: 1, blur: 0 })
    expect(exit.opacity).toBe(0)
    expect(Math.abs(exit.x)).toBeGreaterThan(100)
  })

  it('stagger-resolves fragments and copy around the readable hold', () => {
    expect(getOnboardingFragmentState(0.2, 2).opacity)
      .toBeGreaterThan(getOnboardingFragmentState(0.2, 27).opacity)
    expect(getOnboardingCopyState(0).opacity).toBe(0)
    expect(getOnboardingCopyState(0.72)).toMatchObject({ opacity: 1, blur: 0, y: 0 })
    expect(getOnboardingCopyState(1).opacity).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test and verify RED.**

Run: `npm test -- --run src/sections/onboardingPuzzleMotion.test.ts`

Expected: FAIL because `./onboardingPuzzleMotion` does not exist.

- [ ] **Step 3: Implement the pure model.**

Use a fixed 28-entry seed list containing `x`, `y`, `z`, and a unique stagger `order`. Clamp all external progress. Use `smootherstep(start, end, value)` for copy entry/exit and for each fragment's assembly from `0.04 + order × 0.012` through `start + 0.30`. Hold all resolved values at `local = 0.72`. From `0.82` to `1`, send each fragment back toward `seed × 0.42`, lower opacity to zero, and raise blur toward `24px`. Round public values to four decimals so repeated forward/backward sampling is stable.

- [ ] **Step 4: Run the model test and verify GREEN.**

Run: `npm test -- --run src/sections/onboardingPuzzleMotion.test.ts`

Expected: one test file passes with four tests.

---

### Task 2: One reusable onboarding puzzle component

**Files:**
- Create: `src/sections/OnboardingPuzzle.tsx`
- Create: `src/sections/OnboardingPuzzle.test.tsx`

**Interfaces:**
- Consumes: `steps: readonly OnboardingPuzzleStep[]` with `index`, `title`, `caption`, `src`, and `alt`.
- Produces: `OnboardingPuzzleHandle.render(progress: number): void`.
- Produces: `data-onboarding-puzzle`, 28 `data-puzzle-fragment` elements, four `data-onboarding-copy` layers, and four static mobile figures.

- [ ] **Step 1: Write the failing render/source contract.**

```tsx
import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OnboardingPuzzle, type OnboardingPuzzleHandle } from './OnboardingPuzzle'

const steps = Array.from({ length: 4 }, (_, index) => ({
  index: `0${index + 1}`,
  title: `Шаг ${index + 1}`,
  caption: `Польза ${index + 1}`,
  src: `/screen-${index + 1}.png`,
  alt: `Экран ${index + 1}`,
}))

describe('OnboardingPuzzle', () => {
  it('renders one 28-piece desktop puzzle and four centered copy states', () => {
    const html = renderToStaticMarkup(
      <OnboardingPuzzle ref={createRef<OnboardingPuzzleHandle>()} steps={steps} />,
    )
    expect(html.match(/data-puzzle-fragment=/g)).toHaveLength(28)
    expect(html.match(/data-onboarding-copy=/g)).toHaveLength(4)
    expect(html).toContain('data-onboarding-puzzle')
    expect(html).toContain('--puzzle-background-x:100%')
    expect(html).toContain('--puzzle-background-y:100%')
  })

  it('keeps a complete static sequence for mobile and reduced motion', () => {
    const html = renderToStaticMarkup(<OnboardingPuzzle steps={steps} />)
    expect(html.match(/onboarding-puzzle__static-step/g)).toHaveLength(4)
    steps.forEach((step) => {
      expect(html).toContain(step.title)
      expect(html).toContain(step.caption)
      expect(html).toContain(step.alt)
    })
  })
})
```

- [ ] **Step 2: Run the component test and verify RED.**

Run: `npm test -- --run src/sections/OnboardingPuzzle.test.tsx`

Expected: FAIL because `./OnboardingPuzzle` does not exist.

- [ ] **Step 3: Implement `OnboardingPuzzle`.**

Use `forwardRef` and `useImperativeHandle`. Cache the puzzle root, copy layers, and fragment nodes in refs. `render(progress)` must call `getOnboardingPuzzlePosition`, change `--puzzle-image` only when `stepIndex` changes, mark only that copy layer active, write copy custom properties once, and write six custom properties per fragment. The first static screenshot uses `loading="eager"`; the remaining three use `loading="lazy"`. The desktop visual tree is `aria-hidden="true"`; the static sequence supplies meaningful image alts and remains the accessible semantic ordered list.

- [ ] **Step 4: Run the component and model tests.**

Run: `npm test -- --run src/sections/onboardingPuzzleMotion.test.ts src/sections/OnboardingPuzzle.test.tsx`

Expected: both files pass.

---

### Task 3: Integrate the centered four-step scene into ProductProof

**Files:**
- Modify: `src/sections/ProductProof.tsx`
- Modify: `src/sections/landingCopy.test.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `OnboardingPuzzleHandle.render(progress)`.
- Preserves: existing `getProductCardState(processProgress, ...)` process-card updates.
- Adds: `caption` to every `onboardingSteps` item.

- [ ] **Step 1: Add failing integration/style assertions.**

Extend the landing contract to require `<OnboardingPuzzle`, all four exact captions, `onboardingPuzzleRef.current?.render(onboardingProgress)`, `const onboardingProgress = clamp01(progress / 0.42)`, and `const processProgress = clamp01((progress - 0.4) / 0.6)`. Add a raw CSS contract requiring `height: 1540svh`, centered text, a seven-by-four grid, `perspective: 1200px`, `background-size: 700% 400%`, fragment width/height `calc(100% + 1px)`, mobile static layout, and reduced-motion static layout.

- [ ] **Step 2: Run integration tests and verify RED.**

Run: `npm test -- --run src/sections/landingCopy.test.ts src/sections/OnboardingPuzzle.test.tsx`

Expected: FAIL because `ProductProof` still renders the four-column `.product-proof__onboarding` grid.

- [ ] **Step 3: Replace only the onboarding grid markup.**

Import `OnboardingPuzzle` and `OnboardingPuzzleHandle`, create `onboardingPuzzleRef`, extend the four data objects with the approved captions, and replace the existing `<ol className="product-proof__onboarding">…</ol>` with `<OnboardingPuzzle ref={onboardingPuzzleRef} steps={onboardingSteps} />`. Keep the chapter heading and all process-card markup unchanged.

- [ ] **Step 4: Update only the progress split.**

Use:

```ts
const onboardingProgress = clamp01(progress / 0.42)
const processProgress = clamp01((progress - 0.4) / 0.6)
onboardingPuzzleRef.current?.render(onboardingProgress)
section.style.setProperty('--onboarding-opacity', (1 - clamp01((progress - 0.4) / 0.035)).toFixed(4))
section.style.setProperty('--process-opacity', clamp01((progress - 0.4) / 0.035).toFixed(4))
```

Leave the process-card model and its CSS custom properties unchanged.

- [ ] **Step 5: Append scoped desktop puzzle CSS.**

Inside `@media (min-width: 901px)`, set `.product-proof` to `height: 1540svh; min-height: 11000px`. Center `.product-proof__heading`. Position `.onboarding-puzzle` over the sticky viewport, put copy titles near the top, constrain media to `min(82vw, calc(62svh * 1.6), 1120px)` with `aspect-ratio: 1.6`, and place captions at the bottom. Use a `7 × 4` grid with `perspective: 1200px`; each tile uses the shared screenshot URL, `background-size: 700% 400%`, per-tile background positions, and CSS variables for translate3d/scale/opacity/blur.

- [ ] **Step 6: Append mobile and reduced-motion CSS.**

At `max-width: 900px`, hide the desktop stage and show the four centered static figures in normal flow with title → large crop → caption. Under `.product-proof[data-motion="reduced"]`, apply the same static sequence and ensure section/sticky height is auto. Do not animate filter or transform in either fallback.

- [ ] **Step 7: Run focused integration tests.**

Run: `npm test -- --run src/sections/onboardingPuzzleMotion.test.ts src/sections/OnboardingPuzzle.test.tsx src/sections/landingCopy.test.ts src/sections/productCardStackMotion.test.ts`

Expected: all focused tests pass and the existing five-card process contract remains green.

---

### Task 4: Motion, responsive, and repository verification

**Files:**
- Verify: `src/sections/onboardingPuzzleMotion.ts`
- Verify: `src/sections/OnboardingPuzzle.tsx`
- Verify: `src/sections/ProductProof.tsx`
- Verify: `src/styles.css`

**Interfaces:**
- No new interfaces; this task validates the completed integration.

- [ ] **Step 1: Run the full test suite.**

Run: `npm test -- --run`

Expected: all test files and tests pass with zero failures.

- [ ] **Step 2: Run the production build.**

Run: `npm run build`

Expected: TypeScript and Vite complete with exit code 0; the existing chunk-size advisory may remain.

- [ ] **Step 3: Inspect desktop motion in the local browser.**

At `http://127.0.0.1:5185/`, sample each step at dispersed, mid-assembly, crisp hold, and outgoing states. Confirm one visible centered screenshot, irregular stagger, depth-linked blur, no tile seams, title above, caption below, reversible scroll, and a clean handoff into the untouched process-card chapter.

- [ ] **Step 4: Inspect narrow and reduced-motion layouts.**

Confirm the four static centered steps are readable at a narrow viewport and with `?reduced-motion`; there must be no sticky trap, horizontal overflow, duplicated visible copy, or filter-heavy animation.

- [ ] **Step 5: Check runtime and repository hygiene.**

Check the local browser console for errors. Run `git diff --check` and `git status --short`. Confirm this task changed only the new puzzle files, `ProductProof.tsx`, scoped `styles.css`, landing tests, and the spec/plan documents; do not alter locked Hero files.

## Self-review

- Spec coverage: the plan covers deterministic fragment geometry, scroll phases, source swapping, centered structure, captions, mobile/reduced motion, lifecycle cleanup, process-chapter preservation, and full QA.
- Placeholder scan: all implementation and verification steps contain exact files, interfaces, commands, constants, or required behavior; no deferred sections remain.
- Type consistency: `OnboardingPuzzleHandle.render(progress)`, `OnboardingPuzzleStep`, and all motion-model exports are named consistently across tasks.
- Execution choice: the user previously requested direct autonomous work in the current workspace, so the plan will be executed inline without agents, commits, dependency changes, or another approval pause.
