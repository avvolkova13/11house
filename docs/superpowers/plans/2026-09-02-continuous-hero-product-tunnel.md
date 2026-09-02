# Continuous Hero Product Tunnel Implementation Plan

> **For agentic workers:** Execute inline in the current session. Every behavior change follows a red-green-refactor cycle.

**Goal:** Превратить Hero и Section 2 в одну линейную sticky-сцену с однократным порядком заголовков, product-plane choreography и WebGL-тоннелем после `Вот она`.

**Architecture:** Новый pure-модуль narrative задаёт сцены, линейный progress и tunnel mix. `PageScrollCoordinator` рассчитывает конечный corridor из числа narrative-переходов. `CosmicHero` рисует два типографических режима и реальные product planes, а `CosmicScene` кроссфейдит существующий terrain с отдельной лёгкой геометрией тоннеля.

**Tech Stack:** React 19, TypeScript, Three.js, GLSL, vanilla CSS, Vitest, native scroll/RAF.

## Global Constraints

- Порядок: `Вся ваша практика` → `В одном пространстве` → `ElevenHouse` → Section 2 narrative.
- Каждый headline показывается один раз; modulo запрещён.
- Product UI берётся только из приложенных ElevenHouse screenshots.
- Не устанавливать dependencies и не добавлять GSAP/Lenis/Framer/R3F.
- Не коммитить, не пушить и не публиковать.

---

### Task 1: Linear hero narrative model

**Files:**
- Create: `src/hero/heroNarrative.ts`
- Create: `src/hero/heroNarrative.test.ts`
- Modify: `src/scroll/PageScrollCoordinator.ts`
- Modify: `src/scroll/PageScrollCoordinator.test.ts`

**Interfaces:**
- Produces: `HERO_NARRATIVE_STAGES`, `HERO_STAGE_DISTANCE`, `getLinearStageOffset(progress, index)`, `getTunnelMix(progress)`.
- `getHeroCorridorMetrics()` consumes stage count and exposes a finite travel end.

- [ ] Write tests proving exact order, no wrap at both ends, tunnel mix 0 before `Вот она` and 1 at the final scene.
- [ ] Run targeted tests and confirm expected failures.
- [ ] Implement the minimal pure functions and update coordinator limits.
- [ ] Run targeted tests and confirm passing output.

### Task 2: Product-plane typography choreography

**Files:**
- Modify: `src/components/CosmicHero.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: linear narrative progress and exact product screenshot paths.
- Produces: first three fragmented headline states plus four editorial product states.

- [ ] Add failing narrative motion tests for opacity/scale ranges.
- [ ] Replace cyclic normalization with clamped linear progress.
- [ ] Render exact EH-P05/EH-P01/EH-P04/EH-P09 images in fixed media frames.
- [ ] Implement z-axis entry/hold/exit, text/image layer crossing and mobile rules.
- [ ] Confirm targeted tests pass.

### Task 3: WebGL terrain-to-tunnel morph

**Files:**
- Create: `src/cosmic/CosmicTunnel.ts`
- Create: `src/cosmic/tunnelMotion.ts`
- Create: `src/cosmic/tunnelMotion.test.ts`
- Modify: `src/cosmic/CosmicScene.ts`
- Modify: `src/cosmic/NebulaField.ts`

**Interfaces:**
- `CosmicTunnel.update(elapsed, travel, tunnelMix, streak, pixelRatio)`.
- Terrain receives `setOpacity(1 - tunnelMix)`; tunnel receives `tunnelMix`.

- [ ] Write failing tests for tunnel opacity and radius interpolation.
- [ ] Build deterministic ring/particle tunnel geometry with navy/gold color and no external assets.
- [ ] Feed absolute narrative progress from `HeroScrollAdapter` into the scene.
- [ ] Dispose every geometry/material and preserve visibility lifecycle.
- [ ] Confirm targeted tests pass.

### Task 4: Remove duplicate Section 2 and supply reduced-motion flow

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/CosmicHero.tsx`
- Modify: `src/styles.css`

- [ ] Remove the full-motion duplicate `ChaosToSystemSection` from normal flow.
- [ ] Render the seven narrative states as a static vertical sequence for reduced motion.
- [ ] Verify the handoff lands directly in `OneClientStory` after the tunnel finale.

### Task 5: Visual and regression QA

**Files:**
- Verify only; fix scoped files if a test exposes a defect.

- [ ] Run all Vitest tests and production build.
- [ ] Inspect desktop states 0–6, transition into tunnel, exit and reverse scroll.
- [ ] Inspect 390×844 states, overflow, text wrapping and media legibility.
- [ ] Inspect reduced-motion layout and browser console.
- [ ] Recheck initial Hero at scrollY 0 and confirm the first visible title is `Вся ваша практика`.
