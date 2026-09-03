# Mesh-reference Tunnel Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the approved terrain-to-tunnel formation while rebuilding the formed tunnel as an off-axis curved funnel and extending its scroll-driven flight by one full 760px stage.

**Architecture:** Narrative copy remains capped at stage `6`, while a new visual travel limit of `7` feeds the WebGL scene. Pure progress helpers produce `formation`, `presentation`, and `dive` values. `NebulaField` keeps the single shared surface but uses presentation/depth masks for the final funnel, while `CosmicScene` moves the camera along the curved tunnel only during `dive`.

**Tech Stack:** TypeScript, React, Three.js, GLSL, Vitest, Vite.

## Global Constraints

- Preserve the approved `terrain → particle cloud → formed surface` transition.
- Do not modify public copy, product screenshot anatomy, or stage order.
- Add exactly one `760px` visual travel stage without adding placeholder content.
- No new dependencies, textures, copied reference code, or proprietary assets.
- Reverse scroll must reverse flight continuously; reduced motion must not fly the camera.
- Do not commit or push without a separate user request.

---

### Task 1: Separate copy progress from visual progress

**Files:**
- Modify: `src/hero/heroNarrative.ts`
- Modify: `src/hero/heroNarrative.test.ts`
- Modify: `src/scroll/PageScrollCoordinator.ts`
- Modify: `src/scroll/PageScrollCoordinator.test.ts`
- Modify: `src/scroll/HeroScrollAdapter.ts`
- Modify: `src/scroll/HeroScrollAdapter.test.ts`

**Interfaces:**
- Produces: `HERO_LAST_VISUAL_INDEX = HERO_LAST_STAGE_INDEX + 1`
- Produces: `getTunnelPresentation(progress: number): number`
- Produces: `getTunnelDive(progress: number): number`

- [ ] Add failing tests proving corridor travel grows from `4560` to `5320`, visual progress reaches `7`, copy progress still clamps to `6`, presentation starts only after formation is substantially complete, and dive maps `6…7` to `0…1`.
- [ ] Run `npm test -- --run src/hero/heroNarrative.test.ts src/scroll/PageScrollCoordinator.test.ts src/scroll/HeroScrollAdapter.test.ts` and confirm expected assertion failures.
- [ ] Implement the visual limit and progress helpers; keep `clampHeroProgress()` capped at the existing copy stage.
- [ ] Re-run the focused tests and require all to pass.

### Task 2: Model the reference funnel and flight motion

**Files:**
- Modify: `src/cosmic/tunnelMotion.ts`
- Modify: `src/cosmic/tunnelMotion.test.ts`

**Interfaces:**
- Extend: `TunnelMotionInput` with `presentation` and `dive`
- Extend: `TunnelMotionState` with `cameraX`, `cameraY`, `cameraZ`, `contourFrequency`, and `haloDensity`
- Extend: `SurfacePointInput` with `presentation` and `dive`

- [ ] Add failing tests proving the final opening stays above/right, presentation reduces contour frequency into the `30–40` range, dive moves the camera forward on a curved path, reverse velocity reverses travel impulse, and reduced motion zeros the flight offsets.
- [ ] Run `npm test -- --run src/cosmic/tunnelMotion.test.ts` and confirm the new fields/behavior fail.
- [ ] Implement the minimal deterministic motion model while preserving all `mix=0…1, presentation=0` surface samples.
- [ ] Re-run the focused tests and require all to pass.

### Task 3: Render the formed tunnel as a curved funnel

**Files:**
- Modify: `src/cosmic/NebulaField.ts`
- Modify: `src/cosmic/shaders/nebula.ts`
- Modify: `src/cosmic/CosmicScene.ts`
- Modify: `src/components/CosmicHero.tsx`

**Interfaces:**
- `NebulaField.update(elapsed, pointerX, pointerY, travel, dt, pointerActive, tunnelMix, presentation, dive, velocity)`

- [ ] Feed unclamped visual progress to `CosmicScene`, but keep DOM copy bound to `clampHeroProgress`.
- [ ] Add shared `uTunnelPresentation` and `uTunnelDive` uniforms to both surface and particle materials.
- [ ] Preserve the existing morph function for `presentation=0`; blend only the final tubular target toward a tighter curved funnel.
- [ ] Replace the uniform `112` contour bands with a presentation-driven `112 → 36` frequency and apply depth/angle/view masks so the foreground sweeps from lower-left.
- [ ] Concentrate particles into a halo around mid/far depth, add velocity-driven radial stretch, and introduce restrained indigo/gold surface haze.
- [ ] Move and roll the camera using the pure flight state during `dive`, with zero flight offsets under reduced motion.
- [ ] Run the full test suite and production build.

### Task 4: Visual, responsive, and runtime QA

**Files:**
- Modify only if QA finds a mismatch: `src/cosmic/tunnelMotion.ts`, `src/cosmic/NebulaField.ts`, `src/cosmic/shaders/nebula.ts`, `src/cosmic/CosmicScene.ts`

- [ ] Capture desktop frames at visual progress `5.6`, `6.0`, `6.5`, and `7.0`; verify the approved transition is unchanged and flight lasts the full extra stage.
- [ ] Compare progress `6.5` against the generated ElevenHouse target: opening near `58% / 35%`, compact dark throat, `30–40` readable contour strands, asymmetric particle halo, lower-left foreground sweep.
- [ ] Verify reverse scroll, idle settle, rapid wheel input, and handoff into the next page section.
- [ ] Verify `390×844` composition and reduced-motion behavior.
- [ ] Check browser console for WebGL/runtime errors.
- [ ] Run `npm test -- --run`, `npm run build`, and `git diff --check`.
