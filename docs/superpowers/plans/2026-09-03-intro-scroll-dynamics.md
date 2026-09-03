# Intro Scroll Dynamics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить референсную поступательную динамику и инерцию первым трём заголовкам ElevenHouse, не изменяя продуктовые сцены, переход и тоннель.

**Architecture:** Чистая функция `getIntroScrollMotion` преобразует progress, signed velocity и viewport в безопасный набор параметров сцены. Существующий WebGL frame loop применяет их к камере, горизонту, travel и частицам; типографика получает отдельную чистую depth-функцию, зависящую только от обратимого stage offset. Новых RAF-циклов, React-рендеров на WebGL-кадре и dependencies не появляется.

**Tech Stack:** TypeScript, React 19, Three.js/WebGL shaders, Vitest, Vite.

## Global Constraints

- Scope только для progress `0…3.15`; после `3.15` новое влияние строго равно нулю.
- Сохраняются тексты и порядок «Вся ваша практика» → «В одном пространстве» → «ElevenHouse».
- Не изменяются продуктовые сцены, утверждённый terrain-to-tunnel transition, геометрия тоннеля, tunnel runway и CTA.
- Без новых dependencies и дополнительных post-processing pass.
- При reduced motion новые dolly, parallax, streak, blur, roll и inertia равны нулю.
- Mobile использует `0.6`, tablet `0.8`, desktop `1.0` от desktop-амплитуды.
- Не коммитить изменения без отдельного разрешения пользователя.

---

### Task 1: Чистая модель intro scroll energy

**Files:**
- Create: `src/cosmic/introMotion.ts`
- Create: `src/cosmic/introMotion.test.ts`

**Interfaces:**
- Consumes: `progress`, `velocity`, `viewportWidth`, `reducedMotion`.
- Produces: `getIntroScrollMotion(input): IntroScrollMotionState`.

- [ ] **Step 1: Write failing tests for scope, direction, viewport and reduced motion**

```ts
import { describe, expect, it } from 'vitest'
import { getIntroScrollMotion } from './introMotion'

const input = {
  progress: 1.4,
  velocity: 8,
  viewportWidth: 1440,
  reducedMotion: false,
}

describe('intro scroll motion', () => {
  it('creates a clear signed forward and reverse camera impulse', () => {
    const forward = getIntroScrollMotion(input)
    const reverse = getIntroScrollMotion({ ...input, velocity: -8 })
    expect(forward.cameraZ).toBeLessThan(-4)
    expect(reverse.cameraZ).toBeGreaterThan(4)
    expect(reverse.cameraZ).toBeCloseTo(-forward.cameraZ)
    expect(reverse.horizonY).toBeCloseTo(-forward.horizonY)
  })

  it('fades out before product scenes', () => {
    expect(getIntroScrollMotion({ ...input, progress: 2.8 }).influence).toBeGreaterThan(0)
    expect(getIntroScrollMotion({ ...input, progress: 3.15 })).toMatchObject({
      influence: 0,
      signedEnergy: 0,
      cameraZ: 0,
      horizonY: 0,
      travelBoost: 0,
      pointStretch: 1,
    })
  })

  it('reduces amplitude on tablet and mobile', () => {
    const desktop = getIntroScrollMotion(input)
    const tablet = getIntroScrollMotion({ ...input, viewportWidth: 900 })
    const mobile = getIntroScrollMotion({ ...input, viewportWidth: 390 })
    expect(Math.abs(tablet.cameraZ / desktop.cameraZ)).toBeCloseTo(0.8)
    expect(Math.abs(mobile.cameraZ / desktop.cameraZ)).toBeCloseTo(0.6)
  })

  it('removes the new response for reduced motion', () => {
    expect(getIntroScrollMotion({ ...input, reducedMotion: true })).toMatchObject({
      influence: 0,
      signedEnergy: 0,
      cameraZ: 0,
      cameraY: 0,
      horizonY: 0,
      pitch: 0,
      roll: 0,
      travelBoost: 0,
      streak: 0,
      pointStretch: 1,
    })
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run src/cosmic/introMotion.test.ts`

Expected: FAIL because `./introMotion` does not exist.

- [ ] **Step 3: Implement the minimal pure motion model**

