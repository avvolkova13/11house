# Natal Dial Physical 3D Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visually inaccurate planar/raymarched prototype with a physical Three.js scene that matches the Rolling Dial reference in composition, ring projection, crystal depth, and motion while retaining calculated natal data.

**Architecture:** Render the grid as a static shader backdrop, build the four visible orbital paths as real independent `TubeGeometry` meshes, place vector marker sprites at natal longitudes, and render a nested transmissive rounded prism plus opaque core in the same perspective scene. Render the scene to one target and apply a narrow chromatic/halation composite pass; remove the screen-space glass raymarch pass.

**Tech Stack:** TypeScript, Three.js 0.179, Vite, Vitest, GLSL, existing `three/examples` modules only.

## Global Constraints

- Modify only `experiments/natal-dial/**` and these approved planning/spec files.
- Do not modify the landing, locked Hero, package files, dependencies, or root configuration.
- Keep the fixed 12-second loop, natal dataset, accessibility summary, reduced-motion frame, lifecycle cleanup, and port `5191`.
- Do not commit, push, publish, or integrate into the landing without separate approval.
- Validate against normalized reference frames at phases `0`, `0.25`, `0.5`, and `0.75`.

---

### Task 1: Reference-calibrated composition and motion

**Files:**
- Modify: `experiments/natal-dial/src/motion.ts`
- Modify: `experiments/natal-dial/src/motion.test.ts`
- Modify: `experiments/natal-dial/src/shaders/grid.ts`
- Modify: `experiments/natal-dial/src/shaders/shaders.test.ts`

**Interfaces:**
- Consumes: `CYCLE_MS`, normalized phase.
- Produces: `MotionFrame` with a broad dial projection, tilted prism orbit, and bounded prism orientation.

- [ ] Add failing tests asserting reference-calibrated orbit coordinates, bounded readable prism quaternions, lower dial yaw, and a denser/brighter grid contract.
- [ ] Run `npm test -- --run experiments/natal-dial/src/motion.test.ts experiments/natal-dial/src/shaders/shaders.test.ts` and verify the new assertions fail.
- [ ] Change only the tested motion and grid constants: dial projected width target `0.64–0.72` of the square, prism vertical orbit amplitude near `0.20`, diagonal orbit offset near `0.075`, grid spacing near `0.026`, and grid intensity near `0.022/0.042`.
- [ ] Re-run the focused tests and verify they pass.

### Task 2: Physical multi-plane orbital rig

**Files:**
- Create: `experiments/natal-dial/src/renderer/physicalDial.ts`
- Create: `experiments/natal-dial/src/renderer/physicalDial.test.ts`
- Modify: `experiments/natal-dial/src/renderer/NatalDialScene.ts`
- Modify: `experiments/natal-dial/src/renderer/NatalDialScene.test.ts`

**Interfaces:**
- Produces: `createPhysicalDialRig(markerTexture: Texture): Group`, `updatePhysicalDialRig(rig: Group, frame: MotionFrame): void`, `disposePhysicalDialRig(rig: Group): void`.
- The rig exposes named children `inner-orbit`, `outer-arc-0..2`, and `natal-markers`.

- [ ] Add failing tests requiring four independently oriented tube layers, transparent chromatic edge materials, natal markers, and complete disposal.
- [ ] Run the focused physical-dial tests and verify failure because the module does not exist.
- [ ] Implement ellipse curves with `CatmullRomCurve3`/`TubeGeometry`; create white center tubes plus cyan/red edge duplicates; create segmented outer arcs rather than full circles.
- [ ] Position marker sprites from the existing natal longitudes and keep their scale consistent with the reference.
- [ ] Replace the four texture-mapped planes in `NatalDialScene` with the physical rig while retaining the grid backdrop.
- [ ] Run focused tests and verify all physical-dial and scene tests pass.

### Task 3: Physical crystal and inner core integration

**Files:**
- Modify: `experiments/natal-dial/src/renderer/physicalPrism.ts`
- Modify: `experiments/natal-dial/src/renderer/physicalPrism.test.ts`
- Modify: `experiments/natal-dial/src/renderer/NatalDialScene.ts`

**Interfaces:**
- Consumes: `createPrismAssembly()`, `createPrismEnvironmentScene()`, `MotionFrame.prism`.
- Produces: one rounded transmissive shell, one larger embedded opaque core, a restrained facet overlay, and a PMREM environment texture.

- [ ] Add failing tests rejecting aperture/frame geometry and requiring a solid `RoundedBoxGeometry` shell, core-to-shell width ratio `0.46–0.58`, and shell transmission `0.82–0.94`.
- [ ] Verify the tests fail against the current aperture-based `ExtrudeGeometry`.
- [ ] Replace the frame geometry with a solid rounded box, tune physical material thickness/IOR/roughness, enlarge and recenter the core, and retain only physically plausible localized facet accents.
- [ ] Integrate the prism assembly into the main scene, assign the PMREM environment, and drive position/quaternion/scale directly from `MotionFrame`.
- [ ] Remove the glass fullscreen pass and its render target from render, resize, and disposal paths.
- [ ] Run focused prism and scene tests and verify they pass.

### Task 4: Narrow optical composite

**Files:**
- Modify: `experiments/natal-dial/src/shaders/composite.ts`
- Modify: `experiments/natal-dial/src/shaders/shaders.test.ts`
- Modify: `experiments/natal-dial/src/renderer/NatalDialScene.ts`

**Interfaces:**
- Consumes: a single rendered physical-scene texture.
- Produces: RGB edge split, restrained halation, fine grain, and preserved black levels.

- [ ] Add failing shader contract tests requiring one scene sampler, rejecting `uGlass`, and enforcing local edge-gated chroma rather than fullscreen bloom.
- [ ] Verify shader tests fail.
- [ ] Simplify the composite shader to one source texture with 2–4 pixel RGB offsets gated by luminance gradients; keep grain below `0.012` and halation below `0.12`.
- [ ] Update the render pipeline to render the physical scene once, then composite once.
- [ ] Run shader and scene tests and verify they pass.

### Task 5: Visual, responsive, lifecycle, and production verification

**Files:**
- Modify only if evidence requires: `experiments/natal-dial/src/renderer/NatalDialScene.ts`, `experiments/natal-dial/src/motion.ts`, physical rig/material files.

- [ ] Capture normalized square frames for phases `0`, `0.25`, `0.5`, `0.75` and assemble a left-reference/right-current comparison.
- [ ] Check ring extent, ellipse ratio, prism center/size, core ratio, chromatic fringe, grid density, and absence of edge-on prism collapse at every phase.
- [ ] Make only single-variable evidence-driven calibration changes, with a failing test before each behavior change.
- [ ] Verify live autoplay changes between two captures and the loop closes at phase `1`.
- [ ] Verify reduced motion, resize, hidden-tab lifecycle, and zero browser console errors.
- [ ] Run `npm test -- --run experiments/natal-dial/src` and require zero failures.
- [ ] Run `npm run build` from `experiments/natal-dial` and require exit code `0`.

