# Natal Dial Shader Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать автономный WebGL-стенд на `http://localhost:5191`, который воспроизводит 12-секундную механику Rolling Dial Shader с рассчитанной натальной картой и реальным screen-space преломлением через rolling glass prism.

**Architecture:** Отдельный Vite entry в `experiments/natal-dial/` использует существующий `three`, но не импортирует ничего из основного `src/`. Первый render pass строит grid и натальную карту в offscreen texture; второй raymarch pass формирует скруглённую стеклянную призму и преломляет первый pass с RGB dispersion; третий pass композитит сцену и добавляет только узкий edge treatment и grain.

**Tech Stack:** TypeScript 5.9, Vite 7, Three.js 0.179, Vitest 3, WebGL2/GLSL ES 3.0, CanvasTexture.

## Global Constraints

- Создавать код только в `experiments/natal-dial/**`; документацию — только в `docs/superpowers/**`.
- Не менять `src/**`, `public/**`, root `package.json`, lock-файл, root configs или зависимости.
- Не менять locked Hero, его renderer, global styles, scroll corridor или animation timing.
- Использовать существующие локальные `three`, Vite и Vitest; ничего не устанавливать.
- Loop должен длиться ровно `12000 ms` и быть непрерывным на границе `t = 1 -> 0`.
- Runtime не делает сетевых запросов.
- Не использовать исходный ролик, код или ассеты Rolling Dial Shader в итоговом стенде.
- Не коммитить, не пушить и не публиковать без отдельного разрешения пользователя. Поэтому commit-шаги из стандартного workflow заменены на локальные review gates.
- Reference spec: `docs/superpowers/specs/2026-09-07-natal-dial-shader-design.md`.

---

## Planned file map

```text
experiments/natal-dial/
├── index.html                     # Изолированная HTML-оболочка и accessibility copy
├── tsconfig.json                  # Type-check только experiment source/tests
├── vite.config.ts                 # root experiment + strict port 5191
└── src/
    ├── main.ts                    # Bootstrap, fallback, lifecycle
    ├── styles.css                 # Только локальная full-viewport square stage
    ├── natalData.ts               # Фиксированный рассчитанный dataset
    ├── natalGeometry.ts           # Полярные координаты и aspect selection
    ├── natalGeometry.test.ts      # Геометрия, dataset, аспекты
    ├── motion.ts                  # Чистая 12-second motion model
    ├── motion.test.ts             # Seam, quaternion, DPR/reduced-motion tests
    ├── environment.ts             # OS/query reduced-motion preference
    ├── environment.test.ts        # Preference override contract
    ├── dialTexture.ts             # Canvas glyph atlas и accessibility summary
    ├── dialTexture.test.ts        # Deterministic labels/atlas contract
    ├── zodiacGlyphs.ts            # 12 custom monoline vector zodiac marks
    ├── shaders/
    │   ├── fullscreen.ts          # Общий fullscreen vertex shader
    │   ├── dial.ts                # Grid, rings, arcs, aspect lines, atlas sampling
    │   ├── glass.ts               # Rounded-box raymarch + refraction/dispersion
    │   └── composite.ts           # Final edge separation + grain
    └── renderer/
        ├── FullscreenPass.ts       # Владение quad/material/render target
        ├── NatalDialScene.ts      # Renderer, passes, resize, RAF, dispose
        └── NatalDialScene.test.ts # Lifecycle/context-loss contract
```

---

### Task 1: Isolated Vite shell

**Files:**
- Create: `experiments/natal-dial/index.html`
- Create: `experiments/natal-dial/tsconfig.json`
- Create: `experiments/natal-dial/vite.config.ts`
- Create: `experiments/natal-dial/src/styles.css`

**Interfaces:**
- Produces: DOM nodes `#natal-dial-stage`, `#natal-dial-canvas`, `#natal-dial-fallback`, `#natal-dial-summary`.
- Produces: standalone dev server fixed to port `5191`.

