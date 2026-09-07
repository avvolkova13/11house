# Natal Dial 3D Rig Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить фиксированную 2D-проекцию колец на двухслойный пространственный dial-rig, повторяющий переходы референса от фронтального круга к узкому наклонному эллипсу при неподвижной grid.

**Architecture:** Grid рендерится отдельным статичным shader-plane. Внутреннее кольцо с метками и внешние дуги рендерятся в два прозрачных render target и накладываются на две близкие `PlaneGeometry` внутри общего Three.js `Group`; общий rig и внешний слой получают циклические yaw/pitch/roll из `motion.ts`.

**Tech Stack:** TypeScript, Three.js, GLSL, Vite, Vitest.

## Global Constraints

- Изменения разрешены только в `experiments/natal-dial/**` и этом плане/спецификации.
- `src/**`, locked Hero, package/lock files и основной Vite config не изменяются.
- Новые dependencies не устанавливаются.
- Цикл длится ровно `12000 ms` и пиксельно стабильно замыкается.
- Grid остаётся неподвижной; пространственное движение применяется только к dial layers.
- Реальные долготы натальной карты и accessibility summary сохраняются.
- Без прямого разрешения пользователя не выполнять `git commit`, push или публикацию.

---

### Task 1: Пространственная motion-модель dial-rig

**Files:**
- Modify: `experiments/natal-dial/src/motion.test.ts`
- Modify: `experiments/natal-dial/src/motion.ts`

**Interfaces:**
- Consumes: `CYCLE_MS`, нормализованную фазу `phase`.
- Produces: `MotionFrame['dialRig']` с `pitch`, `yaw`, `roll`, `outerYawOffset`, `outerRollOffset`.

- [ ] **Step 1: Write the failing motion tests**

Добавить проверки умеренного постоянного наклона, прецессии и замыкания:

```ts
it('keeps a moderate tilt while the dial plane precesses in space', () => {
  const samples = Array.from({ length: 97 }, (_, index) =>
    getMotionFrame(CYCLE_MS * index / 96, false).dialRig,
  )
  const yaw = samples.map((sample) => sample.yaw)
  const pitch = samples.map((sample) => sample.pitch)

  expect(Math.min(...yaw)).toBeGreaterThanOrEqual(0.45)
  expect(Math.max(...yaw)).toBeLessThanOrEqual(0.66)
  expect(Math.max(...yaw) - Math.min(...yaw)).toBeGreaterThan(0.1)
  expect(Math.min(...pitch)).toBeLessThan(-0.1)
  expect(Math.max(...pitch)).toBeGreaterThan(0.1)
})

it('keeps the outer spatial layer close to the main dial plane', () => {
  for (let index = 0; index <= 48; index += 1) {
    const rig = getMotionFrame(CYCLE_MS * index / 48, false).dialRig
    expect(Math.abs(rig.outerYawOffset)).toBeLessThanOrEqual(0.09)
    expect(Math.abs(rig.outerRollOffset)).toBeLessThanOrEqual(0.055)
  }
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
./node_modules/.bin/vitest run experiments/natal-dial/src/motion.test.ts
```

Expected: FAIL because `dialRig` does not exist.

- [ ] **Step 3: Add the minimal spatial motion values**

Extend `MotionFrame`:

```ts
dialRig: Readonly<{
  pitch: number
  yaw: number
  roll: number
  outerYawOffset: number
  outerRollOffset: number
}>
```

Return values derived only from integer-frequency periodic functions:

```ts
dialRig: {
  pitch: round(0.12 * Math.sin(TAU * phase)),
  yaw: round(0.56 + 0.08 * Math.sin(TAU * phase * 2 + 0.3)),
  roll: round(-0.075 + 0.085 * Math.sin(TAU * phase)),
  outerYawOffset: round(0.075 * Math.sin(TAU * phase * 4 + 0.4)),
  outerRollOffset: round(0.05 * Math.sin(TAU * phase * 3 - 0.25)),
},
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the same Vitest command. Expected: all `motion.test.ts` tests pass.

---

### Task 2: Разделение статичной grid и двух прозрачных dial layers

**Files:**
- Create: `experiments/natal-dial/src/shaders/grid.ts`
- Modify: `experiments/natal-dial/src/shaders/dial.ts`
- Modify: `experiments/natal-dial/src/shaders/shaders.test.ts`

**Interfaces:**
- Consumes: `vUv`, `uAtlas`, существующие ring rotation uniforms.
- Produces: `GRID_FRAGMENT_SHADER`; `DIAL_FRAGMENT_SHADER` с uniform `uLayer`, где `0` — inner ring/markers, `1` — outer arcs.

- [ ] **Step 1: Write failing shader contract tests**

```ts
import { GRID_FRAGMENT_SHADER } from './grid'

