# Persistent Tunnel Scale and Idle Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the formed ElevenHouse tunnel viewport-filling and visibly alive when scrolling stops without changing the approved formation transition.

**Architecture:** Extend the pure tunnel motion model with a stable projection contract and deterministic idle state. Feed those values into the existing `CosmicScene` and `NebulaField`; keep the single surface and shaders rather than introducing a second mesh.

**Tech Stack:** TypeScript, Three.js, GLSL, Vitest, Vite.

## Global Constraints

- Do not change the existing terrain-to-tunnel transition.
- Do not add dependencies.
- Keep product copy and product UI untouched.
- Respect `prefers-reduced-motion`.
- Use the reference only for composition and motion logic; retain ElevenHouse palette and material.

---

### Task 1: Lock persistent scale and idle motion in tests

**Files:**
- Modify: `src/cosmic/tunnelMotion.test.ts`

**Interfaces:**
- Consumes: `getTunnelMotion(input)` and new `getTunnelIdleMotion(input)`.
- Produces: regression coverage for stable projection and autonomous motion.

- [ ] **Step 1: Write failing projection tests**

Replace the tightening assertion with a projected-distance assertion comparing presentation start and full dive. Assert that `surfaceDepth`, `openingScale`, and camera depth keep the mouth at least as large.

- [ ] **Step 2: Write failing idle tests**

Assert that `getTunnelIdleMotion` changes orbit and flow across elapsed time at zero scroll, and returns zero motion for reduced motion.

- [ ] **Step 3: Run the focused test and confirm RED**

Run: `npm test -- --run src/cosmic/tunnelMotion.test.ts`

Expected: FAIL because the current model shrinks and `getTunnelIdleMotion` is not defined.

### Task 2: Implement the pure motion contract

**Files:**
- Modify: `src/cosmic/tunnelMotion.ts`

**Interfaces:**
- Produces: `surfaceDepth`, persistent `openingScale`, restrained camera flight, and `getTunnelIdleMotion({ elapsed, presentation, reducedMotion })`.

- [ ] **Step 1: Remove final dive shrink**

Keep `referenceScale` constant across dive and make `openingScale` presentation-only.

- [ ] **Step 2: Stabilize projected distance**

Return a shallow presentation depth shift and reduce camera Z flight so the final camera-to-surface distance does not grow.

- [ ] **Step 3: Add deterministic idle state**

Return continuous orbit, flow boost, subtle camera drift, and scale breathing; return neutral values for reduced motion.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `npm test -- --run src/cosmic/tunnelMotion.test.ts`

Expected: all tunnel motion tests pass.

### Task 3: Wire projection and idle motion into WebGL

**Files:**
- Modify: `src/cosmic/CosmicScene.ts`
- Modify: `src/cosmic/NebulaField.ts`
- Modify: `src/cosmic/shaders/nebula.ts`

**Interfaces:**
- Consumes: pure projection and idle state from `tunnelMotion.ts`.
- Produces: stable shell framing, continuous shell orbit, flowing tunnel particles and subtle no-scroll camera parallax.

- [ ] **Step 1: Advance tunnel travel at idle**

Add the idle flow boost to the existing travel speed only during tunnel presentation.

- [ ] **Step 2: Apply stable surface depth and scale**

Drive `NebulaField` surface position and group scale from the motion state instead of receding to `-173`.

- [ ] **Step 3: Apply continuous orbit and particle flow**

Use the idle orbit on the nebula group and advect only the point layer along the formed tunnel. Keep the surface contour drift subtle and continuous.

- [ ] **Step 4: Apply restrained idle camera parallax**

Blend idle camera offsets only after presentation begins; suppress them for reduced motion.

### Task 4: Verification and visual QA

**Files:**
- Modify only if QA exposes a verified mismatch.

**Interfaces:**
- Produces: evidence that behavior matches the approved design contract.

- [ ] **Step 1: Run all tests**

Run: `npm test -- --run`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Compare desktop frames**

Capture tunnel start, middle, full dive, and two frames 3 seconds apart without scroll. Confirm the mouth never becomes a small isolated object and idle movement is visible.

- [ ] **Step 4: Compare mobile frames**

Repeat at the mobile viewport. Confirm the throat remains visible and the near mouth stays outside the frame.