- [ ] **Step 1: Create the accessible HTML shell**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#030404" />
    <title>ElevenHouse — Natal Dial Shader Lab</title>
  </head>
  <body>
    <main id="natal-dial-stage" aria-labelledby="natal-dial-title">
      <h1 id="natal-dial-title" class="visually-hidden">Демонстрационная натальная карта</h1>
      <canvas id="natal-dial-canvas" aria-label="Вращающаяся натальная карта со стеклянной призмой"></canvas>
      <div id="natal-dial-fallback" hidden aria-hidden="true">
        <div class="fallback-ring">
          <span style="--index:0">♈</span><span style="--index:1">♉</span>
          <span style="--index:2">♊</span><span style="--index:3">♋</span>
          <span style="--index:4">♌</span><span style="--index:5">♍</span>
          <span style="--index:6">♎</span><span style="--index:7">♏</span>
          <span style="--index:8">♐</span><span style="--index:9">♑</span>
          <span style="--index:10">♒</span><span style="--index:11">♓</span>
          <i></i>
        </div>
      </div>
      <p id="natal-dial-summary" class="visually-hidden"></p>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Add experiment-only TypeScript and Vite configs**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "vite.config.ts"]
}
```

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'experiments/natal-dial',
  server: { host: '127.0.0.1', port: 5191, strictPort: true },
  preview: { host: '127.0.0.1', port: 5191, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
})
```

- [ ] **Step 3: Add isolated stage styles**

Use only experiment-owned selectors; do not import any root stylesheet or font:

```css
* { box-sizing: border-box; }
html, body { margin: 0; min-width: 320px; min-height: 100%; background: #030404; }
body { min-height: 100svh; overflow: hidden; }

#natal-dial-stage {
  min-height: 100svh;
  display: grid;
  place-items: center;
  background: #030404;
  color: #f4f1e8;
}

#natal-dial-canvas,
#natal-dial-fallback {
  display: block;
  width: min(100vw, 100svh);
  height: min(100vw, 100svh);
}

#natal-dial-canvas[hidden],
#natal-dial-fallback[hidden] { display: none; }

#natal-dial-stage .visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

#natal-dial-fallback {
  position: relative;
  background-color: #030404;
  background-image:
    linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
  background-size: 5% 5%;
}

#natal-dial-fallback .fallback-ring {
  position: absolute;
  inset: 9%;
  border: 2px solid rgba(244,241,232,.88);
  border-radius: 50%;
  box-shadow: -1px 0 #2bd9ff, 1px 0 #ff5b36, inset 0 0 0 9vmin transparent;
}

#natal-dial-fallback .fallback-ring::before,
#natal-dial-fallback .fallback-ring::after {
  content: '';
  position: absolute;
  border: 1px solid rgba(244,241,232,.72);
  border-radius: 50%;
}

#natal-dial-fallback .fallback-ring::before { inset: 7%; }
#natal-dial-fallback .fallback-ring::after { inset: 15%; }

#natal-dial-fallback span {
  --angle: calc(var(--index) * 30deg);
  position: absolute;
  left: 50%;
  top: 50%;
  font: 500 clamp(14px, 2.2vmin, 28px)/1 Georgia, serif;
  transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-34vmin) rotate(calc(-1 * var(--angle)));
}

#natal-dial-fallback i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 27%;
  aspect-ratio: 1;
  border: clamp(10px, 2vmin, 28px) solid rgba(219,237,236,.62);
  border-radius: 16%;
  background: rgba(0,0,0,.72);
  box-shadow: inset 0 0 22px rgba(255,255,255,.3), 0 0 2px #fff;
  transform: translate(-50%, -50%) rotate(24deg);
}
```

- [ ] **Step 4: Verify the isolated shell**

Run:

```bash
./node_modules/.bin/vite --config experiments/natal-dial/vite.config.ts
```

Expected: server prints `http://127.0.0.1:5191/`; the page has no request to the main `/src/main.tsx`.

- [ ] **Step 5: Local review gate**

Run `git diff -- experiments/natal-dial` and verify no root or `src/**` file changed. Do not commit.

---

### Task 2: Fixed natal dataset and polar geometry

**Files:**
- Create: `experiments/natal-dial/src/natalData.ts`
- Create: `experiments/natal-dial/src/natalGeometry.ts`
- Create: `experiments/natal-dial/src/natalGeometry.test.ts`

**Interfaces:**
- Produces: `NatalBody`, `NatalChart`, `AspectLine`, `PolarPoint`.
- Produces: `NATAL_CHART`, `toPolarPoint()`, `buildHouseCusps()`, `selectMajorAspects()`.

- [ ] **Step 1: Write failing geometry and aspect tests**

