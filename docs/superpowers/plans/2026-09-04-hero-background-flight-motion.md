# Hero Background Flight Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Усилить ощущение быстрого полёта космического фона в первых трёх текстовых сценах Hero без изменения текста и композиции.

**Architecture:** Сохранить текущую scroll-driven архитектуру и добавить отдельную скорость `introVelocity`, действующую только в раннем диапазоне Hero. `getIntroScrollMotion` преобразует её в camera kick, travel boost и интенсивность шлейфов; существующие шейдеры используют разные коэффициенты продвижения звёзд и поверхности для усиления параллакса без новых draw calls и uniforms.

**Tech Stack:** React 19, TypeScript, Three.js, GLSL, Vitest, Vite.

## Global Constraints

- Меняются только фон и камера первых трёх текстовых сцен; заголовки и их DOM не меняются.
- Дополнительное движение полностью затухает до первого продуктового экрана.
- Новые зависимости, WebGL draw calls и uniforms не добавляются.
- Desktop использует 100% амплитуды, tablet 85%, mobile 70%.
- Reduced motion возвращает нулевой дополнительный импульс.
- Изменения не коммитить и не пушить без отдельной команды пользователя.

---

### Task 1: Калибровка раннего пространственного импульса

**Files:**
- Modify: `src/cosmic/introMotion.ts`
- Test: `src/cosmic/introMotion.test.ts`

**Interfaces:**
- Consumes: `{ progress, velocity, viewportWidth, reducedMotion }`.
- Produces: `IntroScrollMotionState` с `cameraZ`, `cameraY`, `horizonY`, `pitch`, `roll`, `travelBoost`, `streak`, `pointStretch`.

- [ ] **Step 1: Write failing calibration tests**

Добавить проверки максимальной энергии ранней сцены:

```ts
const forward = getIntroScrollMotion({
  progress: 1.4,
  velocity: 18,
  viewportWidth: 1440,
  reducedMotion: false,
})

expect(forward.cameraZ).toBeCloseTo(-14.5)
expect(forward.travelBoost).toBeCloseTo(28)
expect(forward.pointStretch).toBeCloseTo(5.2)
expect(forward.streak).toBe(1)
```

Обновить responsive assertions до коэффициентов `0.85` и `0.7`; сохранить зеркальность обратного скролла и нулевой reduced-motion state.

- [ ] **Step 2: Run the test and observe RED**

Run: `npm test -- --run src/cosmic/introMotion.test.ts`

Expected: FAIL на старых значениях `cameraZ`, `travelBoost`, `pointStretch` и responsive scaling.

- [ ] **Step 3: Implement the calibrated mapping**

В `getIntroScrollMotion` использовать:

```ts
const viewportScale = viewportWidth < 700 ? 0.7 : viewportWidth < 1100 ? 0.85 : 1
const signedEnergy = clamp(velocity / 18, -1, 1) * influence * viewportScale
const magnitude = Math.abs(signedEnergy)

return {
  influence,
  signedEnergy,
  cameraZ: signedEnergy * -14.5,
  cameraY: signedEnergy * 1.45,
  horizonY: signedEnergy * -1.35,
  pitch: signedEnergy * -0.034,
  roll: signedEnergy * 0.007,
  travelBoost: signedEnergy * 28,
  streak: smoothstep(0.03, 0.7, magnitude),
  pointStretch: 1 + magnitude * 4.2,
}
```

- [ ] **Step 4: Run the focused test and observe GREEN**

Run: `npm test -- --run src/cosmic/introMotion.test.ts`

Expected: all intro motion tests pass.

---

### Task 2: Усиление глубины частиц без световых дисков

**Files:**
- Modify: `src/cosmic/starProfile.ts`
- Modify: `src/cosmic/shaders/star.ts`
- Modify: `src/cosmic/shaders/nebula.ts`
- Test: `src/cosmic/starProfile.test.ts`
- Test: `src/cosmic/introMotion.test.ts`

**Interfaces:**
- Consumes: existing `uTravel`, `uStreak`, `uVelocity`, `uIntroEnergy`.
- Produces: radial star streaks and stretched terrain points while retaining bounded width and opacity.

- [ ] **Step 1: Write failing shader/profile contract tests**

Проверить:

```ts
expect(STAR_PROFILE.streakStretch).toBeGreaterThanOrEqual(5)
expect(STAR_PROFILE.maxPointSize).toBeLessThanOrEqual(42)
expect(STAR_PROFILE.streakOpacityLoss).toBeGreaterThanOrEqual(0.3)
expect(starVertexShader).toContain('uTravel * 1.35')
expect(terrainVertexShader).toContain('uTravel * 1.08')
expect(terrainPointVertexShader).toContain('abs(uIntroEnergy) * 4.2')
```

