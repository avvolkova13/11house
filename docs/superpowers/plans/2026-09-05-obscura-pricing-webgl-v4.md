# Obscura Pricing WebGL V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить CSS-coverflow тарифов на WebGL mesh-ленту, которая повторяет нелинейную деформацию, оптику и торможение Obscura при сохранении паузы чтения `4 500 мс`.

**Architecture:** `PricingSection` остаётся владельцем reducer/timers/lifecycle. `PricingWebGLStage` связывает React с изолированным `PricingWebGLScene`; renderer использует пять subdivided card planes и два reflection passes, а вся геометрия вычисляется единой чистой motion-функцией. DOM-кнопки и HTML fallback сохраняют доступность.

**Tech Stack:** React 19, TypeScript, Three.js 0.179, CanvasTexture, GLSL vertex/fragment shaders, Vitest, Vite, headless Chrome QA. Без новых зависимостей.

## Global Constraints

- `PRICING_HOLD_MS = 4500`, `PRICING_TRANSITION_MS = 1350`, `PRICING_CYCLE_MS = 5850`.
- Автоматический порядок: `Pro -> Studio -> Старт -> Pro`.
- Hover не паузит. Keyboard-origin focus паузит только следующий auto-start. Pointer click после settle запускает новый полный hold.
- Reduced motion не запускает auto-cycle и RAF; ручной выбор мгновенный.
- Locked Hero, `App.tsx`, scroll corridor, global selectors, package/config files не менять.
- Новые стили — только под уникальными `.pricing-*` selectors.
- Не копировать бренд, тексты, карточки и assets Obscura.
- Не коммитить, не пушить и не публиковать без отдельного разрешения.

---

## File map

- `src/sections/pricingMotion.ts` — reducer, timing и transition lifecycle.
- `src/sections/pricingWebglMotion.ts` — чистая ribbon-математика и shader uniform samples.
- `src/sections/pricingCardTexture.ts` — отрисовка ElevenHouse card textures.
- `src/sections/pricingShaders.ts` — GLSL source для main, reflection и shadow materials.
- `src/sections/PricingWebGLScene.ts` — Three.js renderer, meshes, textures, resize, render, context loss и dispose.
- `src/sections/PricingWebGLStage.tsx` — React lifecycle wrapper вокруг canvas.
- `src/sections/pricingWebglLifecycle.ts` — чистые условия запуска RAF и fallback mode.
- `src/sections/PricingOrbit.tsx` — accessible overlay controls и static fallback.
- `src/sections/PricingSection.tsx` — timers, input modality, visibility и state flow.
- `src/styles.css` — pricing-only layout, canvas, overlay и fallback; CSS motion V3 удаляется.
- `src/sections/*.test.ts(x)` — timing, sampling, shader, DOM и lifecycle contracts.

---

### Task 1: Обновить timing и input-modality contract