```ts
import { describe, expect, it } from 'vitest'
import { NATAL_CHART } from './natalData'
import { buildHouseCusps, selectMajorAspects, toPolarPoint } from './natalGeometry'

describe('natal geometry', () => {
  it('keeps the documented chart inputs and ten bodies', () => {
    expect(NATAL_CHART.utcIso).toBe('2026-09-07T07:00:00.000Z')
    expect(NATAL_CHART.location).toEqual({ latitude: 56.8389, longitude: 60.6057 })
    expect(NATAL_CHART.ascendant).toBeCloseTo(220.333, 3)
    expect(NATAL_CHART.bodies).toHaveLength(10)
  })

  it('maps zero degrees to the top and ninety degrees to the right', () => {
    expect(toPolarPoint(0, 1)).toEqual({ x: 0, y: 1 })
    expect(toPolarPoint(90, 1).x).toBeCloseTo(1, 8)
    expect(toPolarPoint(90, 1).y).toBeCloseTo(0, 8)
  })

  it('builds twelve equal houses from the ascendant', () => {
    const cusps = buildHouseCusps(NATAL_CHART.ascendant)
    expect(cusps).toHaveLength(12)
    expect(cusps[0]).toBeCloseTo(220.333, 3)
    expect(cusps[11]).toBeCloseTo(190.333, 3)
  })

  it('returns at most twelve aspects ordered by orb', () => {
    const aspects = selectMajorAspects(NATAL_CHART.bodies, 12)
    expect(aspects.length).toBeLessThanOrEqual(12)
    expect(aspects.every((aspect, index) => index === 0 || aspects[index - 1].orb <= aspect.orb)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
./node_modules/.bin/vitest run experiments/natal-dial/src/natalGeometry.test.ts
```

Expected: FAIL because `natalData.ts` and `natalGeometry.ts` do not exist.

- [ ] **Step 3: Implement the typed fixed dataset**

Use geocentric tropical longitudes at `07:00 UTC`, interpolated from the daily ephemeris values and speeds. Record the source link in the file comment. Use these exact values:

```ts
export type NatalBody = Readonly<{
  id: 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  glyph: string
  longitude: number
  retrograde?: boolean
}>

export type NatalChart = Readonly<{
  utcIso: string
  localLabel: string
  location: Readonly<{ latitude: number; longitude: number }>
  ascendant: number
  bodies: readonly NatalBody[]
}>

export const NATAL_CHART: NatalChart = {
  utcIso: '2026-09-07T07:00:00.000Z',
  localLabel: '7 сентября 2026, 12:00 · Екатеринбург',
  location: { latitude: 56.8389, longitude: 60.6057 },
  ascendant: 220.333,
  bodies: [
    { id: 'sun', glyph: '☉', longitude: 164.685 },
    { id: 'moon', glyph: '☽', longitude: 114.138 },
    { id: 'mercury', glyph: '☿', longitude: 174.144 },
    { id: 'venus', glyph: '♀', longitude: 207.916 },
    { id: 'mars', glyph: '♂', longitude: 107.354 },
    { id: 'jupiter', glyph: '♃', longitude: 134.996 },
    { id: 'saturn', glyph: '♄', longitude: 13.292, retrograde: true },
    { id: 'uranus', glyph: '♅', longitude: 65.690 },
    { id: 'neptune', glyph: '♆', longitude: 3.497, retrograde: true },
    { id: 'pluto', glyph: '♇', longitude: 303.397, retrograde: true },
  ],
}
```