```ts
export type IntroScrollMotionInput = {
  progress: number
  velocity: number
  viewportWidth: number
  reducedMotion: boolean
}

export type IntroScrollMotionState = {
  influence: number
  signedEnergy: number
  cameraZ: number
  cameraY: number
  horizonY: number
  pitch: number
  roll: number
  travelBoost: number
  streak: number
  pointStretch: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start), 0, 1)
  return t * t * (3 - 2 * t)
}

export const getIntroScrollMotion = ({
  progress,
  velocity,
  viewportWidth,
  reducedMotion,
}: IntroScrollMotionInput): IntroScrollMotionState => {
  const zero = {
    influence: 0,
    signedEnergy: 0,
    cameraZ: 0,
    cameraY: 0,
    horizonY: 0,
    pitch: 0,
    roll: 0,
    travelBoost: 0,
    streak: 0,
    pointStretch: 1,
  }
  if (reducedMotion) return zero

  const influence = 1 - smoothstep(2.65, 3.15, progress)
  const viewportScale = viewportWidth < 700 ? 0.6 : viewportWidth < 1100 ? 0.8 : 1
  const signedEnergy = clamp(velocity / 9, -1, 1) * influence * viewportScale
  const magnitude = Math.abs(signedEnergy)

  return {
    influence,
    signedEnergy,
    cameraZ: signedEnergy * -7.2,
    cameraY: signedEnergy * 0.85,
    horizonY: signedEnergy * -0.72,
    pitch: signedEnergy * -0.018,
    roll: signedEnergy * 0.004,
    travelBoost: signedEnergy * 11,
    streak: smoothstep(0.08, 0.78, magnitude),
    pointStretch: 1 + magnitude * 2.15,
  }
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- --run src/cosmic/introMotion.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 5: Review checkpoint without committing**

Run: `git diff -- src/cosmic/introMotion.ts src/cosmic/introMotion.test.ts`

Expected: only the pure intro motion model and its tests.

---

### Task 2: Integrate camera, horizon and terrain particles

**Files:**
- Modify: `src/cosmic/CosmicScene.ts`
- Modify: `src/cosmic/NebulaField.ts`
- Modify: `src/cosmic/shaders/nebula.ts`
- Test: `src/cosmic/introMotion.test.ts`

**Interfaces:**
- Consumes: `getIntroScrollMotion()` from Task 1.
- Produces: `introEnergy` uniform consumed by the terrain point shader.

- [ ] **Step 1: Add a failing inertia-duration test around the existing velocity decay**

```ts
import { decayVelocity } from './motion'

