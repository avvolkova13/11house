# Product Tile Camera-Pass Exit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Subagents are not authorized for this project task.

**Goal:** Replace the current random product-tile explosion with the approved Mesh3D-like forward camera pass and ordered row release.

**Architecture:** Keep the animation fully deterministic and reversible by deriving every panel and tile transform from `stageOffset`. Add explicit camera-pass, row-release, and tail phases to the existing pure motion helpers, then let the existing Three.js renderer apply those transforms without physics or retained simulation state.

**Tech Stack:** React 19, TypeScript, Three.js, Vitest, Vite.

## Global Constraints

- Change only the exit branch of the first tiled product panel.
- Preserve incoming motion, focus state, pointer seam, lighting, materials, screenshot texture, text, scene ordering, background, tunnel, and scroll runway.
- Keep the implementation deterministic and reversible; no time-dependent random exit state.
- Do not add dependencies.
- Do not commit unless the user explicitly asks.

---

### Task 1: Encode the reference exit contract in failing tests

**Files:**
- Modify: `src/hero/productTileMotion.test.ts`
- Test: `src/hero/productTileMotion.test.ts`

**Interfaces:**
- Consumes: `getTiledPanelMotion(stageOffset: number): TiledPanelMotion` and `getProductTileMotion(input: ProductTileMotionInput): ProductTileMotion`.
- Produces: regression coverage for forward camera movement, intact early grid, ordered row release, and clean late tail.

- [ ] **Step 1: Replace the old random-explosion assertions with camera-pass assertions**

Add tests equivalent to:

```ts
it('accelerates the outgoing membrane through the camera', () => {
  const focus = getTiledPanelMotion(0)
  const pass = getTiledPanelMotion(-0.58)

  expect(pass.scale).toBeGreaterThan(focus.scale)
  expect(pass.z).toBeGreaterThan(5)
  expect(pass.y).toBeGreaterThan(-1.5)
})

it('keeps the early exit grid horizontally coherent', () => {
  const left = getProductTileMotion(tileInput({ column: 0, row: 3, stageOffset: -0.28 }))
  const right = getProductTileMotion(tileInput({ column: 9, row: 3, stageOffset: -0.28 }))

  expect(Math.abs(left.x)).toBeLessThan(0.45)
  expect(Math.abs(right.x)).toBeLessThan(0.45)
  expect(Math.abs(left.y - right.y)).toBeLessThan(0.22)
})

it('releases lower rows through the camera before upper rows', () => {
  const top = getProductTileMotion(tileInput({ column: 5, row: 0, stageOffset: -0.5 }))
  const bottom = getProductTileMotion(tileInput({ column: 5, row: 6, stageOffset: -0.5 }))

  expect(bottom.z).toBeGreaterThan(top.z + 0.8)
  expect(bottom.y).toBeLessThan(top.y - 0.45)
})

it('keeps neighbouring tiles on the same release arc', () => {
  const first = getProductTileMotion(tileInput({ column: 4, row: 5, stageOffset: -0.58 }))
  const second = getProductTileMotion(tileInput({ column: 5, row: 5, stageOffset: -0.58 }))

  expect(Math.abs(first.y - second.y)).toBeLessThan(0.12)
  expect(Math.abs(first.z - second.z)).toBeLessThan(0.22)
})
```

Define this local test helper:

```ts
const tileInput = (
  overrides: Partial<Parameters<typeof getProductTileMotion>[0]> = {},
): Parameters<typeof getProductTileMotion>[0] => ({
  column: 5,
  row: 3,
  columns: 10,
  rows: 7,
  stageOffset: 0,
  pointerX: 0,
  pointerY: 0,
  elapsed: 0,
  reducedMotion: false,
  ...overrides,
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --run src/hero/productTileMotion.test.ts
```

Expected: the new camera-pass and coherence assertions fail against the current `peel`, `exitDrop`, `exitDepth`, and scatter-driven implementation.

- [ ] **Step 3: Record the no-commit checkpoint**

Run `git status --short`. Do not commit; user authorization is required.

---

### Task 2: Replace random scatter with phased camera-pass motion

**Files:**
- Modify: `src/hero/productTileMotion.ts`
- Test: `src/hero/productTileMotion.test.ts`

**Interfaces:**
- Consumes: current `stageOffset`, normalized row/column coordinates, pointer values, elapsed time, and reduced-motion flag.
- Produces: `TiledPanelMotion` with `cameraPass`, `rowRelease`, and `tail`; `ProductTileMotion` with deterministic row-coherent transforms.

- [ ] **Step 1: Add explicit exit phases to `TiledPanelMotion`**

Extend the type:

```ts
export type TiledPanelMotion = {
  opacity: number
  scale: number
  bend: number
  breakaway: number
  cameraPass: number
  rowRelease: number
  tail: number
  rotationX: number
  rotationY: number
  y: number
  z: number
}
```

For outgoing motion, calculate:

```ts
const exit = incoming ? 0 : smoothstep(0.08, 0.72, -stageOffset)
const cameraPass = smoothstep(0.06, 0.78, exit)
const rowRelease = smoothstep(0.42, 0.9, exit)
const tail = smoothstep(0.82, 1, exit)
```

Keep the existing incoming transform values unchanged and return `cameraPass: 0`, `rowRelease: 0`, and `tail: 0` for that branch. For the outgoing branch use:

```ts
scale: 0.56 + cameraPass * 0.18,
bend: 0.56 + cameraPass * 0.42,
breakaway: exit,
cameraPass,
rowRelease,
tail,
rotationX: -cameraPass * 0.18,
rotationY: -cameraPass * 0.04,
y: -cameraPass * 0.72,
z: cameraPass * 8.4,
```

Keep opacity tied to the existing stage distance so the next scene does not require a timing change.

- [ ] **Step 2: Replace exit scatter with ordered row transforms**

Keep the focus, pointer, static twist, and incoming assembly calculations intact. Replace `peel`, `exitDrop`, and `exitDepth` with deterministic row phases:

```ts
const columnProgress = columns > 1 ? column / (columns - 1) : 0.5
const centerArc = 1 - Math.abs(columnProgress * 2 - 1)
const rowDelay = (1 - rowProgress) * 0.16
const rowPass = smoothstep(0.18 + rowDelay, 0.82 + rowDelay, panel.cameraPass)
const rowDetach = smoothstep(0.36 + rowDelay, 0.92 + rowDelay, panel.rowRelease)
const tailSeed = Math.sin((column + 1) * 91.73 + (row + 1) * 47.17) * 43758.5453
const tailVariance = tailSeed - Math.floor(tailSeed)
```

Use the phases in the return values:

```ts
x: nx * rowDetach * 0.22
  + nx * panel.tail * (0.8 + tailVariance * 0.45)
  + nx * assembly * 0.22
  + pointerFollowX
  + pointerSlice * 0.07,
y: -rowPass * (0.18 + rowProgress * 1.15)
  + (1 - rowProgress) * rowDetach * 0.24
  - panel.tail * (0.35 + rowProgress * 0.55)
  - assembly * 0.9
  + pointerY * 0.18 * pointerReach
  + staticTwist * 0.08
  + pointerSlice * 0.03,
z: curvature
  + rowPass * (0.45 + rowProgress * 1.55 + centerArc * 0.34)
  + panel.tail * (0.35 + rowProgress * 0.65)
  + staticTwist
  + pointerWave * 0.52
  - pointerSlice * 0.35
  + idle
  - assembly * 1.65,
rotationX: reducedMotion ? 0 : -ny * panel.bend * 0.16
  + rowDetach * (0.16 + rowProgress * 0.62)
  + panel.tail * (tailVariance - 0.5) * 0.42
  + pointerWave * dy * 0.5
  + pointerSlice * 0.08
  - assembly * 0.58,
rotationY: reducedMotion ? 0 : nx * panel.bend * 0.28
  + nx * rowDetach * 0.2
  + panel.tail * (tailVariance - 0.5) * 0.28
  - pointerSlice * 0.35
  + pointerX * pointerReach * 0.16,
rotationZ: reducedMotion ? 0 : staticRoll
  + nx * rowDetach * 0.06
  + panel.tail * (tailVariance - 0.5) * 0.26
  + pointerSlice * 0.03
  + direction * assembly * 0.045,
scale: 1 + rowPass * 0.035 - panel.tail * tailVariance * 0.08,
```

Random variance must appear only inside terms multiplied by `panel.tail`.

- [ ] **Step 3: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run src/hero/productTileMotion.test.ts
```

Expected: all product-tile motion tests pass.

- [ ] **Step 4: Record the no-commit checkpoint**

Run `git diff -- src/hero/productTileMotion.ts src/hero/productTileMotion.test.ts` and `git status --short`. Do not commit.

---

### Task 3: Calibrate against the reference and verify the full project

**Files:**
- Modify if calibration requires it: `src/hero/productTileMotion.ts`
- Test if thresholds change materially: `src/hero/productTileMotion.test.ts`
- No changes: locked Hero background/tunnel files, `src/styles.css`, product screenshot asset.

**Interfaces:**
- Consumes: the pure phase values implemented in Task 2.
- Produces: visually calibrated and verified reversible exit motion.

- [ ] **Step 1: Capture five local control frames at `1280 × 720`**

Use the running local page and native wheel input to capture:

1. focus;
2. early acceleration;
3. full-frame membrane pass;
4. ordered row release;
5. sparse tail.

Compare against the reference sequence captured with 60-unit wheel steps. Check scale, optical center, lower-row lead, horizontal row gaps, fragment density, and handoff timing.

- [ ] **Step 2: Calibrate one variable family at a time**

If needed, adjust only one of these groups per iteration and rerun the focused tests:

```ts
// Camera size and speed
scale, z

// Optical center
y, rotationX

// Row timing and curvature
rowDelay, rowPass, rowDetach

// Final sparse tail only
tail x/y/z and tail rotations
```

Do not reintroduce random early scatter.

- [ ] **Step 3: Verify reverse scroll**

Scroll from sparse tail back through row release to focus. Expected: the same trajectories run backward and the grid reassembles without jumps or retained state.

- [ ] **Step 4: Verify reduced motion**

Run the unit tests covering `reducedMotion: true`. Expected: pointer and tile rotation remain disabled; the scene uses the existing restrained transition.

- [ ] **Step 5: Run full verification**

Run:

```bash
npm test -- --run
npm run build
```

Expected: all tests pass and Vite production build exits with code 0. The existing bundle-size advisory may remain; no new build error is allowed.

- [ ] **Step 6: Report the no-commit handoff**

Report the exact test count, build result, visual checkpoints, changed files, and that no commit was created.