Source note must cite the [NASA JPL DE440S-based ephemeris page](https://astrolog-app.com/en/ephemeris?date=2026-09-07) and explain that the `07:00 UTC` values are interpolated from its `03:40 UTC` longitudes and daily speeds. Ascendant `220.333°` is computed from Julian date `2461290.7916666665`, local sidereal time `151.9802346°`, obliquity `23.4367°`, and the documented coordinates.

- [ ] **Step 4: Implement geometry and aspect selection**

```ts
import type { NatalBody } from './natalData'

export type PolarPoint = Readonly<{ x: number; y: number }>
export type AspectLine = Readonly<{
  from: NatalBody['id']
  to: NatalBody['id']
  angle: 0 | 60 | 90 | 120 | 180
  orb: number
}>

const normalize = (degrees: number) => ((degrees % 360) + 360) % 360

export function toPolarPoint(longitude: number, radius: number): PolarPoint {
  const radians = longitude * Math.PI / 180
  const clean = (value: number) => Math.abs(value) < 1e-12 ? 0 : value
  return { x: clean(Math.sin(radians) * radius), y: clean(Math.cos(radians) * radius) }
}

export function buildHouseCusps(ascendant: number): readonly number[] {
  return Array.from({ length: 12 }, (_, index) => normalize(ascendant + index * 30))
}

export function selectMajorAspects(bodies: readonly NatalBody[], limit = 12): readonly AspectLine[] {
  const definitions = [
    { angle: 0 as const, orb: 6 }, { angle: 60 as const, orb: 4 },
    { angle: 90 as const, orb: 5 }, { angle: 120 as const, orb: 5 },
    { angle: 180 as const, orb: 6 },
  ]
  const lines: AspectLine[] = []
  for (let from = 0; from < bodies.length; from += 1) {
    for (let to = from + 1; to < bodies.length; to += 1) {
      const raw = Math.abs(bodies[from].longitude - bodies[to].longitude)
      const separation = Math.min(raw, 360 - raw)
      for (const definition of definitions) {
        const orb = Math.abs(separation - definition.angle)
        if (orb <= definition.orb) lines.push({ from: bodies[from].id, to: bodies[to].id, angle: definition.angle, orb })
      }
    }
  }
  return lines.sort((a, b) => a.orb - b.orb).slice(0, limit)
}
```

- [ ] **Step 5: Run the tests and verify they pass**

Expected: four passing tests and no import outside `experiments/natal-dial`.

- [ ] **Step 6: Local review gate**

Inspect the source comment, degrees and aspect ordering. Do not commit.

---

### Task 3: Seamless 12-second motion model

**Files:**
- Create: `experiments/natal-dial/src/motion.ts`
- Create: `experiments/natal-dial/src/motion.test.ts`

**Interfaces:**
- Produces: `MotionFrame`, `getMotionFrame(elapsedMs, reducedMotion)`, `getRenderSize(cssSize, devicePixelRatio, mobile)`.

- [ ] **Step 1: Write failing seam, orbit and DPR tests**

```ts
import { describe, expect, it } from 'vitest'
import { CYCLE_MS, getMotionFrame, getRenderSize } from './motion'

describe('natal dial motion', () => {
  it('closes the twelve-second loop', () => {
    expect(getMotionFrame(0, false)).toEqual(getMotionFrame(CYCLE_MS, false))
  })

  it('puts quarter phases on the four orbit extrema', () => {
    expect(getMotionFrame(0, false).prism.x).toBeLessThan(0)
    expect(getMotionFrame(CYCLE_MS * 0.08, false).prism.y).toBeCloseTo(0.1848, 6)
    expect(getMotionFrame(CYCLE_MS * 0.33, false).prism.x).toBeCloseTo(0.21, 6)
    expect(getMotionFrame(CYCLE_MS * 0.58, false).prism.y).toBeCloseTo(-0.1848, 6)
    expect(getMotionFrame(CYCLE_MS * 0.83, false).prism.x).toBeCloseTo(-0.21, 6)
  })

  it('uses a fixed reduced-motion frame', () => {
    expect(getMotionFrame(100, true)).toEqual(getMotionFrame(10_000, true))
  })

  it('caps desktop and mobile render sizes', () => {
    expect(getRenderSize(720, 3, false)).toBe(1440)
    expect(getRenderSize(720, 3, true)).toBe(1080)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Expected: FAIL because `motion.ts` does not exist.

- [ ] **Step 3: Implement the pure motion model**

Define `CYCLE_MS = 12000`, normalize elapsed time with a modulo that maps exact multiples back to zero, and return only rounded values at `1e-9` so equality at the seam is deterministic. Use:

```ts
export type MotionFrame = Readonly<{
  phase: number
  prism: Readonly<{ x: number; y: number; scale: number; quaternion: readonly [number, number, number, number] }>
  rings: Readonly<{ zodiac: number; houses: number; outerA: number; outerB: number }>
  optics: Readonly<{ dispersion: number; caustic: number }>
}>
```

Use `orbitAngle = τ * (t - 0.08)`, then `x = sin(orbitAngle) * 0.21`, `y = cos(orbitAngle) * 0.21 * 0.88`; scale is `1 + 0.045 * cos(orbitAngle)`. Build the quaternion from Euler angles `x = τt*2 + 0.55`, `y = -τt*3 + 0.22`, `z = τt + 0.08`, normalize it, and canonicalize signs at the loop boundary. Ring rotations are whole-cycle values `-τt`, `τt`, `2τt`, `-3τt`. Dispersion is `0.45 + 0.55 * abs(sin(τt*2 + 0.35))`; caustic is the sum of two narrow smooth pulses centered around phases `0.23` and `0.71`, clamped to `0…1`.

- [ ] **Step 4: Run the tests and verify they pass**

Expected: four passing tests; exact equality at `0` and `12000`.

- [ ] **Step 5: Local review gate**

Sample 97 evenly spaced phases and assert every quaternion length differs from `1` by less than `1e-8`. Do not commit.

---

### Task 4: Glyph atlas, labels and natal dial pass

**Files:**
- Create: `experiments/natal-dial/src/dialTexture.ts`
- Create: `experiments/natal-dial/src/dialTexture.test.ts`
- Create: `experiments/natal-dial/src/shaders/fullscreen.ts`
- Create: `experiments/natal-dial/src/shaders/dial.ts`
- Create: `experiments/natal-dial/src/renderer/FullscreenPass.ts`

**Interfaces:**
- Consumes: `NATAL_CHART`, `buildHouseCusps()`, `selectMajorAspects()`, ring rotations from `MotionFrame`.
- Produces: `createDialAtlas(size)`, `buildAccessibleSummary()`, `DIAL_FRAGMENT_SHADER`, `FullscreenPass`.

- [ ] **Step 1: Write failing deterministic-copy tests**

```ts
import { describe, expect, it } from 'vitest'
import { buildAccessibleSummary, getAtlasLabels } from './dialTexture'

describe('dial texture', () => {
  it('contains all zodiac signs, houses and bodies', () => {
    const labels = getAtlasLabels()
    expect(labels.zodiac).toEqual(['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'])
    expect(labels.houses).toHaveLength(12)
    expect(labels.bodies).toHaveLength(10)
  })

  it('builds a Russian accessible chart summary', () => {
    const summary = buildAccessibleSummary()
    expect(summary).toContain('7 сентября 2026, 12:00')
    expect(summary).toContain('Екатеринбург')
    expect(summary).toContain('Солнце')
    expect(summary).toContain('Плутон')
  })
})
```

- [ ] **Step 2: Implement atlas labels and summary**

Use exact label arrays:

```ts
const ZODIAC = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'] as const
const HOUSES = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'] as const
const BODY_NAMES = { sun:'Солнце', moon:'Луна', mercury:'Меркурий', venus:'Венера', mars:'Марс', jupiter:'Юпитер', saturn:'Сатурн', uranus:'Уран', neptune:'Нептун', pluto:'Плутон' } as const
```

`createDialAtlas(2048)` must use a transparent canvas, `fontKerning = 'normal'`, centered glyphs, solid white foreground, and a single-pixel outline that survives minification. Pack zodiac, houses, planet glyphs and degree strings into deterministic cells and return both `CanvasTexture` and UV rectangles.

- [ ] **Step 3: Implement the fullscreen vertex shader and owner class**

The shared vertex shader passes `uv` and writes the fullscreen quad position unchanged. `FullscreenPass` must own one `Scene`, one orthographic `Camera`, one `PlaneGeometry(2,2)` and one `ShaderMaterial`; expose `render(renderer, target)`, `setSize(width,height)`, and idempotent `dispose()`.

- [ ] **Step 4: Implement `DIAL_FRAGMENT_SHADER`**

The shader must declare exact uniforms `uResolution`, `uTime`, `uZodiacRotation`, `uHouseRotation`, `uOuterRotationA`, `uOuterRotationB`, `uAtlas`, `uAtlasRects`, `uAspectSegments`, and `uReducedMotion`.

Implement these concrete functions:

```glsl
float sdCircle(vec2 p, float r) { return abs(length(p) - r); }
float ringMask(vec2 p, float r, float width) { return 1.0 - smoothstep(width, width + fwidth(length(p)), sdCircle(p, r)); }
float gridLine(float coordinate, float stepSize, float width) {
  float cell = abs(fract(coordinate / stepSize + 0.5) - 0.5) * stepSize;
  return 1.0 - smoothstep(width, width + fwidth(coordinate), cell);
}
```

Use normalized center coordinates, radii `0.315`, `0.382`, `0.425`, `0.468`; major/minor grid steps `0.10/0.025`; outer arcs masked by three angular windows; aspect lines rendered as anti-aliased segments between the planet points. Draw a white core and red/cyan copies shifted by `±0.0015` normal units. Keep grid luminance below `0.11`, aspects below `0.24`, ring cores below `0.92`.

- [ ] **Step 5: Run unit tests**

Expected: all geometry and dial texture tests pass.

- [ ] **Step 6: Browser shader compile gate**

Temporarily render the dial pass alone, load `http://127.0.0.1:5191`, and inspect the console. Expected: no GLSL compile/link errors; the square shows grid, four ring radii, zodiac glyphs, house labels, planet glyphs/degrees and no scrollbars.

- [ ] **Step 7: Local review gate**

Compare one `1440×1440` still against the reference: ring silhouette must occupy `82–86%` of the frame. Do not commit.

---

### Task 5: Raymarched glass prism and real refraction

**Files:**
- Create: `experiments/natal-dial/src/shaders/glass.ts`

**Interfaces:**
- Consumes: dial render target texture, prism position/scale/quaternion, dispersion and caustic from `MotionFrame`.
- Produces: `GLASS_FRAGMENT_SHADER` with alpha-preserving glass output.

- [ ] **Step 1: Define the shader contract in source comments and uniforms**

Declare `uDial`, `uResolution`, `uPrismCenter`, `uPrismScale`, `uPrismQuaternion`, `uDispersion`, `uCaustic`, and `uRaySteps`. Document value ranges beside each uniform; reject any uniform not used by the shader during self-review.

- [ ] **Step 2: Implement rounded-box and quaternion helpers**

```glsl
vec3 rotateByQuaternion(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

float sdRoundBox(vec3 p, vec3 halfSize, float radius) {
  vec3 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - radius;
}
```

Raymarch a shell with half-size `vec3(0.19, 0.19, 0.105)` and radius `0.055`. Use central differences for the normal. The internal core uses half-size `vec3(0.118, 0.118, 0.078)` and radius `0.025`.

- [ ] **Step 3: Implement screen-space refraction**

For a glass hit, derive a screen offset from `normal.xy`, shell thickness and view angle. Sample `uDial` separately:

```glsl
vec2 baseOffset = normal.xy * mix(0.012, 0.052, thickness) / max(0.34, abs(dot(normal, viewDir)));
float spread = 0.0045 * uDispersion;
float r = texture(uDial, vUv + baseOffset + normal.xy * spread).r;
float g = texture(uDial, vUv + baseOffset).g;
float b = texture(uDial, vUv + baseOffset - normal.xy * spread).b;
vec3 refracted = vec3(r, g, b);
```

Mix the refracted background with a blue-grey absorption tint, a dark core mask, Fresnel `pow(1.0 - abs(dot(normal, viewDir)), 4.0)`, a single cool key light and a warm caustic term multiplied by `uCaustic`. Preserve hard black outside the prism and return transparent alpha there.

- [ ] **Step 4: Add bounded raymarch behavior**

Use a compile-time maximum `72` steps, but stop runtime work at `32` on mobile and `44` elsewhere. Before tracing, reject fragments outside the prism's conservative `0.31` local screen-space bounds. Inside the loop break when `abs(distance) < 0.0007` or travel exceeds `3.2`. Do not add dynamic loops beyond this bound.

- [ ] **Step 5: Browser optical gate**

Render dial → glass at phases `0.00`, `0.25`, `0.50`, `0.75`. Expected at every phase: grid and glyphs visibly shift inside the shell; R/G/B samples separate only near bevels; the core remains dark; corners remain rounded and highlights do not clip to a flat white block.

- [ ] **Step 6: Local review gate**

Reject the task if the object reads as a transparent CSS card, a low-poly gemstone, or an opaque cube. Do not commit.

---

### Task 6: Composite pass and scene lifecycle

**Files:**
- Create: `experiments/natal-dial/src/shaders/composite.ts`
- Create: `experiments/natal-dial/src/renderer/NatalDialScene.ts`
- Create: `experiments/natal-dial/src/renderer/NatalDialScene.test.ts`

**Interfaces:**
- Consumes: dial/glass passes and `getMotionFrame()`.
- Produces: class `NatalDialScene` with `start()`, `stop()`, `resize()`, `renderAtPhase()`, `dispose()`.

- [ ] **Step 1: Write failing lifecycle tests with injected adapters**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createLifecycleController } from './NatalDialScene'