it('keeps a visible impulse for at least 600 ms and then decays cleanly', () => {
  let velocity = 8
  for (let frame = 0; frame < 36; frame += 1) {
    velocity = decayVelocity(velocity, 3.3, 1 / 60)
  }
  const motion = getIntroScrollMotion({ ...input, velocity })
  expect(Math.abs(motion.cameraZ)).toBeGreaterThan(0.5)
  expect(Math.abs(motion.cameraZ)).toBeLessThan(Math.abs(getIntroScrollMotion(input).cameraZ))
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run src/cosmic/introMotion.test.ts`

Expected: FAIL if the motion falls below the visible threshold before 600 ms.

- [ ] **Step 3: Tune the single decay constant or energy mapping minimally**

Keep `scrollVelocity` as the only inertial state. Adjust only the decay or energy normalization until the 600 ms assertion passes; do not create a second animation loop.

- [ ] **Step 4: Apply the state in `CosmicScene.frame`**

```ts
const introMotion = getIntroScrollMotion({
  progress: this.narrativeProgress,
  velocity: this.scrollVelocity,
  viewportWidth: this.width,
  reducedMotion: this.reducedMotion,
})

const speed = getTravelSpeed(this.scrollVelocity, this.reducedMotion)
  + introMotion.travelBoost
  + tunnelIdle.flowSpeed

const targetY = 5.4 + this.pointer.y * 1.72 + idleY
  + introMotion.cameraY
  + tunnelIdle.cameraY
  + tunnelMotion.cameraY * tunnelPresentation * tunnelFraming.cameraScale

const targetZ = 18 - this.scrollVelocity * 0.085
  + introMotion.cameraZ
  + tunnelMotion.cameraZ * tunnelPresentation
  + tunnelIdle.cameraZ
```

Add `introMotion.pitch` to camera X rotation, `introMotion.roll` to camera Z rotation and `introMotion.horizonY` to `world.position.y`. Pass `introMotion.signedEnergy` into `NebulaField.update`. Do not alter tunnel formulas.

- [ ] **Step 5: Add `uIntroEnergy` to the terrain point material and shader**

In `NebulaField`, create shared uniform `{ value: 0 }`, include it only in `pointMaterial.uniforms`, and update it from the new `introEnergy` argument.

In `terrainPointVertexShader` declare:

```glsl
uniform float uIntroEnergy;
```

Replace the pre-tunnel point stretch with:

```glsl
float introStretch = 1.0 + abs(uIntroEnergy) * 2.15;
float tunnelStretch = 1.0 + min(abs(uVelocity), 14.0) * 0.11 + uTunnelDive * 0.34;
vPointStretch = mix(introStretch, tunnelStretch, uTunnelPresentation);
```

The existing radial `vPointAngle` remains the orientation source. Do not add a post-processing blur.

- [ ] **Step 6: Run focused and existing cosmic tests**

Run: `npm test -- --run src/cosmic/introMotion.test.ts src/cosmic/motion.test.ts src/cosmic/tunnelMotion.test.ts`

Expected: all tests PASS.

- [ ] **Step 7: Visual checkpoint**

At `http://127.0.0.1:5188/`, capture the first headline at rest, 70 ms after one signed wheel impulse, 250 ms after it and 800 ms after it. Verify clear dolly/parallax, short radial streak, continued inertia and a crisp settled frame. Repeat once with reverse scroll.

---

### Task 3: Add reversible typography depth

**Files:**
- Modify: `src/cosmic/copyMotion.ts`
- Modify: `src/cosmic/copyMotion.test.ts`
- Modify: `src/components/CosmicHero.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `getIntroGlyphDepth(stageOffset, stagger): IntroGlyphDepth`.
- Consumes: existing `stageOffset` and deterministic `stagger` in `getFragmentStyle`.

- [ ] **Step 1: Write failing tests for forward depth, incoming depth and reversibility**

```ts
import { getIntroGlyphDepth } from './copyMotion'

describe('getIntroGlyphDepth', () => {
  it('pushes an outgoing heading toward the viewer', () => {
    const motion = getIntroGlyphDepth(-0.7, 0.5)
    expect(motion.translateZ).toBeGreaterThan(60)
    expect(motion.scale).toBeGreaterThan(1.1)
    expect(motion.blur).toBeGreaterThan(0)
  })

  it('keeps an incoming heading behind the focal plane', () => {
    const motion = getIntroGlyphDepth(0.7, 0.5)
    expect(motion.translateZ).toBeLessThan(-40)
    expect(motion.scale).toBeLessThan(1)
  })

  it('is perfectly sharp and neutral at the active stage', () => {
    expect(getIntroGlyphDepth(0, 0.5)).toEqual({ translateZ: 0, scale: 1, blur: 0 })
  })
})
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run src/cosmic/copyMotion.test.ts`

Expected: FAIL because `getIntroGlyphDepth` is not exported.

- [ ] **Step 3: Implement the minimal pure helper**

```ts
export type IntroGlyphDepth = {
  translateZ: number
  scale: number
  blur: number
}

export const getIntroGlyphDepth = (stageOffset: number, stagger: number): IntroGlyphDepth => {
  const distance = Math.min(1, Math.abs(stageOffset))
  if (distance === 0) return { translateZ: 0, scale: 1, blur: 0 }
  const outgoing = stageOffset < 0
  const amount = easeOutCubic(distance)
  return {
    translateZ: (outgoing ? 1 : -1) * amount * (92 + stagger * 44),
    scale: outgoing
      ? 1 + amount * (0.18 + stagger * 0.06)
      : 1 - amount * (0.14 + stagger * 0.04),
    blur: amount * (0.35 + stagger * 1.15),
  }
}
```

- [ ] **Step 4: Integrate the helper into `getFragmentStyle`**

Use `getIntroGlyphDepth(stageOffset, stagger)` and append `translateZ(...)` plus its `scale` to the existing deterministic X/Y/rotation transform. Use the larger of existing spread blur and depth blur. Do not duplicate glyph DOM or change copy.

- [ ] **Step 5: Enable perspective without changing layout**

Under existing scoped selectors only:

```css
.hero-copy__stages {
  perspective: 920px;
  transform-style: preserve-3d;
}

.hero-copy__fragment {
  transition: opacity 70ms linear, filter 120ms linear,
    transform 170ms cubic-bezier(0.16, 0.76, 0.2, 1);
}
```

Do not modify `:root`, `html`, `body`, `#root` or global selectors.

- [ ] **Step 6: Run focused tests and build**

Run: `npm test -- --run src/cosmic/copyMotion.test.ts src/cosmic/introMotion.test.ts`

Expected: all tests PASS.

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 7: Visual checkpoint**

Verify each approved heading appears exactly once, exits toward the viewer on forward scroll, reassembles in exact reverse on upward scroll and is fully sharp at rest. Reject any result that resembles glitch, shake or permanent blur.

---

### Task 4: Regression, responsive and runtime QA

**Files:**
- Review only: all modified files and existing uncommitted tunnel work.

**Interfaces:**
- Consumes: complete implementation from Tasks 1–3.
- Produces: verified uncommitted working tree ready for user review.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test -- --run`

Expected: all test files PASS with no warnings or unhandled errors.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 3: Desktop motion QA**

Compare local and reference at rest, impulse, inertia and settle. Verify the local intensity is approximately `50–60%` of the generated storyboard and retains the reference's physical directionality.

- [ ] **Step 4: Mobile and reduced-motion QA**

Verify the mobile amplitude remains readable and centered. Open `?reduced-motion=1` and confirm no dolly, point stretch, depth blur or inertial response is applied.

- [ ] **Step 5: Tunnel isolation QA**

At progress `3.15+`, verify intro motion state is zero. Review the terrain-to-tunnel transition and final tunnel at the existing checkpoints to confirm their composition, scale and motion did not change.

- [ ] **Step 6: Runtime and diff review**

Check browser logs for WebGL/shader errors. Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: no whitespace errors, no new dependencies, no unrelated files and no commit.
