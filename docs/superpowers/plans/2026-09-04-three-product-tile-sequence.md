# Three Product Tile Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Показать три подтверждённых экрана ElevenHouse как последовательные объёмные плиточные сцены с чистыми неперекрывающимися handoff-переходами.

**Architecture:** `HERO_NARRATIVE_STAGES` хранит точные screenshot paths и порядок сцен. Все product stages используют один `ProductTilePanel`; pure motion helpers управляют локальной плиточной анимацией, а `getProductStageMotion` задерживает вход следующих объектов до освобождения кадра.

**Tech Stack:** React 19, TypeScript, Three.js, Vitest, Vite.

## Global Constraints

- Не менять первые три заголовка, Hero background, tunnel и downstream sections.
- Не менять UI внутри пользовательских screenshots.
- Не добавлять dependencies.
- Не коммитить и не пушить без отдельной команды пользователя.
- Сохранять reduced-motion fallback и cleanup всех WebGL resources.

---

### Task 1: Product scene contract

**Files:**
- Modify: `src/hero/heroNarrative.test.ts`
- Modify: `src/hero/heroNarrative.ts`

**Interfaces:**
- Consumes: `HERO_NARRATIVE_STAGES`, `getProductStageMotion(stageOffset, deferIncoming)`.
- Produces: paths for `eh-products-tiles.png`, `eh-calendar-tiles.png`, `eh-numerology-tiles.png` and an incoming visibility gate for stages after the first product scene.

- [x] Write a failing test that expects the three new asset paths in Products → Calendar → Numerology order.
- [x] Write a failing sampled handoff test that keeps adjacent scene opacity overlap below the agreed threshold.
- [x] Run `npm test -- --run src/hero/heroNarrative.test.ts` and confirm the new assertions fail.
- [x] Update the narrative data and motion gate minimally.
- [x] Re-run the targeted test and confirm it passes.

### Task 2: Screenshot assets

**Files:**
- Create: `public/assets/product-screenshots/eh-products-tiles.png`
- Create: `public/assets/product-screenshots/eh-numerology-tiles.png`

**Interfaces:**
- Consumes: the two exact user-supplied PNG files.
- Produces: browser-ready local texture assets referenced by `HERO_NARRATIVE_STAGES`.

- [x] Copy the numerology screenshot without content changes.
- [x] Downscale the 6677 px products screenshot to about 3024 px width while preserving its aspect ratio.
- [x] Verify file type, dimensions and readable screenshot content.

### Task 3: Generic three-scene rendering

**Files:**
- Modify: `src/components/CosmicHero.tsx`
- Modify: `src/components/ProductTilePanel.tsx`

**Interfaces:**
- Consumes: `stage.screenshot`, `stageOffset`, `reducedMotion`.
- Produces: the same 12×7 volumetric tile renderer for every product stage and paused rendering for distant stages.

- [x] Replace the calendar-only conditional with generic `ProductTilePanel` rendering for every product stage.
- [x] Pass the screenshot path from narrative data rather than hard-coding it.
- [x] Delay stages 4 and 5 with the incoming gate while stage 3 keeps the normal entrance from the preceding copy.
- [x] Pause or skip continuous rendering for scenes outside the active handoff corridor without changing visual timing.
- [x] Run the targeted tests and TypeScript build.

### Task 4: Motion and visual QA

**Files:**
- Modify only if visual evidence requires it: `src/hero/productTileMotion.ts`
- Modify alongside helper changes: `src/hero/productTileMotion.test.ts`

**Interfaces:**
- Consumes: local preview and Mesh3D frame observations.
- Produces: readable focus frames, reference-like camera pass, full cleanup, clean beat, and reversible next entrance.

- [x] Capture focus, exit, clean beat and next-entry frames for both scene handoffs.
- [x] Verify no two screenshot textures are visibly present together.
- [x] Verify pointer deformation on the shared renderer across the three panels.
- [x] Verify reverse scroll reconstructs the previous object.
- [x] Verify the reduced-motion state and existing responsive CSS contract.
- [x] Run `npm test -- --run` and `npm run build`; both must pass before completion is reported.