describe('NatalDialScene lifecycle', () => {
  it('starts only one frame loop and cancels it on dispose', () => {
    const request = vi.fn(() => 7)
    const cancel = vi.fn()
    const controller = createLifecycleController({ request, cancel })
    controller.start(() => undefined)
    controller.start(() => undefined)
    expect(request).toHaveBeenCalledTimes(1)
    controller.dispose()
    expect(cancel).toHaveBeenCalledWith(7)
  })

  it('is safe to dispose twice', () => {
    const controller = createLifecycleController({ request: () => 1, cancel: () => undefined })
    expect(() => { controller.dispose(); controller.dispose() }).not.toThrow()
  })
})
```

- [ ] **Step 2: Implement `COMPOSITE_FRAGMENT_SHADER`**

Composite dial and glass by glass alpha. Apply a `0.0007` red/cyan offset only to pixels whose local luminance gradient exceeds `0.18`. Add deterministic monochrome hash grain with amplitude `0.012`; no bloom, vignette or radial glow.

- [ ] **Step 3: Implement testable lifecycle controller**

`createLifecycleController()` owns one RAF id, ignores duplicate `start()`, clears the id when stopped, and becomes permanently inert after `dispose()`.

- [ ] **Step 4: Implement `NatalDialScene`**

Constructor receives `HTMLCanvasElement`, `HTMLDivElement fallback`, and `reducedMotion`. Create one `WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })`, three `WebGLRenderTarget`s at actual render size, and the dial/glass/composite passes. `renderAtPhase(phase)` converts phase to elapsed milliseconds and updates every uniform from the same `MotionFrame`.

`resize()` uses `ResizeObserver`, `getRenderSize()` and only reallocates targets when width/height changed. `visibilitychange` stops RAF while hidden and restarts using a stored elapsed offset. `webglcontextlost` calls `preventDefault()`, stops RAF, hides canvas and reveals fallback. `dispose()` disconnects observers/listeners, disposes renderer, passes, atlas texture and targets.

- [ ] **Step 5: Run lifecycle and full unit tests**

Run:

```bash
./node_modules/.bin/vitest run experiments/natal-dial/src
```

Expected: all tests pass; no root tests are modified.

- [ ] **Step 6: Local review gate**

Search for `addEventListener`, `new WebGLRenderTarget`, `new ShaderMaterial`, `requestAnimationFrame`; verify each has a symmetric cleanup/ownership path. Do not commit.

---

### Task 7: Bootstrap, reduced motion and fallback

**Files:**
- Create: `experiments/natal-dial/src/environment.ts`
- Create: `experiments/natal-dial/src/environment.test.ts`
- Create: `experiments/natal-dial/src/main.ts`
- Modify: `experiments/natal-dial/src/styles.css`

**Interfaces:**
- Consumes: `NatalDialScene`, `buildAccessibleSummary()`.
- Produces: working standalone page with automatic loop or static reduced-motion frame.

- [ ] **Step 1: Implement strict DOM bootstrap**

```ts
import './styles.css'
import { buildAccessibleSummary } from './dialTexture'
import { NatalDialScene } from './renderer/NatalDialScene'