it('keeps the grid in a dedicated static shader', () => {
  expect(GRID_FRAGMENT_SHADER).toContain('fract')
  expect(GRID_FRAGMENT_SHADER).not.toContain('uZodiacRotation')
})

it('renders transparent inner and outer dial layers without fixed X squeeze', () => {
  expect(DIAL_FRAGMENT_SHADER).toContain('uniform float uLayer')
  expect(DIAL_FRAGMENT_SHADER).toContain('gl_FragColor = vec4(color, alpha)')
  expect(DIAL_FRAGMENT_SHADER).not.toContain('point.x /= 0.63')
  expect(DIAL_FRAGMENT_SHADER).not.toContain('point.x /= 0.74')
})
```

- [ ] **Step 2: Run the shader test and verify RED**

```bash
./node_modules/.bin/vitest run experiments/natal-dial/src/shaders/shaders.test.ts
```

Expected: FAIL because `grid.ts`, `uLayer` and transparent output are absent.

- [ ] **Step 3: Implement the static grid shader**

`GRID_FRAGMENT_SHADER` computes the existing 0.042 minor grid and 0.20 major grid directly from `vUv`, then outputs opaque black:

```glsl
vec2 p = vUv - 0.5;
float minorX = gridLine(p.x, 0.042, 0.00055, 0.00145);
float minorY = gridLine(p.y, 0.042, 0.00055, 0.00145);
float majorX = gridLine(p.x, 0.20, 0.0008, 0.0018);
float majorY = gridLine(p.y, 0.20, 0.0008, 0.0018);
float grid = max(max(minorX, minorY) * 0.0065, max(majorX, majorY) * 0.014);
gl_FragColor = vec4(vec3(0.0045, 0.0055, 0.0058) + vec3(grid), 1.0);
```

- [ ] **Step 4: Convert dial shader to circular transparent layers**

Remove the grid block and fixed projection division. `projectDialSpace()` may keep only the small in-plane rotation. Build color/alpha per layer:

```glsl
float innerMask = clamp(innerGeometry + max(atlas.r, max(atlas.g, atlas.b)), 0.0, 1.0);
float outerMask = outerArcs(p, uOuterRotationA, uOuterRotationB);
float selector = step(0.5, uLayer);
vec3 color = mix(innerColor, outerColor, selector);
float alpha = mix(innerMask, outerMask, selector);
gl_FragColor = vec4(color, alpha);
```

- [ ] **Step 5: Run shader tests and verify GREEN**

Run the focused Vitest command. Expected: all shader tests pass.

---

### Task 3: Three.js двухслойный dial-rig

**Files:**
- Modify: `experiments/natal-dial/src/renderer/NatalDialScene.test.ts`
- Modify: `experiments/natal-dial/src/renderer/NatalDialScene.ts`

**Interfaces:**
- Consumes: `GRID_FRAGMENT_SHADER`, two instances of `DIAL_FRAGMENT_SHADER`, `MotionFrame['dialRig']`.
- Produces: static `grid-backdrop`, `dial-rig`, `inner-dial-plane`, `outer-dial-plane` scene objects.

- [ ] **Step 1: Add a failing scene-graph helper test**

Extract and test a pure helper exported from `NatalDialScene.ts`:

```ts
it('creates a two-layer spatial dial rig', () => {
  const rig = createDialRig(innerTexture, outerTexture)
  expect(rig.name).toBe('dial-rig')
  expect(rig.getObjectByName('inner-dial-plane')).toBeDefined()
  expect(rig.getObjectByName('outer-dial-plane')).toBeDefined()
  expect(rig.getObjectByName('outer-dial-plane')!.position.z).toBeLessThan(
    rig.getObjectByName('inner-dial-plane')!.position.z,
  )
})
```

Use two `Texture` instances from Three.js as real test inputs.

- [ ] **Step 2: Run the renderer test and verify RED**

```bash
./node_modules/.bin/vitest run experiments/natal-dial/src/renderer/NatalDialScene.test.ts
```

Expected: FAIL because `createDialRig` does not exist.

- [ ] **Step 3: Create the rig helper**

```ts
export function createDialRig(innerMap: Texture, outerMap: Texture): Group {
  const rig = new Group()
  rig.name = 'dial-rig'
  rig.position.z = -1.0
  const geometry = new PlaneGeometry(3.04, 3.04)
  const inner = new Mesh(geometry, new MeshBasicMaterial({ map: innerMap, alphaTest: 0.065, depthWrite: true, toneMapped: false }))
  const outer = new Mesh(geometry.clone(), new MeshBasicMaterial({ map: outerMap, alphaTest: 0.065, depthWrite: true, toneMapped: false }))
  inner.name = 'inner-dial-plane'
  outer.name = 'outer-dial-plane'
  inner.position.z = 0
  outer.position.z = -0.035
  rig.add(inner, outer)
  return rig
}
```

`alphaTest` вместо transparent-pass нужен намеренно: кольца остаются вырезанными по альфе и корректно собираются вместе с grid в `sceneTarget`, который затем семплирует raymarched glass-pass.

- [ ] **Step 4: Replace the combined backdrop pipeline**

- Create `gridTarget` and one `FullscreenPass` using `GRID_FRAGMENT_SHADER`; map it to the existing opaque `grid-backdrop` plane and render it after resize.
- Create `innerDialTarget` and `outerDialTarget`.
- Create two `FullscreenPass` instances of `DIAL_FRAGMENT_SHADER`; assign `uLayer = 0` and `uLayer = 1`.
- Render both targets each frame before rendering the scene.
- Add the returned `dialRig` to the scene instead of mapping the combined dial to the background plane.
- Dispose both targets, passes, geometries and materials symmetrically.

- [ ] **Step 5: Apply spatial motion each frame**

```ts
this.dialRig.rotation.set(frame.dialRig.pitch, frame.dialRig.yaw, frame.dialRig.roll)
this.outerDialPlane.rotation.y = frame.dialRig.outerYawOffset
this.outerDialPlane.rotation.z = frame.dialRig.outerRollOffset
```

The prism orbit/quaternion remains independent and feeds the raymarched glass pass after the 3D scene target.

- [ ] **Step 6: Run renderer, motion and shader tests**

```bash
./node_modules/.bin/vitest run \
  experiments/natal-dial/src/motion.test.ts \
  experiments/natal-dial/src/shaders/shaders.test.ts \
  experiments/natal-dial/src/renderer/NatalDialScene.test.ts
