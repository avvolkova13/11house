# Produx Practitioner Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the ElevenHouse practitioner-results block as a measured Produx-style pinned horizontal testimonial sequence.

**Architecture:** Pure motion math lives in a focused TypeScript module and is covered by Vitest. The React section owns DOM refs, a single requestAnimationFrame scroll coordinator, pointer drag-to-scroll, and CSS custom properties; all visual changes are scoped below `.practitioner-results`.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Vite.

## Global Constraints

- Do not modify the locked Hero, its DOM, its dependencies, or global root selectors.
- Do not add dependencies, commit, push, or publish.
- Preserve the existing three practitioner stories and Russian landing copy.
- Continuously animated properties are limited to transforms and opacity.
- Provide a readable non-sticky mobile and reduced-motion fallback.

---

### Task 1: Deterministic testimonial motion model

**Files:**
- Create: `src/sections/practitionerResultsMotion.ts`
- Test: `src/sections/practitionerResultsMotion.test.ts`

**Interfaces:**
- Produces: `getPractitionerResultsProgress`, `getPractitionerRailState`, `getPractitionerEntranceState`, and `getPractitionerWaveTickState`.

- [ ] **Step 1: Write failing tests**

Cover clamping, the measured `23.3vw` start, final last-card alignment, `0/72/144px` cascade at a 720px viewport, flattened final offsets, monotonic entrance, and a narrow moving wave peak.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- --run src/sections/practitionerResultsMotion.test.ts`

Expected: FAIL because `practitionerResultsMotion.ts` does not exist.

- [ ] **Step 3: Implement the pure functions**

Use clamped `smootherstep`, deterministic rounding, measured viewport ratios, and no browser globals.

- [ ] **Step 4: Verify the tests pass**

Run: `npm test -- --run src/sections/practitionerResultsMotion.test.ts`

Expected: all motion-model tests pass.

### Task 2: Semantic pinned carousel component

**Files:**
- Modify: `src/sections/PractitionerResults.tsx`
- Test: `src/sections/PractitionerResults.test.tsx`

**Interfaces:**
- Consumes: the four pure motion helpers from Task 1.
- Produces: scoped DOM hooks and CSS variables for the visual layer.

- [ ] **Step 1: Write failing source-contract tests**

Assert three semantic articles, 250 decorative ticks, the exact approved heading, pointer cleanup, reduced-motion detection, and no timer-based autoplay.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- --run src/sections/PractitionerResults.test.tsx`

Expected: FAIL against the existing static grid.

- [ ] **Step 3: Rebuild the component**

Create a `320svh` outer section contract with a sticky child, split heading, link, ruler, three article cards, requestAnimationFrame motion updates, resize updates, pointer drag-to-scroll, and cleanup.

- [ ] **Step 4: Verify component tests pass**

Run: `npm test -- --run src/sections/PractitionerResults.test.tsx`

Expected: all component contracts pass.

### Task 3: Produx-measured scoped styling

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `.practitioner-results__stage`, `__heading`, `__wave`, `__track`, `__story`, and CSS variables from Task 2.
- Produces: desktop pinned geometry plus mobile and reduced-motion layouts.

- [ ] **Step 1: Add only section-scoped overrides**

Use `#303930`, `#d4cccc`, desktop `28.5vw` cards, `2.22vw` gaps, `5.5vw` page insets, `23.3vw` start offset, square cards, circular 3.96vw avatars, and the measured typographic ratios.

- [ ] **Step 2: Add mobile and reduced-motion fallbacks**

At `760px`, switch to an auto-height surface and native scroll-snap. Under reduced motion, remove sticky runway, transforms, blur, and smooth scrolling.

- [ ] **Step 3: Run full automated verification**

Run: `npm test -- --run`

Expected: all tests pass.

Run: `npm run build`

Expected: TypeScript and Vite production build succeed.

### Task 4: Visual and motion comparison

**Files:**
- No source files unless comparison reveals a measured mismatch.

**Interfaces:**
- Consumes: the running local Vite page and the live Produx reference.
- Produces: screenshots at entry, middle, and exit plus a desktop/mobile QA result.

- [ ] **Step 1: Capture desktop states**

Open the local section at 1280×720 and capture entry, middle, and exit positions. Compare card width, stage color, heading position, cascade, rail travel, and wave peak against the measured Produx states.

- [ ] **Step 2: Correct visible mismatches**

Tune only scoped section values and rerun the focused tests after every motion-math change.

- [ ] **Step 3: Capture mobile and reduced-motion states**

Verify no page-level scroll lock, readable card copy, native horizontal access to all three cards, and no overlap.

- [ ] **Step 4: Re-run production verification**

Run: `npm test -- --run && npm run build`

Expected: all tests and the production build pass.

## Execution record

- Motion-model red/green cycle completed.
- Component source-contract red/green cycle completed.
- Desktop entry, middle, final and pointer-drag states measured in the live local page at 1280×720.
- Scoped tests pass; production build passes.
- Full regression run: 306 passed, 1 pre-existing failure in `experiments/natal-dial/src/motion.test.ts` (`rotates the cube once around a stable diagonal axis`). The unrelated experiment was not modified.