const canvas = document.querySelector<HTMLCanvasElement>('#natal-dial-canvas')
const fallback = document.querySelector<HTMLDivElement>('#natal-dial-fallback')
const summary = document.querySelector<HTMLParagraphElement>('#natal-dial-summary')

if (!canvas || !fallback || !summary) throw new Error('Natal dial shell is incomplete')

summary.textContent = buildAccessibleSummary()
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

try {
  const scene = new NatalDialScene(canvas, fallback, reducedMotion)
  scene.start()
  addEventListener('pagehide', () => scene.dispose(), { once: true })
} catch (error) {
  console.error('Natal dial initialization failed', error)
  canvas.hidden = true
  fallback.hidden = false
}
```

- [ ] **Step 2: Complete the CSS fallback**

The fallback must show a static grid, four concentric circles, 12 evenly distributed zodiac glyphs and one bevelled square using only experiment-scoped CSS. It is not required to refract, but must preserve the composition and accessible text when WebGL is unavailable.

- [ ] **Step 3: Verify TypeScript and production build**

Run:

```bash
./node_modules/.bin/tsc -p experiments/natal-dial/tsconfig.json
./node_modules/.bin/vite build --config experiments/natal-dial/vite.config.ts
```

Expected: both commands exit `0`; output exists only under `experiments/natal-dial/dist/`.

- [ ] **Step 4: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce`. Expected: one render at phase `0.28`, no continuous RAF activity, full chart summary available to assistive technology.

