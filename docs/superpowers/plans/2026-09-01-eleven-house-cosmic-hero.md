# Eleven House Cosmic Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone desktop React hero whose Three.js scene creates an inertial, scroll-driven flight through procedural stars, nebulae, and rare astrological bodies.

**Architecture:** React owns only the semantic overlay and the lifecycle boundary. A `CosmicScene` class owns Three.js, custom shader systems, post-processing, input sampling, and the animation loop; pure motion helpers are tested independently and used by the render loop without per-frame React state.

**Tech Stack:** React 19, Vite, TypeScript, Three.js, GLSL, Vitest, Playwright/Chromium for visual verification.

## Global Constraints

- Deliver one desktop hero block with a minimum height of `100svh`.
- Use Three.js and custom GLSL shaders for particles and nebular effects.
- Preserve a calm central region for future copy and place visual density toward the perimeter and lower third.
- Support pointer inertia, signed scroll velocity, forward/backward flight, resize, visibility pause, WebGL fallback, and `prefers-reduced-motion`.
- Cap device pixel ratio and adapt particle count to viewport/device capability.
- Do not use external image or video assets for the main visual effect.
- Do not update React state inside the render loop.

---

## File Map

- `package.json` — scripts and runtime/test dependencies.
- `vite.config.ts`, `tsconfig*.json`, `index.html` — Vite and TypeScript entry configuration.
- `src/main.tsx` — React bootstrap.
- `src/App.tsx` — one-page hero composition.
- `src/styles.css` — editorial overlay, fallback, grain, and responsive constraints.
- `src/components/CosmicHero.tsx` — mounts the scene and exposes fallback/reduced-motion semantics.
- `src/cosmic/CosmicScene.ts` — renderer, camera, systems, lifecycle, input, and frame orchestration.
- `src/cosmic/motion.ts` — pure damping, clamping, scroll impulse, and wrap helpers.
- `src/cosmic/motion.test.ts` — deterministic unit tests for motion behavior.
- `src/cosmic/shaders/star.ts` — particle vertex and fragment shaders.
- `src/cosmic/shaders/nebula.ts` — procedural FBM/domain-warp nebula shaders.
- `src/cosmic/StarField.ts` — star buffers, uniforms, recycling, and draw object.
- `src/cosmic/NebulaField.ts` — layered procedural gas planes/volumes.
- `src/cosmic/CelestialBodies.ts` — procedural planets, atmospheric rims, rings, and animation.
- `src/cosmic/PostProcessing.ts` — composer, bloom, output, and lightweight screen effects.
- `src/vite-env.d.ts` — Vite types.

---

### Task 1: Scaffold the app and lock the motion contract

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/cosmic/motion.test.ts`
- Create: `src/cosmic/motion.ts`

**Interfaces:**
- Produces: `damp(current: number, target: number, lambda: number, dt: number): number`
- Produces: `clamp(value: number, min: number, max: number): number`
- Produces: `decayVelocity(value: number, decay: number, dt: number): number`
- Produces: `wrapDepth(value: number, near: number, far: number): number`

- [ ] **Step 1: Create Vite/TypeScript configuration and scripts**

Use `dev`, `build`, `test`, and `preview` scripts. Add `react`, `react-dom`, `three`, `@types/three`, `@vitejs/plugin-react`, `typescript`, `vite`, and `vitest`.

- [ ] **Step 2: Write failing motion tests**

```ts
import { describe, expect, it } from 'vitest'
import { clamp, damp, decayVelocity, wrapDepth } from './motion'

describe('motion helpers', () => {
  it('damps toward a target without overshooting', () => {
    const next = damp(0, 10, 6, 1 / 60)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(10)
  })

  it('decays signed velocity while preserving direction', () => {
    expect(decayVelocity(-8, 4, 1 / 60)).toBeLessThan(0)
    expect(Math.abs(decayVelocity(-8, 4, 1 / 60))).toBeLessThan(8)
  })

  it('clamps and wraps depth deterministically', () => {
    expect(clamp(12, -2, 5)).toBe(5)
    expect(wrapDepth(3, 2, -20)).toBe(-20)
    expect(wrapDepth(-21, 2, -20)).toBe(2)
  })
})
```

- [ ] **Step 3: Run the tests and verify failure**

Run: `npm test -- --run`
Expected: FAIL because `src/cosmic/motion.ts` does not exist or exports are missing.

- [ ] **Step 4: Implement the motion helpers**

```ts
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

export const decayVelocity = (value: number, decay: number, dt: number) =>
  value * Math.exp(-decay * dt)

