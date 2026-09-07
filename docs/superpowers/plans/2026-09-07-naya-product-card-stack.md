# Naya-style Product Card Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ProductProof process crossfade with a five-card, scroll-scrubbed stack matching Naya’s measured entry, accumulation, and exit motion.

**Architecture:** A pure `productCardStackMotion` module converts normalized progress and card index into transform/opacity/blur values. `ProductProof` applies those values as scoped CSS custom properties, while the existing data array supplies content and images. Scoped CSS renders the visual system and separate static reduced-motion/mobile fallbacks.

**Tech Stack:** React 19, TypeScript, CSS custom properties, Vitest, Vite. No new dependencies.

## Global Constraints

- Do not modify the locked Hero, cosmic files, global root/body rules, dependencies, or build configuration.
- Modify only the ProductProof process chapter and its uniquely scoped styles.
- Use ElevenHouse content/assets; do not copy Naya brand assets, copy, video, or fonts.
- Preserve the existing five product scenes and benefit-led Russian copy.
- Implement reduced-motion cleanup and a readable static mobile sequence.
- Do not commit, push, publish, or install dependencies.

---

### Task 1: Pure card-stack motion model

**Files:**
- Create: `src/sections/productCardStackMotion.ts`
- Create: `src/sections/productCardStackMotion.test.ts`

**Interfaces:**
- Produces: `getProductCardState(progress: number, index: number, count: number, compact: boolean): ProductCardState`
- `ProductCardState` contains `x`, `y`, `rotation`, `scale`, `opacity`, `blur`, and `zIndex`.

- [ ] **Step 1: Write failing tests** covering off-screen alternating entries, compact settled fan offsets, stagger ordering, sequential upward exits, clamping, and compact travel.
- [ ] **Step 2: Run** `npm test -- src/sections/productCardStackMotion.test.ts` and verify failure because the module does not exist.
- [ ] **Step 3: Implement** clamped progress, eased entry, slow settle interpolation, and staggered exit.
- [ ] **Step 4: Run** the focused test and verify all cases pass.

### Task 2: ProductProof integration

**Files:**
- Modify: `src/sections/ProductProof.tsx`
- Modify: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: `getProductCardState` from Task 1.
- Produces: CSS variables `--card-x`, `--card-y`, `--card-rotation`, `--card-scale`, `--card-opacity`, `--card-blur`, and z-index on each `data-proof-card`.

- [ ] **Step 1: Add a failing source-contract test** requiring `data-proof-card`, a media layer, the number/title/footer structure, and the absence of the old `proof-scene__frame` markup in the process chapter.
- [ ] **Step 2: Run** `npm test -- src/sections/landingCopy.test.ts` and verify the new contract fails.
- [ ] **Step 3: Replace** the process scene markup with stacked articles while preserving all data, alt text, and heading copy.
- [ ] **Step 4: Update** the existing animation frame handler to apply the pure motion state and preserve listener cleanup.
- [ ] **Step 5: Run** the focused copy/source tests and verify they pass.

### Task 3: Scoped Naya-derived visual treatment

**Files:**
- Modify: `src/styles.css` only under `.product-proof` / `.proof-card-stack` selectors.

**Interfaces:**
- Consumes: Task 2 DOM and CSS variables.
- Produces: sticky portrait card layout, translucent navy layers, tint, crop, edge, typography, fan depth, mobile clamps, and reduced-motion static list.

- [ ] **Step 1: Implement** the desktop sticky composition using the measured 29.5vw × 59.6vh geometry and 26px radius.
- [ ] **Step 2: Implement** card screenshot crops and layered navy/black tint without external reference assets.
- [ ] **Step 3: Implement** a readable static card sequence at 900px and 560px so onboarding and product cards cannot clip inside one sticky viewport.
- [ ] **Step 4: Implement** reduced-motion static layout with no animated filter/transform.
- [ ] **Step 5: Run** `npm test -- src/sections/productCardStackMotion.test.ts src/sections/landingCopy.test.ts`.

### Task 4: Visual, motion, and regression QA

**Files:**
- Modify only if a verified issue is found: `src/sections/ProductProof.tsx`, `src/sections/productCardStackMotion.ts`, `src/styles.css`

- [ ] **Step 1: Inspect** the local section at desktop start, partial entry, full stack, and exit positions; compare geometry and trajectory to the reference measurements.
- [ ] **Step 2: Inspect** at 390×844 and confirm readable crops with no horizontal page overflow.
- [ ] **Step 3: Inspect** reduced motion and confirm a static vertical list.
- [ ] **Step 4: Check** console errors at the edited section.
- [ ] **Step 5: Run** `npm test -- --run` and expect the full suite to pass.
- [ ] **Step 6: Run** `npm run build` and expect TypeScript/Vite success.
- [ ] **Step 7: Review** `git diff` to confirm no locked Hero or unrelated files were changed by this task.