- [ ] **Step 5: Local review gate**

Run `git status --short` and verify the only new implementation paths are `experiments/natal-dial/**`. Do not commit.

---

### Task 8: Reference-calibrated visual, responsive and performance QA

**Files:**
- Modify only if QA reveals a defect: `experiments/natal-dial/src/**`
- Do not persist downloaded reference media or generated comparison frames in the repository.

**Interfaces:**
- Consumes: complete standalone scene.
- Produces: verified visual result and clean local server on port `5191`.

- [ ] **Step 1: Start the isolated server**

Run:

```bash
./node_modules/.bin/vite --config experiments/natal-dial/vite.config.ts --host 127.0.0.1
```

Expected: `http://127.0.0.1:5191/` responds with the lab and the main ElevenHouse server is untouched.

- [ ] **Step 2: Capture eight reference phases**

Use `renderAtPhase()` in a development-only browser evaluation hook guarded by `import.meta.env.DEV`; capture square frames at `0`, `.125`, `.25`, `.375`, `.5`, `.625`, `.75`, `.875`. Remove or disable the hook before final build if it exposes mutable global state.

- [ ] **Step 3: Perform frame-by-frame visual review**

For each phase verify:

- dial diameter `82–86%` of the square;
- prism projected size `25–30%` of the square;
- center follows the `21%` radius path;
- external arcs and glyph rings have distinct phases;
- glass displaces both grid and chart glyphs;
- bevels remain broad, clean and rounded;
- dark core is visible in all orientations;
- RGB split stays narrow and tied to bright/refraction edges;
- no fullscreen glow, particle field, purple gradient, floating card UI or copied asset appears.