**Files:**
- Modify: `src/sections/pricingMotion.test.ts`
- Modify: `src/sections/pricingMotion.ts`
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/sections/PricingSection.tsx`

**Interfaces:**
- Produces: `PRICING_HOLD_MS`, `PRICING_TRANSITION_MS`, `PRICING_CYCLE_MS`.
- Produces: `PricingInputModality = 'keyboard' | 'pointer'`.
- Preserves: `PricingMotionState`, `beginPricingTransition`, `completePricingTransition`, `getPricingCardRole`.

- [ ] **Step 1: Write the failing timing test**

```ts
it('keeps the approved hold and uses the measured Obscura transition window', () => {
  expect(PRICING_HOLD_MS).toBe(4500)
  expect(PRICING_TRANSITION_MS).toBe(1350)
  expect(PRICING_CYCLE_MS).toBe(5850)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/sections/pricingMotion.test.ts --run`

Expected: FAIL because transition is currently `980` and cycle is `5480`.

- [ ] **Step 3: Implement the timing constants**

```ts
export const PRICING_HOLD_MS = 4500
export const PRICING_TRANSITION_MS = 1350
export const PRICING_CYCLE_MS = PRICING_HOLD_MS + PRICING_TRANSITION_MS
```

- [ ] **Step 4: Add a failing source contract for keyboard-only focus pause**

```ts
it('distinguishes keyboard focus from pointer-origin focus', () => {
  const source = readFileSync(new URL('./PricingSection.tsx', import.meta.url), 'utf8')
  expect(source).toContain("useState<PricingInputModality>('pointer')")
  expect(source).toContain('onPointerDownCapture')
  expect(source).toContain('onKeyDownCapture')
  expect(source).toContain("inputModality === 'keyboard'")
})
```

- [ ] **Step 5: Implement modality tracking without hover state**

```tsx
const [inputModality, setInputModality] = useState<PricingInputModality>('pointer')
const isAutoPaused = !isInView
  || (isFocusInside && inputModality === 'keyboard')
  || !isDocumentVisible
  || prefersReducedMotion

<div
  className="pricing-motion-stage"
  onPointerDownCapture={() => setInputModality('pointer')}
  onKeyDownCapture={(event) => {
    if (event.key === 'Tab' || event.key.startsWith('Arrow')) setInputModality('keyboard')
  }}
  onFocusCapture={() => setIsFocusInside(true)}
  onBlurCapture={handleStageBlur}
>
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/sections/pricingMotion.test.ts src/sections/PricingSection.test.tsx --run`

Expected: all focused tests PASS.

---

### Task 2: Создать единую ribbon motion-математику

**Files:**
- Create: `src/sections/pricingWebglMotion.test.ts`
- Create: `src/sections/pricingWebglMotion.ts`

**Interfaces:**
- Produces: `PricingRibbonSample`.
- Produces: `samplePricingRibbon(progress, direction)`.
- Produces: `samplePricingPlane(slot, sample)`.
- Consumes later: renderer and shader uniforms.

- [ ] **Step 1: Write failing endpoint and phase tests**

```ts
import { describe, expect, it } from 'vitest'
import { samplePricingPlane, samplePricingRibbon } from './pricingWebglMotion'

describe('Obscura pricing ribbon sampler', () => {
  it('is completely still at both settle endpoints', () => {
    const start = samplePricingRibbon(0, 'forward')
    const end = samplePricingRibbon(1, 'forward')
    expect(start).toMatchObject({ travel: 0, velocity: 0, curvature: 0, chroma: 0 })
    expect(end).toMatchObject({ travel: 1, velocity: 0, curvature: 0, chroma: 0 })
  })

  it('reaches maximum nonlinear deformation inside the measured crossover', () => {
    const launch = samplePricingRibbon(0.12, 'forward')
    const crossover = samplePricingRibbon(0.48, 'forward')
    const settle = samplePricingRibbon(0.88, 'forward')
    expect(crossover.curvature).toBeGreaterThan(launch.curvature)
    expect(crossover.curvature).toBeGreaterThan(settle.curvature)
    expect(crossover.chroma).toBeGreaterThan(0.8)
  })

  it('mirrors forward and backward without changing depth or opacity', () => {
    const forward = samplePricingPlane(0, samplePricingRibbon(0.4, 'forward'))
    const backward = samplePricingPlane(0, samplePricingRibbon(0.4, 'backward'))
    expect(backward.x).toBeCloseTo(-forward.x, 5)
    expect(backward.yaw).toBeCloseTo(-forward.yaw, 5)
    expect(backward.z).toBeCloseTo(forward.z, 5)
    expect(backward.opacity).toBeCloseTo(forward.opacity, 5)
  })

  it('maps the outgoing and incoming planes through one continuous ribbon', () => {
    const start = samplePricingRibbon(0, 'forward')
    const end = samplePricingRibbon(1, 'forward')
    expect(samplePricingPlane(0, start).ribbonPosition).toBe(0)
    expect(samplePricingPlane(-1, end).ribbonPosition).toBe(0)
  })
})
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `npm test -- src/sections/pricingWebglMotion.test.ts --run`

Expected: FAIL because `pricingWebglMotion.ts` does not exist.

- [ ] **Step 3: Implement the transition sampler**

```ts
import type { PricingMotionDirection } from './pricingMotion'

export type PricingRibbonSample = {
  progress: number
  travel: number
  velocity: number
  curvature: number
  pinch: number
  chroma: number
  reflectionWave: number
  directionSign: 1 | -1
}

export type PricingPlaneSample = {
  ribbonPosition: number
  x: number
  z: number
  yaw: number
  opacity: number
  scale: number
  fold: number
  wave: number
  pinch: number
  chroma: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smootherstep = (value: number) => {
  const t = clamp01(value)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
const windowed = (progress: number, start: number, peak: number, end: number) => (
  progress <= peak
    ? smootherstep((progress - start) / (peak - start))
    : 1 - smootherstep((progress - peak) / (end - peak))
)

export function samplePricingRibbon(
  progress: number,
  direction: PricingMotionDirection,
): PricingRibbonSample {
  const p = clamp01(progress)
  const directionSign: 1 | -1 = direction === 'forward' ? 1 : -1
  const accelerated = smootherstep(clamp01(p / 0.58)) * 0.72
  const settle = smootherstep(clamp01((p - 0.58) / 0.42)) * 0.28
  const travel = p === 1 ? 1 : accelerated + settle
  const curvature = windowed(p, 0.08, 0.46, 0.82)
  const chroma = windowed(p, 0.16, 0.5, 0.72)

  return {
    progress: p,
    travel,
    velocity: p === 0 || p === 1 ? 0 : windowed(p, 0.02, 0.24, 0.92),
    curvature,
    pinch: windowed(p, 0.14, 0.5, 0.74),
    chroma,
    reflectionWave: windowed(p, 0.04, 0.44, 0.86),
    directionSign,
  }
}
```

- [ ] **Step 4: Implement the shared plane sampler**

```ts
export function samplePricingPlane(slot: number, sample: PricingRibbonSample): PricingPlaneSample {
  const ribbonPosition = slot + sample.travel * sample.directionSign
  const signedPosition = ribbonPosition * sample.directionSign
  const distance = Math.abs(ribbonPosition)
  const x = Math.tanh(ribbonPosition * 0.92) * 5.9
  const z = 1.6 - Math.min(distance, 2.2) * 2.45
  const yaw = -Math.tanh(ribbonPosition * 1.18) * 0.78
  const centerInfluence = Math.exp(-signedPosition * signedPosition * 1.45)

  return {
    ribbonPosition,
    x,
    z,
    yaw,
    opacity: Math.max(0.08, 1 - Math.max(0, distance - 0.18) * 0.3),
    scale: 1 - Math.min(distance, 2) * 0.14,
    fold: sample.curvature * centerInfluence * sample.directionSign,
    wave: sample.curvature * (0.56 + centerInfluence * 0.44) * sample.directionSign,
    pinch: sample.pinch * centerInfluence,
    chroma: sample.chroma * Math.min(1, 0.3 + distance * 0.7),
  }
}
```

- [ ] **Step 5: Run tests and calibrate only numeric constants needed by the assertions**

Run: `npm test -- src/sections/pricingWebglMotion.test.ts --run`

Expected: PASS with no discontinuity at `0` or `1`.

---

### Task 3: Создать ElevenHouse CanvasTexture renderer

**Files:**
- Create: `src/sections/pricingCardTexture.test.ts`
- Create: `src/sections/pricingCardTexture.ts`
- Modify: `src/sections/pricingData.ts` only if a texture-safe presentation field is missing.

**Interfaces:**
- Produces: `PRICING_TEXTURE_WIDTH = 1024`, `PRICING_TEXTURE_HEIGHT = 1356`.
- Produces: `createPricingCardCanvas(plan, options)`.
- Produces: `disposePricingCardCanvas(canvas)` only if observers/listeners are attached.
- Consumes: `PricingPlan`.

- [ ] **Step 1: Write failing layout tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  PRICING_TEXTURE_HEIGHT,
  PRICING_TEXTURE_WIDTH,
  getPricingTextureLayout,
} from './pricingCardTexture'

describe('pricing card texture layout', () => {
  it('uses the approved high-resolution card aspect ratio', () => {
    expect(PRICING_TEXTURE_WIDTH).toBe(1024)
    expect(PRICING_TEXTURE_HEIGHT).toBe(1356)
  })

  it('keeps all readable content inside safe bounds', () => {
    const layout = getPricingTextureLayout()
    expect(layout.safe.left).toBeGreaterThanOrEqual(64)
    expect(layout.safe.right).toBeLessThanOrEqual(960)
    expect(layout.commission.bottom).toBeLessThanOrEqual(1292)
    expect(layout.art.bottom).toBeLessThan(layout.name.top)
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/sections/pricingCardTexture.test.ts --run`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement deterministic layout data**

```ts
export const PRICING_TEXTURE_WIDTH = 1024
export const PRICING_TEXTURE_HEIGHT = 1356

export function getPricingTextureLayout() {
  return {
    safe: { left: 72, right: 952, top: 70, bottom: 1288 },
    art: { left: 0, right: 1024, top: 0, bottom: 650 },
    brand: { left: 72, top: 76 },
    action: { right: 952, top: 76 },
    name: { left: 72, top: 720 },
    price: { left: 72, top: 866 },
    audience: { left: 72, top: 954, width: 670 },
    commission: { left: 72, right: 952, top: 1166, bottom: 1278 },
  } as const
}
```

- [ ] **Step 4: Implement the actual painter**

`createPricingCardCanvas` must:

```ts
export type PricingCardTextureOptions = {
  canvas?: HTMLCanvasElement
}

export async function createPricingCardCanvas(
  plan: PricingPlan,
  options: PricingCardTextureOptions = {},
): Promise<HTMLCanvasElement> {
  await document.fonts.ready
  const canvas = options.canvas ?? document.createElement('canvas')
  canvas.width = PRICING_TEXTURE_WIDTH
  canvas.height = PRICING_TEXTURE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D canvas is unavailable')

  drawPricingBackground(context, plan)
  drawPricingArtwork(context, plan)
  drawPricingTypography(context, plan, getPricingTextureLayout())
  drawPricingBorder(context, plan)
  return canvas
}
```

Implement `drawPricingBackground`, `drawPricingArtwork`, `drawPricingTypography` and `drawPricingBorder` in the same file. Reproduce the existing ElevenHouse card hierarchy and colors; do not import or fetch external imagery.

- [ ] **Step 5: Run focused tests and production typecheck**

Run: `npm test -- src/sections/pricingCardTexture.test.ts --run && npm run build`

Expected: tests PASS and TypeScript compiles.

---

### Task 4: Создать GLSL mesh и optics shaders

**Files:**
- Create: `src/sections/pricingShaders.test.ts`
- Create: `src/sections/pricingShaders.ts`

**Interfaces:**
- Produces: `pricingVertexShader`.
- Produces: `pricingFragmentShader`.
- Produces: `pricingReflectionFragmentShader`.
- Consumes uniforms: `uFold`, `uWave`, `uPinch`, `uChroma`, `uVelocity`, `uDirection`, `uTexture`.

- [ ] **Step 1: Write failing shader vocabulary tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  pricingFragmentShader,
  pricingReflectionFragmentShader,
  pricingVertexShader,
} from './pricingShaders'

describe('pricing mesh shaders', () => {
  it('deforms a subdivided surface with fold, S-wave and pinch', () => {
    expect(pricingVertexShader).toContain('uniform float uFold')
    expect(pricingVertexShader).toContain('uniform float uWave')
    expect(pricingVertexShader).toContain('uniform float uPinch')
    expect(pricingVertexShader).toContain('sin(vUv.y * PI)')
    expect(pricingVertexShader).toContain('position.z')
  })

  it('splits color channels only through the chroma uniform', () => {
    expect(pricingFragmentShader).toContain('uniform float uChroma')
    expect(pricingFragmentShader).toContain('.r')
    expect(pricingFragmentShader).toContain('.g')
    expect(pricingFragmentShader).toContain('.b')
  })

  it('uses a vertically mirrored and masked reflection pass', () => {
    expect(pricingReflectionFragmentShader).toContain('1.0 - vUv.y')
    expect(pricingReflectionFragmentShader).toContain('smoothstep')
  })
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/sections/pricingShaders.test.ts --run`

Expected: FAIL because `pricingShaders.ts` does not exist.

- [ ] **Step 3: Implement the vertex shader**

The shader must use this deformation order:

```glsl
vec3 p = position;
float verticalEnvelope = sin(uv.y * PI);
float sWave = sin((uv.y - 0.5) * PI * 2.0) * uWave;
float pinchEnvelope = exp(-pow((uv.x - 0.5) * 3.2, 2.0));
float localFold = uFold * (0.72 + verticalEnvelope * 0.28);
float angle = (uv.x - 0.5) * localFold * PI + sWave * 0.34;
float radius = mix(8.0, 2.2, clamp(abs(uFold), 0.0, 1.0));
p.x *= 1.0 - pinchEnvelope * uPinch * 0.42;
p.z += (1.0 - cos(angle)) * radius;
p.x = sin(angle) * radius + p.x * (1.0 - abs(uFold) * 0.18);
p.y += sWave * verticalEnvelope * 0.48;
```

Pass `vUv`, curvature and tangent-facing information to the fragment shader.

- [ ] **Step 4: Implement the main fragment shader**

Use three texture samples with a curvature/velocity-dependent offset:

```glsl
float edge = smoothstep(0.56, 0.96, vCurvature) * uChroma * uVelocity;
vec2 offset = vec2(edge * 0.012 * uDirection, 0.0);
float red = texture2D(uTexture, vUv + offset).r;
float green = texture2D(uTexture, vUv).g;
float blue = texture2D(uTexture, vUv - offset).b;
vec4 base = texture2D(uTexture, vUv);
vec3 splitColor = vec3(red, green, blue);
float rim = pow(1.0 - abs(vFacing), 3.0) * edge;
gl_FragColor = vec4(mix(base.rgb, splitColor, edge) + rim * vec3(0.22, 0.62, 0.72), base.a);
```

- [ ] **Step 5: Implement the reflection fragment shader**

Mirror Y, expand chroma by `1.35`, add horizontal/vertical alpha masks and keep blur sampling bounded to five taps.

- [ ] **Step 6: Run shader tests and verify GREEN**

Run: `npm test -- src/sections/pricingShaders.test.ts --run`

Expected: all shader contract tests PASS.

---

### Task 5: Построить isolated Three.js pricing scene

**Files:**
- Create: `src/sections/PricingWebGLScene.test.ts`
- Create: `src/sections/PricingWebGLScene.ts`

**Interfaces:**
- Produces class: `PricingWebGLScene`.
- Constructor: `new PricingWebGLScene(canvas, plans, options)`.
- Methods: `initialize()`, `resize(width, height, dpr)`, `render(state)`, `dispose()`.
- Consumes: `PricingRibbonSample`, shader strings, card canvases.

- [ ] **Step 1: Write failing source and topology contracts**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./PricingWebGLScene.ts', import.meta.url), 'utf8')

describe('PricingWebGLScene contract', () => {
  it('uses five subdivided planes and isolated pricing resources', () => {
    expect(source).toContain('new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 40, 56)')
    expect(source).toContain('const PLANE_SLOTS = [-2, -1, 0, 1, 2] as const')
    expect(source).toContain('new WebGLRenderer')
    expect(source).not.toContain('CosmicScene')
  })

  it('disposes every GPU resource and loses no event listeners', () => {
    expect(source).toContain("removeEventListener('webglcontextlost'")
    expect(source).toContain('.geometry.dispose()')
    expect(source).toContain('.material.dispose()')
    expect(source).toContain('.texture.dispose()')
    expect(source).toContain('this.renderer.dispose()')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/sections/PricingWebGLScene.test.ts --run`

Expected: FAIL because the scene file does not exist.

- [ ] **Step 3: Implement scene construction**

Create:

```ts
export type PricingWebGLSceneOptions = {
  onContextLost: () => void
  maxDpr: number
}

export type PricingWebGLRenderState = {
  activeIndex: number
  targetIndex: number | null
  direction: PricingMotionDirection
  progress: number
}

export class PricingWebGLScene {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly plans: PricingPlan[],
    private readonly options: PricingWebGLSceneOptions,
  ) {}

  async initialize(): Promise<void> {}
  resize(width: number, height: number, dpr: number): void {}
  render(state: PricingWebGLRenderState): void {}
  dispose(): void {}
}
```

Use `PerspectiveCamera`, transparent `WebGLRenderer`, `SRGBColorSpace`, `PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 40, 56)`, five main meshes and matching top/bottom reflection meshes.

- [ ] **Step 4: Map plan textures onto the infinite five-plane ribbon**

For each slot, resolve the texture with modular indexing:

```ts
const planIndex = (activeIndex - slot + plans.length) % plans.length
```

At transition start, keep active plan in slot `0`. At forward settle, the next plan from slot `-1` becomes the new slot `0`; at backward settle, the previous plan from slot `1` becomes the new slot `0`. Do not mutate mesh arrays or reparent meshes during transition.

- [ ] **Step 5: Implement render sampling and uniforms**

```ts
const ribbon = samplePricingRibbon(state.progress, state.direction)
this.planes.forEach((plane) => {
  const sample = samplePricingPlane(plane.slot, ribbon)
  plane.mesh.position.set(sample.x, 0, sample.z)
  plane.mesh.rotation.y = sample.yaw
  plane.mesh.scale.setScalar(sample.scale)
  plane.material.opacity = sample.opacity
  plane.material.uniforms.uFold.value = sample.fold
  plane.material.uniforms.uWave.value = sample.wave
  plane.material.uniforms.uPinch.value = sample.pinch
  plane.material.uniforms.uChroma.value = sample.chroma
  plane.material.uniforms.uVelocity.value = ribbon.velocity
  plane.material.uniforms.uDirection.value = ribbon.directionSign
})
this.renderer.render(this.scene, this.camera)
```

Update reflection meshes from the same plane sample; do not maintain a second motion timeline.

- [ ] **Step 6: Implement resize and DPR caps**

Desktop/tablet: `Math.min(devicePixelRatio, 1.5)`. Mobile `<=560`: `Math.min(devicePixelRatio, 1.25)`. Camera framing must be calculated from container aspect ratio so the active card stays inside a 16px mobile safe area.

- [ ] **Step 7: Implement context-loss and disposal**

Prevent default on `webglcontextlost`, call `onContextLost`, stop future renders, dispose all resources and remove the listener exactly once.

- [ ] **Step 8: Run focused tests and build**

Run: `npm test -- src/sections/PricingWebGLScene.test.ts --run && npm run build`

Expected: tests PASS and build exits `0`.

---

### Task 6: Связать WebGL scene с React lifecycle

**Files:**
- Create: `src/sections/PricingWebGLStage.tsx`
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/sections/PricingOrbit.tsx`

**Interfaces:**
- Produces component: `PricingWebGLStage`.
- Props: `plans`, `motionState`, `inView`, `prefersReducedMotion`, `onFallback`.
- Consumes: `PricingWebGLScene`.

- [ ] **Step 1: Write failing DOM contracts**

```ts
it('renders an aria-hidden WebGL canvas and accessible overlay controls', () => {
  const html = renderToStaticMarkup(<PricingSection />)
  expect(html).toContain('pricing-webgl-stage__canvas')
  expect(html).toContain('<canvas')
  expect(html).toContain('aria-hidden="true"')
  expect(html.match(/pricing-orbit-hit-area/g)).toHaveLength(3)
})

it('keeps a static fallback without legacy reflection nodes', () => {
  const html = renderToStaticMarkup(<PricingSection />)
  expect(html).toContain('pricing-orbit-fallback')
  expect(html).not.toContain('pricing-orbit-reflection__slice')
  expect(html).not.toContain('pricing-orbit__spectral-edge')
})
```

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: FAIL because the canvas stage and hit-area overlay do not exist.

- [ ] **Step 3: Implement `PricingWebGLStage` lifecycle**

Use:

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null)
const sceneRef = useRef<PricingWebGLScene | null>(null)
const frameRef = useRef(0)
const transitionStartedAtRef = useRef<number | null>(null)
```

Initialize once after mount, use `ResizeObserver`, render a single hold frame, and start RAF only when `motionState.phase === 'transitioning'`, `inView`, document visible and motion is not reduced. Cleanup cancels RAF, disconnects the observer and disposes the scene.

- [ ] **Step 4: Drive progress from wall-clock time**

```ts
const elapsed = timestamp - transitionStartedAt
const progress = Math.min(1, elapsed / PRICING_TRANSITION_MS)
scene.render({ activeIndex, targetIndex, direction, progress })
if (progress < 1) frameRef.current = requestAnimationFrame(renderFrame)
```

Never increment progress by a fixed frame step. A throttled tab must resume at the correct wall-clock progress.

- [ ] **Step 5: Add development-only deterministic frame override**

Inside `PricingWebGLStage`, read `pricing-progress` only when `import.meta.env.DEV`. A valid value `0..1` freezes the renderer at that progress, synthesizes `targetIndex` from the next plan for `forward` or the previous plan for `backward`, and disables its local RAF. Read an optional `pricing-direction=backward`; default to `forward`. This enables exact screenshot comparison without changing `App.tsx`.

- [ ] **Step 6: Refactor `PricingOrbit`**

Replace card surface/reflection/spectral DOM with:

```tsx
const [fallback, setFallback] = useState(false)

<div className="pricing-orbit">
  <PricingWebGLStage
    plans={plans}
    motionState={motionState}
    inView={inView}
    prefersReducedMotion={prefersReducedMotion}
    onFallback={() => setFallback(true)}
  />
  <div className="pricing-orbit__controls" aria-label="Выбор тарифа">
    {plans.map((plan) => (
      <button
        className="pricing-orbit-hit-area"
        data-card-role={getPricingCardRole(plan.key, motionState, planKeys)}
        aria-label={`Подробнее о тарифе ${plan.name}`}
        aria-pressed={motionState.activeKey === plan.key}
        disabled={motionState.phase === 'transitioning'}
        onClick={() => onSelect(plan.key)}
        key={plan.key}
      />
    ))}
  </div>
  <div className="pricing-orbit-fallback" data-visible={fallback ? 'true' : 'false'} aria-hidden={!fallback}>
    {plans.map((plan) => (
      <article
        className={`pricing-orbit-fallback__card pricing-orbit-fallback__card--${plan.key}`}
        data-card-role={getPricingCardRole(plan.key, motionState, planKeys)}
        key={plan.key}
      >
        <span>ElevenHouse</span>
        <h3>{plan.name}</h3>
        <strong>{plan.price}</strong>
        <small>{plan.period}</small>
        <p>{plan.audience}</p>
        <footer><span>Комиссия</span><strong>{plan.commission}</strong></footer>
      </article>
    ))}
  </div>
</div>
```

Add `prefersReducedMotion: boolean` to `PricingOrbitProps` and pass the existing value from `PricingSection`.

- [ ] **Step 7: Run focused component tests and build**

Run: `npm test -- src/sections/PricingSection.test.tsx --run && npm run build`

Expected: tests PASS and build exits `0`.

---

### Task 7: Заменить CSS V3 на canvas, controls и fallback layout

**Files:**
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/styles.css` only inside pricing selectors and pricing media queries.

**Interfaces:**
- Produces: `.pricing-webgl-stage`, `.pricing-webgl-stage__canvas`, `.pricing-orbit__controls`, `.pricing-orbit-hit-area`, `.pricing-orbit-fallback`.
- Removes: every `@keyframes pricing-surface-*`, `pricing-reflection-*`, `pricing-spectral-*`, `pricing-scene-exposure`.

- [ ] **Step 1: Add failing CSS-removal and new-layout tests**

```ts
it('uses WebGL layout and contains no legacy CSS coverflow choreography', () => {
  expect(css).toContain('.pricing-webgl-stage__canvas')
  expect(css).toContain('.pricing-orbit-hit-area')
  expect(css).toContain('.pricing-orbit-fallback')
  expect(css).not.toContain('@keyframes pricing-surface-enter-forward')
  expect(css).not.toContain('@keyframes pricing-reflection-enter-forward')
  expect(css).not.toContain('@keyframes pricing-spectral-left')
  expect(css).not.toContain('rotateY(88deg)')
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: FAIL while V3 CSS remains.

- [ ] **Step 3: Remove legacy pricing motion CSS**

Delete only the V3 animation rules and DOM selectors replaced by canvas. Preserve pricing section heading, switcher, details and typography rules.

- [ ] **Step 4: Add canvas and studio layout**

```css
.pricing-orbit {
  position: relative;
  min-height: clamp(620px, 62vw, 790px);
  overflow: hidden;
  contain: layout paint;
  background: linear-gradient(180deg, #fbfaf6 0%, #fff 48%, #f4f1e9 100%);
}

.pricing-webgl-stage,
.pricing-webgl-stage__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.pricing-webgl-stage__canvas { display: block; }
.pricing-orbit__controls { position: absolute; inset: 0; z-index: 3; }
.pricing-orbit-hit-area { position: absolute; border: 0; background: transparent; }
.pricing-orbit-hit-area:focus-visible { outline: 2px solid #9f7711; outline-offset: 6px; }
```

- [ ] **Step 5: Implement desktop/tablet/mobile hit-area and fallback positions**

At hold, central hit-area must match the frontal card. Previous/next hit-areas match side cards. On `max-width: 560px`, the active card stays within `16px` safe sides and the orbit remains `overflow: hidden`.

- [ ] **Step 6: Implement reduced-motion styling**

Hide canvas only if the stage reports fallback. Reduced motion may keep a single static WebGL render; it must never animate. Static HTML fallback remains available if renderer initialization fails.

- [ ] **Step 7: Run component tests and diff boundary check**

Run: `npm test -- src/sections/PricingSection.test.tsx --run && git diff --check`

Expected: PASS and no whitespace errors.

---

### Task 8: Довести interaction, fallback и cleanup lifecycle

**Files:**
- Create: `src/sections/pricingWebglLifecycle.test.ts`
- Create: `src/sections/pricingWebglLifecycle.ts`
- Modify: `src/sections/PricingWebGLStage.tsx`
- Modify: `src/sections/PricingSection.tsx`
- Modify: `src/sections/PricingSection.test.tsx`

**Interfaces:**
- Produces pure helper: `shouldRunPricingFrame(input)`.
- Produces pure helper: `getPricingRenderMode(input)`.
- Ensures WebGL failure does not break pricing controls.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
describe('pricing WebGL lifecycle', () => {
  it('runs frames only for a visible active transition', () => {
    expect(shouldRunPricingFrame({ phase: 'transitioning', inView: true, documentVisible: true, reducedMotion: false, fallback: false })).toBe(true)
    expect(shouldRunPricingFrame({ phase: 'holding', inView: true, documentVisible: true, reducedMotion: false, fallback: false })).toBe(false)
    expect(shouldRunPricingFrame({ phase: 'transitioning', inView: false, documentVisible: true, reducedMotion: false, fallback: false })).toBe(false)
    expect(shouldRunPricingFrame({ phase: 'transitioning', inView: true, documentVisible: false, reducedMotion: false, fallback: false })).toBe(false)
    expect(shouldRunPricingFrame({ phase: 'transitioning', inView: true, documentVisible: true, reducedMotion: true, fallback: false })).toBe(false)
  })

  it('uses HTML fallback after context loss', () => {
    expect(getPricingRenderMode({ initialized: true, contextLost: false })).toBe('webgl')
    expect(getPricingRenderMode({ initialized: false, contextLost: false })).toBe('fallback')
    expect(getPricingRenderMode({ initialized: true, contextLost: true })).toBe('fallback')
  })
})
```

Import `shouldRunPricingFrame` and `getPricingRenderMode` from `./pricingWebglLifecycle`.

- [ ] **Step 2: Run lifecycle tests and verify RED**

Run: `npm test -- src/sections/pricingWebglLifecycle.test.ts --run`

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement pure lifecycle helpers and use them in the stage**

```ts
import type { PricingMotionPhase } from './pricingMotion'

export type PricingFrameGate = {
  phase: PricingMotionPhase
  inView: boolean
  documentVisible: boolean
  reducedMotion: boolean
  fallback: boolean
}

export function shouldRunPricingFrame(input: PricingFrameGate): boolean {
  return input.phase === 'transitioning'
    && input.inView
    && input.documentVisible
    && !input.reducedMotion
    && !input.fallback
}

export function getPricingRenderMode(input: {
  initialized: boolean
  contextLost: boolean
}): 'webgl' | 'fallback' {
  return input.initialized && !input.contextLost ? 'webgl' : 'fallback'
}
```

Import these helpers into `PricingWebGLStage.tsx`. Do not read Hero state.

- [ ] **Step 4: Handle initialization failure and context loss**

Catch texture/renderer initialization errors, set fallback mode, cancel RAF and keep overlay plus tabs enabled. Context loss must not throw into React.

- [ ] **Step 5: Verify pointer/manual cycle behavior in source contracts**

Require that pointer input clears keyboard pause and that the hold timer depends on `motionState.sequence`, so every successful manual settle starts a fresh `4500ms` interval.

- [ ] **Step 6: Run lifecycle, component and motion tests**

Run: `npm test -- src/sections/pricingWebglLifecycle.test.ts src/sections/PricingSection.test.tsx src/sections/pricingMotion.test.ts --run`

Expected: all focused tests PASS.

---

### Task 9: Покадровая калибровка по оригиналу

**Files:**
- Modify: `src/sections/pricingWebglMotion.ts`
- Modify: `src/sections/pricingShaders.ts`
- Modify: `src/sections/PricingWebGLScene.ts`
- Modify: `src/styles.css` pricing selectors only.
- Reference: `/private/tmp/obscura-reference.mp4` while available; otherwise reacquire from the approved Recent page.

**Interfaces:**
- Consumes: deterministic `?pricing-progress=0..1` override.
- Produces: calibrated frame set for three viewports and both directions.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev -- --host 127.0.0.1 --port 5185`

Expected: Vite serves `http://127.0.0.1:5185/`.

- [ ] **Step 2: Capture the eight normalized forward frames**

Capture `.pricing-orbit` at `pricing-progress=0`, `.12`, `.24`, `.40`, `.55`, `.72`, `.88`, `1` on `1440×900`.

- [ ] **Step 3: Compare against the measured reference sequence**

Check each frame for:

- position and scale of five planes;
- direction and amplitude of S-wave;
- leading/trailing edge delay;
- central negative space in crossover;
- upper and lower reflection shape;
- chromatic edge order and width;
- settle curvature and absence of scale overshoot.

- [ ] **Step 4: Adjust one parameter family at a time**

Calibration order:

1. ribbon X/Z/yaw path;
2. fold/wave/pinch vertex amplitudes;
3. transition easing and settle;
4. reflection geometry;
5. chroma/rim/ghost optics;
6. background and shadow.

After each family, recapture the same eight frames. Do not bundle unrelated parameter changes.

- [ ] **Step 5: Repeat at tablet and mobile**

Capture the same frames at `1024×768` and `390×844`. Verify `.pricing-section.scrollWidth === .pricing-section.clientWidth`.

- [ ] **Step 6: Verify backward direction**

Manually select the previous plan and confirm every frame is a horizontal mirror of forward geometry while plan content remains unmirrored.

- [ ] **Step 7: Record final calibration constants in tests**

Update numeric range assertions in `pricingWebglMotion.test.ts` only after visual calibration. Tests must describe meaningful motion landmarks rather than copying every float.

---

### Task 10: Финальный functional, responsive, performance и accessibility QA

**Files:**
- Verify all pricing files.
- Modify only pricing files if QA reveals defects.

**Interfaces:**
- Produces: verified V4 implementation with no locked-area changes.

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --run`

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Build the production bundle**

Run: `npm run build`

Expected: TypeScript and Vite exit `0`.

- [ ] **Step 3: Run interaction QA**

Verify:

- auto transition begins after `4500ms`;
- transition settles after `1350ms`;
- hover does not pause;
- pointer selection starts a fresh hold after settle;
- Tab focus pauses the next auto-start;
- hidden document and out-of-view section stop RAF/timers;
- repeated active selection and selection during transition do nothing;
- reduced motion changes selection instantly and does not run RAF.

- [ ] **Step 4: Run context-loss and fallback QA**

Dispatch a development-only `webglcontextlost` event on the pricing canvas. Confirm canvas stops, fallback becomes visible, controls remain accessible and no console error escapes.

- [ ] **Step 5: Run responsive QA**

At `1440×900`, `1024×768`, `390×844` verify active-card safe bounds, controlled side fragments, reflection placement, readable tabs/details and zero pricing-origin horizontal overflow.

- [ ] **Step 6: Run performance QA**

Measure only the `1350ms` transition. Confirm idle RAF count is zero, DPR caps apply, no renderer/resource growth appears after at least ten cycles, and pricing frames remain within the `4ms` target on the reference machine when DevTools overhead is excluded.

- [ ] **Step 7: Run accessibility QA**

Verify tab order, visible focus, `aria-pressed`, live selected-plan status, canvas `aria-hidden`, static fallback, contrast and reduced-motion behavior.

- [ ] **Step 8: Review the diff boundary**

Run:

```bash
git diff --name-only
git diff --check
git diff -- src/components/CosmicHero.tsx src/cosmic src/App.tsx src/main.tsx index.html package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json
```

Expected: no locked Hero, global architecture, dependency or config diff caused by V4. Existing unrelated user changes remain untouched.

- [ ] **Step 9: Stop without commit, push or publish**

Report changed files, tests, build, visual QA frames, performance measurements and any pre-existing out-of-scope issues. Do not create a commit unless the user separately authorizes it.