```

Expected: all focused tests pass.

---

### Task 4: Visual phase matching and regression verification

**Files:**
- Modify only if evidence requires it: `experiments/natal-dial/src/motion.ts`
- Modify only if evidence requires it: `experiments/natal-dial/src/renderer/NatalDialScene.ts`

**Interfaces:**
- Consumes: deterministic `?phase=<0..1>` preview hook already exposed by the stand.
- Produces: twelve reference-comparison screenshots and a verified clean build.

- [ ] **Step 1: Capture twelve deterministic phases**

Capture `phase = 0, 1/12, 2/12, …, 11/12` at `1280×720`. Compare these invariants with the reference contact sheet:

- static grid lines never rotate or skew;
- dial remains a moderately tilted ellipse through the full loop;
- the ellipse width and major-axis direction change gently as the plane precesses;
- inner and outer layers remain visually coherent but show small parallax;
- glass prism continues to orbit independently and refract both grid and dial.

- [ ] **Step 2: Tune only motion amplitudes if phase evidence differs**

Allowed tuning ranges:

```ts
0.45 <= yaw <= 0.66
0.10 <= pitchAmplitude <= 0.13
0.05 <= rollAmplitude <= 0.12
0.03 <= maxAbsOuterYawOffset <= 0.09
0.02 <= maxAbsOuterRollOffset <= 0.055
```

Change one parameter per comparison cycle and rerun `motion.test.ts` after each change.

- [ ] **Step 3: Verify mobile and reduced motion**

At `390×844`, confirm the square remains fully visible and no plane clips. With `prefers-reduced-motion: reduce`, confirm a static tilted frame renders without starting RAF.

- [ ] **Step 4: Run full verification**

```bash
./node_modules/.bin/vitest run experiments/natal-dial/src
./node_modules/.bin/tsc -p experiments/natal-dial/tsconfig.json
./node_modules/.bin/vite build --config experiments/natal-dial/vite.config.ts
npm test -- --run
npm run build
```

Expected: zero failed tests, successful TypeScript and Vite builds. Existing chunk-size warnings are allowed; shader compile errors, WebGL warnings and uncaught exceptions are not.

- [ ] **Step 5: Review scope**

Run:

```bash
git diff --name-only -- experiments/natal-dial docs/superpowers/specs/2026-09-07-natal-dial-shader-design.md docs/superpowers/plans/2026-09-07-natal-dial-3d-rig.md
```

Confirm no implementation file outside the isolated stand was changed by this work. Do not commit without explicit user permission.
