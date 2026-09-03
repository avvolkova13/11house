# ElevenHouse Remaining Landing Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the evidence-backed homepage narrative after the existing client story without changing the locked Hero.

**Architecture:** Add focused React section components under `src/sections`, share deterministic scroll helpers through `sectionMotion.ts`, and mount them after `OneClientStory`. Add only uniquely scoped CSS selectors at the end of `src/styles.css`.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Vite.

## Global Constraints

- Do not modify `CosmicHero`, `src/cosmic/**`, Hero order, Hero styles, dependencies, or global root rules.
- Product screenshots are the source of truth; do not invent UI states, metrics, people, reviews, or links.
- Pricing facts must match the new brief exactly.
- Reduced motion must render usable sequential content without sticky scrub behavior.
- Public copy is Russian; code and identifiers are English.

---

### Task 1: Product and AI narrative

**Files:**
- Create: `src/sections/ProductProof.tsx`
- Create: `src/sections/AiRoutine.tsx`
- Modify: `src/sections/sectionMotion.ts`
- Test: `src/sections/sectionMotion.test.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing `getSectionProgress()` and real screenshots in `public/assets/product-screenshots/`.
- Produces: `<ProductProof />`, `<AiRoutine />`, and deterministic `getScenePosition(progress, sceneCount)`.

- [ ] Add failing unit tests for clamped scene index and local progress.
- [ ] Run `npm test -- --run` and confirm the new assertions fail.
- [ ] Implement the helper and both sections with confirmed screenshots and copy.
- [ ] Append scoped desktop, mobile and reduced-motion styles.
- [ ] Run `npm test -- --run` and confirm all tests pass.

### Task 2: One-cabinet product index

**Files:**
- Create: `src/sections/UnifiedWorkspace.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: confirmed EH-P01, P02, P03, P04, P05 and P09 screenshots.
- Produces: `<UnifiedWorkspace />` with a single primary product plane and a labelled index.

- [ ] Implement a semantic section with no invented product states.
- [ ] Add isolated responsive styles and reduced-motion behavior.
- [ ] Run `npm run build` and confirm TypeScript and Vite pass.

### Task 3: Exact pricing and FAQ

**Files:**
- Create: `src/sections/PricingSection.tsx`
- Create: `src/sections/FaqSection.tsx`
- Test: `src/sections/pricingData.test.ts`
- Create: `src/sections/pricingData.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: typed `pricingPlans`, `<PricingSection />`, and accessible `<FaqSection />`.

- [ ] Add failing tests for prices, monthly limits and commissions.
- [ ] Implement exact typed pricing data and confirm tests pass.
- [ ] Implement the desktop comparison and mobile plan flow.
- [ ] Implement FAQ with native `details`/`summary` controls.
- [ ] Run `npm test -- --run`.

### Task 4: Final CTA and integration

**Files:**
- Create: `src/sections/FinalCta.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: all new section components.
- Produces: complete post-Hero landing sequence.

- [ ] Implement final CTA without fabricated legal/contact destinations.
- [ ] Mount all sections after `OneClientStory` while preserving its order after `CosmicHero`.
- [ ] Run `npm test -- --run` and `npm run build`.

### Task 5: Visual and interaction QA

**Files:**
- Modify only files with verified defects.

**Interfaces:**
- Produces: desktop and mobile layouts with no overflow, readable screenshots and functional accordion controls.

- [ ] Inspect desktop at 1440×900 and mobile at 390×844.
- [ ] Verify reduced-motion rendering and keyboard focus.
- [ ] Check the console for errors and confirm no horizontal overflow.
- [ ] Re-run `npm test -- --run` and `npm run build` after fixes.