export const wrapDepth = (value: number, near: number, far: number) => {
  if (value > near) return far
  if (value < far) return near
  return value
}
```

- [ ] **Step 5: Run the motion tests**

Run: `npm test -- --run`
Expected: all motion tests PASS.

---

### Task 2: Build the GPU cosmic systems

**Files:**
- Create: `src/cosmic/shaders/star.ts`
- Create: `src/cosmic/shaders/nebula.ts`
- Create: `src/cosmic/StarField.ts`
- Create: `src/cosmic/NebulaField.ts`
- Create: `src/cosmic/CelestialBodies.ts`

**Interfaces:**
- Produces: `StarField.points: THREE.Points`, `StarField.update(dt, elapsed, travel, streak): void`, `StarField.dispose(): void`
- Produces: `NebulaField.group: THREE.Group`, `NebulaField.update(elapsed, pointerX, pointerY, travel): void`, `NebulaField.dispose(): void`
- Produces: `CelestialBodies.group: THREE.Group`, `CelestialBodies.update(elapsed, travel, pointerX, pointerY): void`, `CelestialBodies.dispose(): void`

- [ ] **Step 1: Implement star shader contracts**

The vertex shader consumes `position`, `aSize`, `aPhase`, `aTemperature`, `uTime`, `uTravel`, `uStreak`, and camera matrices. It offsets wrapped Z depth, computes perspective point size, and passes twinkle/temperature/streak values. The fragment shader renders a soft elliptical core with a faint cross-shaped flare and color-temperature interpolation.

- [ ] **Step 2: Implement deterministic star buffers**

Generate clustered cylindrical distributions with a quiet central tunnel, three size populations, and biased lower-third density. Cap count between 4,500 and 12,000 based on viewport area and DPR. Keep immutable source positions and animate depth in the shader to avoid CPU buffer writes.

- [ ] **Step 3: Implement nebula shaders**

Use simplex/value noise helpers, 4–5 octave FBM, and domain warping. Render three oversized curved/tilted planes with independent seeds, hues, opacity, and movement frequencies. Fade edges and center to avoid visible cards and preserve the hero copy region.

- [ ] **Step 4: Implement procedural celestial bodies**

Create three spheres with custom physical-looking materials built from canvas-free procedural shader noise, Fresnel atmosphere shells, and one restrained ring. Place them outside the central axis at distinct Z depths and animate with slow rotation plus depth-aware parallax.

- [ ] **Step 5: Add disposal paths**

Every geometry and material created by these modules must be disposed explicitly. Groups must expose no event listeners and must be removable as units.

---

### Task 3: Orchestrate camera, scroll flight, and post-processing

**Files:**
- Create: `src/cosmic/PostProcessing.ts`
- Create: `src/cosmic/CosmicScene.ts`

**Interfaces:**
- Consumes: motion helpers and all three cosmic systems.
- Produces: `new CosmicScene(canvas: HTMLCanvasElement, options: { reducedMotion: boolean; onFallback(): void })`
- Produces: `CosmicScene.start(): void`, `CosmicScene.dispose(): void`

- [ ] **Step 1: Configure renderer and post-processing**

Use an alpha-disabled antialiased `WebGLRenderer`, SRGB output, ACES filmic tone mapping, capped DPR, `EffectComposer`, `RenderPass`, and restrained `UnrealBloomPass`. Keep bloom strength velocity-responsive but bounded.

- [ ] **Step 2: Add input sampling**

Register passive `pointermove`, `wheel`, `scroll`, `resize`, and `visibilitychange` listeners. Normalize pointer input, calculate signed wheel/scroll impulses, and never trigger React state from these listeners.

- [ ] **Step 3: Implement the frame model**

Clamp delta time, damp pointer and camera targets, decay signed scroll velocity, integrate travel, update all systems, modulate streak/bloom, and render. Use a quiet idle drift. In reduced-motion mode, ignore impulses and lower all amplitudes.

- [ ] **Step 4: Handle lifecycle and fallback**

Catch WebGL initialization failures and call `onFallback`. Pause RAF while hidden, resize renderer/composer/camera only when dimensions change, and release all resources/listeners in `dispose()`.

---

### Task 4: Compose the editorial hero UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/components/CosmicHero.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: `CosmicScene`.
- Produces: a single accessible full-screen hero and a scroll runway used to demonstrate flight.

- [ ] **Step 1: Mount the scene from React**

Use a canvas ref and a one-time effect. Read `matchMedia('(prefers-reduced-motion: reduce)')`, instantiate the scene, start it, and dispose it on unmount. A fallback class reveals a layered CSS deep-space background if initialization fails.

- [ ] **Step 2: Add restrained semantic overlay**

Include Eleven House wordmark, an `XI` observatory mark, the line “A field for collective futures”, a quiet central title “Beyond the visible”, a short Eleventh House descriptor, and an edge-mounted scroll cue. Avoid buttons and cards.

- [ ] **Step 3: Art-direct the CSS**

Use a refined serif display face with a narrow grotesk fallback stack, generous negative space, hairline borders, uppercase microcopy, custom cursor ring, film grain overlay, edge vignette, and subtle load-in choreography. Keep all interaction layers pointer-safe.

- [ ] **Step 4: Add the scroll runway**

Make the document approximately `240vh` while keeping the hero sticky so scroll changes the scene rather than replacing it. Add a minimal final depth marker near the end for orientation.

---

### Task 5: Verify, capture, and refine

**Files:**
- Modify as needed: `src/cosmic/*.ts`, `src/cosmic/shaders/*.ts`, `src/styles.css`

**Interfaces:**
- Consumes: the complete app.
- Produces: a clean production build and desktop screenshots at idle and after interaction.

- [ ] **Step 1: Run automated checks**

Run: `npm test -- --run && npm run build`
Expected: all tests pass and Vite emits a production bundle without TypeScript errors.

- [ ] **Step 2: Start the app and inspect at 1440×900**

Use the local Vite server and headless Chromium. Wait for network idle, capture a screenshot, inspect the console, move the pointer to multiple quadrants, scroll down and back up, and capture a second screenshot.

- [ ] **Step 3: Validate motion and fallback behavior**

Confirm no visible resets, canvas overflow, console errors, or abrupt camera changes. Emulate reduced motion and confirm scroll streaking is suppressed while ambient movement remains.

- [ ] **Step 4: Perform one visual refinement pass**

Compare the screenshot with the approved direction: calm center, denser perimeter/lower third, restrained palette, clear depth, rare planets, and legible overlay. Tune uniforms and CSS rather than adding unrelated UI.

- [ ] **Step 5: Re-run final checks**

Run: `npm test -- --run && npm run build`
Expected: PASS with no errors.