- [ ] **Step 2: Run focused tests and observe RED**

Run: `npm test -- --run src/cosmic/starProfile.test.ts src/cosmic/introMotion.test.ts`

Expected: FAIL на старом `2.6x` streak и старом `2.15` point stretch.

- [ ] **Step 3: Update existing shader parameters**

В `STAR_PROFILE` установить:

```ts
maxPointSize: 42,
streakStretch: 5.2,
streakOpacityLoss: 0.34,
```

В terrain point shader заменить:

```glsl
float introStretch = 1.0 + abs(uIntroEnergy) * 4.2;
```

В star vertex shader применять `uTravel * 1.35`, а в общей функции terrain noise — `uTravel * 1.08` вместо `0.82`. Это создаёт разницу продвижения дальнего звёздного слоя и поверхности без новых uniforms.

Оставить текущую ориентацию звёзд по радиальному `vAngle`; не увеличивать базовые размеры звёзд и halo.

- [ ] **Step 4: Run focused tests and observe GREEN**

Run: `npm test -- --run src/cosmic/starProfile.test.ts src/cosmic/introMotion.test.ts`

Expected: all focused tests pass.

---

### Task 3: Отдельная инерция первых сцен

**Files:**
- Modify: `src/cosmic/CosmicScene.ts`
- Modify: `src/cosmic/introMotion.ts`
- Test: `src/cosmic/introMotion.test.ts`

**Interfaces:**
- Consumes: `HeroScrollAdapter` snapshots and `getIntroScrollMotion`.
- Produces: intro-only scroll impulse that cannot accelerate product or tunnel motion.

- [ ] **Step 1: Write failing tests for intro influence boundaries**

Зафиксировать:

```ts
expect(getIntroScrollMotion({ ...input, progress: 2.8 }).influence).toBeGreaterThan(0)
expect(getIntroScrollMotion({ ...input, progress: 3.15 }).influence).toBe(0)
```

И сохранить signed reverse behavior для `velocity: -18`.

- [ ] **Step 2: Add the isolated velocity channel**

В `CosmicScene` добавить `private introVelocity = 0`. В scroll subscription обновлять его только при `travelProgress < 3.15`:

```ts
const introWeight = Math.max(0, Math.min(1, (3.15 - snapshot.travelProgress) / 0.5))
this.introVelocity = clamp(
  this.introVelocity + snapshot.heroDelta * 0.026 * introWeight,
  -18,
  18,
)
```

Основной `scrollVelocity` оставить с текущими коэффициентами.

- [ ] **Step 3: Add inertial decay and feed the intro mapper**

В animation frame:

```ts
this.introVelocity = this.reducedMotion
  ? 0
  : decayVelocity(this.introVelocity, 2.15, dt)

const introMotion = getIntroScrollMotion({
  progress: this.narrativeProgress,
  velocity: this.introVelocity,
  viewportWidth: this.width,
  reducedMotion: this.reducedMotion,
})
```

Для поздних сцен ограничить обычный streak прежним визуальным диапазоном:

```ts
const streak = introMotion.influence > 0
  ? Math.max(baseStreak * 0.45, introMotion.streak)
  : baseStreak * 0.32
```

- [ ] **Step 4: Run motion tests**

Run: `npm test -- --run src/cosmic/introMotion.test.ts src/cosmic/motion.test.ts src/cosmic/starProfile.test.ts`

Expected: all tests pass.

---

### Task 4: Visual and regression QA

**Files:**
- Verify only: `src/cosmic/CosmicScene.ts`, `src/cosmic/introMotion.ts`, `src/cosmic/shaders/star.ts`, `src/cosmic/shaders/nebula.ts`

**Interfaces:**
- Consumes: completed motion implementation.
- Produces: verified desktop, tablet, mobile and reduced-motion behavior.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test -- --run`

Expected: all test files pass.

- [ ] **Step 2: Build production assets**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully; the existing chunk-size warning is acceptable.

- [ ] **Step 3: Check patch formatting**

Run: `git diff --check`

Expected: no output.

- [ ] **Step 4: Compare motion visually**

At `1440×900`, `1024×768`, and `390×844`:

- perform one strong forward wheel gesture on scenes 1–3;
- confirm immediate radial acceleration and a 500–700 ms inertial tail;
- confirm the title composition stays unchanged;
- reverse-scroll and confirm the background direction reverses;
- reach the first product scene and confirm the extra impulse has ended;
- load `?reduced-motion=1` and confirm no camera kick or streak;
- inspect console errors and WebGL warnings.
