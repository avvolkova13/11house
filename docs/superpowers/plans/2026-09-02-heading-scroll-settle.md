# Heading Scroll Settle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every scroll-triggered heading transition finishes on a fully assembled heading and never remains in a fragmented intermediate state after scrolling stops.

**Architecture:** Keep scroll as the sole trigger and retain the existing fragment rendering. Extract deterministic target-selection helpers into a small motion module, then debounce scroll completion and animate the current progress to the directed integer target with one cancellable `requestAnimationFrame` tween.

**Tech Stack:** React, TypeScript, Vitest, browser `scroll` events, `requestAnimationFrame`.

## Global Constraints

- Any forward scroll settles to the next complete heading.
- Any backward scroll settles to the previous complete heading.
- Settling stops at that heading and must not advance again without a new scroll event.
- Existing background, typography, fragment styling, reduced-motion behavior, and infinite cyclic order remain unchanged.
- Do not commit or push.

---

### Task 1: Directed snap target

**Files:**
- Create: `src/cosmic/copyMotion.ts`
- Create: `src/cosmic/copyMotion.test.ts`

**Interfaces:**
- Produces: `getDirectedSnapTarget(progress: number, direction: -1 | 1): number`
- Produces: `easeOutCubic(progress: number): number`

- [ ] **Step 1: Write failing tests** for tiny forward/backward movement, partially completed movement, and clamped easing.
- [ ] **Step 2: Run `npm test -- --run src/cosmic/copyMotion.test.ts`** and confirm failure because the module does not exist.
- [ ] **Step 3: Implement the two pure functions** with directed floor/ceiling behavior and a clamped cubic ease.
- [ ] **Step 4: Re-run the focused test** and confirm it passes.

### Task 2: Scroll-end settling

**Files:**
- Modify: `src/components/CosmicHero.tsx`

**Interfaces:**
- Consumes: `getDirectedSnapTarget`, `easeOutCubic`

- [ ] **Step 1: Track raw progress and the latest directed target** without changing the existing visual fragment function.
- [ ] **Step 2: On every real scroll delta, cancel an active settle tween, update progress, and arm a short scroll-end timer.**
- [ ] **Step 3: When the timer fires, tween from the current progress to exactly the directed integer target, normalize after completion, and stop.**
- [ ] **Step 4: Cancel timers and animation frames on cleanup; preserve reduced-motion behavior.**
- [ ] **Step 5: Run all tests and the production build.**

### Task 3: Live behavior verification

**Files:**
- Verify: `src/components/CosmicHero.tsx`

- [ ] **Step 1: Open the running page and wait for network idle.**
- [ ] **Step 2: Apply a tiny forward scroll, stop, and verify the next heading becomes fully assembled.**
- [ ] **Step 3: Wait without scrolling and verify the heading does not advance again.**
- [ ] **Step 4: Apply a tiny backward scroll and verify the previous heading fully assembles.**
- [ ] **Step 5: Interrupt settling with reversed scroll and verify it changes direction cleanly.**
- [ ] **Step 6: Check reduced motion, console errors, and horizontal overflow.**
