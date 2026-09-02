# Terrain Pointer Trail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduce the mesh3d terrain interaction: a cursor-following volumetric lift with an inertial, quickly fading deformation trail.

**Architecture:** A small CPU-side `PointerTrail` owns twelve terrain-space samples and decay weights. `NebulaField` ray-projects the cursor onto the existing terrain plane, updates the trail, and shares its uniforms with both existing terrain materials. The GLSL height function applies a Mexican-hat displacement and locally reveals tighter contours and brighter particles.

**Tech Stack:** TypeScript, Three.js, GLSL, Vitest, Chrome DevTools visual audit.

## Global Constraints

- Do not change the approved base terrain composition, planet staging, infinite scroll, or camera parallax.
- Keep twelve trail samples and approximately 1.3 seconds of visible decay.
- Disable interaction for reduced motion.
- Add no dependencies.
- Do not commit or push.

---

### Task 1: Deterministic trail state

**Files:**
- Create: `src/cosmic/PointerTrail.ts`
- Create: `src/cosmic/PointerTrail.test.ts`

**Interfaces:**
- Produces: `PointerTrail.tick(dt, elapsed, target)`, `centers`, `weights`, `cursor`, and `cursorEnergy`.

- [ ] Write tests proving weights decay, cursor energy eases, samples are spacing-limited, and the fixed ring buffer stays at twelve entries.
- [ ] Run `npm test -- --run src/cosmic/PointerTrail.test.ts` and verify failure because `PointerTrail` does not exist.
- [ ] Implement only the tested state model with exponential damping and bounded velocity-derived sample strength.
- [ ] Re-run the focused test and the full test suite.

### Task 2: Terrain-space projection and shared uniforms

**Files:**
- Modify: `src/cosmic/NebulaField.ts`
- Modify: `src/cosmic/CosmicScene.ts`

**Interfaces:**
- Consumes: the existing damped NDC pointer and scene camera.
- Produces: terrain-local current cursor and twelve shared sample uniforms.

- [ ] Pass the camera and pointer-active state into `NebulaField`.
- [ ] Ray-project the damped NDC cursor onto the approximate terrain elevation plane.
- [ ] Update the trail once per frame and share identical uniform references between the surface and point shaders.
- [ ] Run tests and TypeScript production build.

### Task 3: Mesh3d-style shader deformation

**Files:**
- Modify: `src/cosmic/shaders/nebula.ts`

**Interfaces:**
- Consumes: `uInteractionCursor`, `uInteractionEnergy`, `uTrailCenters[12]`, and `uTrailWeights[12]`.
- Produces: local radial height displacement, contour emphasis, and point-energy response.

- [ ] Add one active Mexican-hat field and twelve lower-amplitude trail fields to `terrainHeight`.
- [ ] Carry interaction intensity into both surface and point fragments.
- [ ] Reveal narrow bronze/cold contour lines only where the field is active.
- [ ] Run focused tests, full tests, and build.

### Task 4: Live visual verification

**Files:**
- No production files.

- [ ] At 1440×900 wait for the page to load, then capture idle.
- [ ] Move through four terrain quadrants and capture at 120 ms, 800 ms, and after a diagonal sweep.
- [ ] Verify the current lift follows the cursor, old samples decay, no deformation appears above the horizon, and pointer + scroll remain smooth.
- [ ] Verify reverse scroll, reduced motion, canvas bounds, console, and frame timing.
