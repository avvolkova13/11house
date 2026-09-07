# Pricing Three-Card Turn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five-plane deforming pricing ribbon with a three-card infinite 360-degree Y-axis turn while preserving the current 4500 ms hold and 1350 ms transition.

**Architecture:** Keep the existing React transition state and WebGL lifecycle. Replace the ribbon deformation sampler with a rigid cyclic three-card trajectory, use exactly three plane resource groups, and keep each texture attached to its physical plane for the entire move. Reuse the two reflection meshes per card as broad top/bottom portal trails.

**Tech Stack:** React 19, TypeScript, Three.js, GLSL, Vitest, Vite.

## Global Constraints

- Do not modify locked Hero files, Hero DOM order, global layout rules, dependencies, or package files.
- Keep `PRICING_HOLD_MS = 4500` and `PRICING_TRANSITION_MS = 1350`.
- Render exactly three visible pricing cards.
- Use rigid Y-axis rotation; do not deform card geometry.
- Preserve reduced-motion, viewport gating, fallback, and GPU cleanup.
- Do not commit, push, publish, or install dependencies.

---

### Task 1: Define the rigid three-slot motion contract

**Files:**
- Modify: `src/sections/pricingWebglMotion.test.ts`
- Modify: `src/sections/pricingWebglMotion.ts`

**Interfaces:**
- Consumes: `PricingMotionDirection` from `pricingMotion.ts`.
- Produces: `samplePricingTurn(progress, direction)` and `samplePricingPlane(slot, turn)` with continuous travel, rigid position, scale, opacity, `rotationY`, and `reflectionIntensity`.

- [x] **Step 1: Write failing tests**

Add assertions that progress 0 and 1 are settled, midpoint/edge phases produce a continuous full turn, scale never overshoots, no deformation fields remain, and backward motion mirrors rotation.

- [x] **Step 2: Run the focused test**

Run: `npm test -- --run src/sections/pricingWebglMotion.test.ts`

Expected: FAIL because the new sampler contract is not implemented.

- [x] **Step 3: Implement the sampler**

Use one quintic smootherstep for a full `Math.PI * 2` turn and cyclic position travel, with maximum velocity at 180 degrees, no midpoint pause, and a long zero-jerk landing. Move the right card into center, the center card left, and carry the wrapping left card through a smaller, deeper rear arc to the right.

- [x] **Step 4: Re-run the focused test**

Run: `npm test -- --run src/sections/pricingWebglMotion.test.ts`

Expected: PASS.

---

### Task 2: Render only three moving WebGL card groups with attached textures

**Files:**
- Modify: `src/sections/PricingWebGLScene.test.ts`
- Modify: `src/sections/PricingWebGLScene.ts`
- Modify: `src/sections/pricingShaders.test.ts`
- Modify: `src/sections/pricingShaders.ts`

**Interfaces:**
- Consumes: the turn/plane samples from Task 1 and `PricingWebGLRenderState`.
- Produces: `PLANE_SLOTS = [-1, 0, 1]`, nine isolated materials, stable texture ownership, unmirrored back-face copy, and top/bottom portal trails.

- [x] **Step 1: Write failing scene tests**

Assert three plane slots, nine materials, three rigid main geometries, modular three-plan mapping, stable textures throughout the move, and zero deformation uniforms.

- [x] **Step 2: Run the focused scene tests**

Run: `npm test -- --run src/sections/PricingWebGLScene.test.ts src/sections/pricingShaders.test.ts`

Expected: FAIL against the current five-plane deformation implementation.

- [x] **Step 3: Update the scene**

Create only slots `-1, 0, 1`; apply moving position/depth and `rotation.y` from the rigid sampler; bind each plan texture to one physical plane; build broad top/bottom water reflections from segmented meshes with travelling phase waves, art-zone mirroring and chromatic refraction; remove fold/wave/pinch deformation inputs from the card shader path.

- [x] **Step 4: Re-run focused scene tests**

Run: `npm test -- --run src/sections/PricingWebGLScene.test.ts src/sections/pricingShaders.test.ts`

Expected: PASS.

---

### Task 3: Align interaction and fallback with the three-slot scene

**Files:**
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/sections/PricingOrbit.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: the existing `PricingMotionState`, three pricing plans, and scene hold frame.
- Produces: exactly three click targets and exactly three fallback cards with matching left/center/right positions.

- [x] **Step 1: Add failing DOM/CSS assertions**

Assert that every plan has one hit target, no relay/offscreen selectors remain, and fallback renders only the three fixed roles.

- [x] **Step 2: Run the focused component test**

Run: `npm test -- --run src/sections/PricingSection.test.tsx`

Expected: FAIL until selectors and transition roles are aligned.

- [x] **Step 3: Update scoped pricing styles and role mapping**

Keep existing timing variables and responsive hit-area sizes, remove five-card relay behavior, and preserve focus visibility and fallback semantics.

- [x] **Step 4: Re-run the focused component test**

Run: `npm test -- --run src/sections/PricingSection.test.tsx`

Expected: PASS.

---

### Task 4: Regression and visual verification

**Files:**
- Verify only; no planned Hero changes.

**Interfaces:**
- Consumes: the completed pricing implementation.
- Produces: evidence that tests/build pass and the animation remains usable on desktop/mobile.

- [x] **Step 1: Run all tests**

Run: `npm test -- --run`

Expected: all suites PASS.

- [x] **Step 2: Build production bundle**

Run: `npm run build`

Expected: build succeeds; the existing large-chunk warning is acceptable.

- [x] **Step 3: Inspect local desktop and mobile states**

Verify `http://127.0.0.1:5185/` at hold, edge-on, midpoint, and settled frames using the existing `pricing-progress` development override. Confirm three visible moving cards, rigid 360-degree rotation, attached textures, rear wrap, layered top/bottom portal pulse, and no Hero regression.