- [ ] **Step 4: Verify the loop seam**

Capture frames at elapsed `0 ms` and `12000 ms`; pixel difference outside time-dependent grain must be zero. If grain differs, seed it from normalized spatial coordinates plus the wrapped phase so both seam frames match.

- [ ] **Step 5: Responsive QA**

Check `1440×1440`, `1440×900`, `1024×768`, `768×1024`, `390×844`. Expected: canvas remains square, centered and fully visible; no horizontal scroll; glyphs remain legible; mobile DPR/step caps apply.

- [ ] **Step 6: Motion and lifecycle QA**

Verify tab hide/show, resize, reduced motion and a synthetic `webglcontextlost`. Expected: no duplicate RAF, no phase jump on return, render targets resize once per pixel-size change, fallback appears after context loss.

- [ ] **Step 7: Performance QA**

Record at least `10 s` on the desktop reference machine. Acceptance: median frame interval at or below `16.7 ms`, no sustained long-task sequence, no increasing GPU memory across three mount/dispose cycles. If necessary, lower mobile ray steps only; do not remove refraction or replace the prism with CSS.

- [ ] **Step 8: Final verification**

Run:

```bash
./node_modules/.bin/vitest run experiments/natal-dial/src
./node_modules/.bin/tsc -p experiments/natal-dial/tsconfig.json
./node_modules/.bin/vite build --config experiments/natal-dial/vite.config.ts
git diff --check
git status --short
```

Expected: tests, type-check, build and whitespace check pass; status contains the approved spec/plan and `experiments/natal-dial/**`, with no new changes to locked or root files. Keep the verified server running on `127.0.0.1:5191` for user review. Do not commit.

---

## Final implementation review checklist

- Every section of the approved design spec maps to Tasks 1–8.
- All runtime modules are confined to `experiments/natal-dial/`.
- The natal dataset is fixed, typed, source-noted and contains ten bodies.
- The dial is rendered before glass and sampled by glass; refraction is not simulated by opacity.
- Motion derives from one normalized 12-second phase and closes exactly.
- Reduced motion, hidden document, resize, context loss and disposal have explicit behavior.
- Unit, shader compile, visual, responsive, performance and accessibility QA are all represented.
- No dependency installation, commit, push, publish or Hero modification is included.
