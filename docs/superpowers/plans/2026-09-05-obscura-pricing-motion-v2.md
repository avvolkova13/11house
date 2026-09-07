# Obscura Pricing Motion V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Синхронизировать тарифную сцену, автоматический цикл, ручное управление, подробности и зеркальный эффект в одной state-driven motion-системе.

**Architecture:** Чистый reducer в `pricingMotion.ts` описывает фазы `holding` и `transitioning`, направление и роли карточек. `PricingSection` управляет таймерами, viewport, visibility, hover, focus и reduced motion. `PricingOrbit` только отображает состояние через data-атрибуты, а scoped CSS выполняет кинематографическую пластику.

**Tech Stack:** React 19, TypeScript, CSS animations, Vitest, Vite. Без новых зависимостей.

## Global Constraints

- Пауза чтения: `4 800 мс`.
- Переход: `1 150 мс`.
- Начальный тариф: `Pro`.
- Автоматический порядок: `Pro -> Studio -> Старт -> Pro`.
- При reduced motion автоматический цикл отключён, ручной выбор мгновенный.
- Locked Hero и global selectors не менять.
- Не коммитить и не пушить без прямого запроса пользователя.

---

### Task 1: Чистая модель motion-состояния

**Files:**
- Modify: `src/sections/pricingMotion.test.ts`
- Modify: `src/sections/pricingMotion.ts`

**Interfaces:**
- Produces: `PRICING_HOLD_MS`, `PRICING_TRANSITION_MS`, `PricingMotionState`, `createPricingMotionState`, `beginPricingTransition`, `completePricingTransition`, `getPricingCardRole`.

- [ ] **Step 1: Write failing reducer tests**

Проверить точные длительности, default `Pro`, автоматическую последовательность, ручной переход назад, игнорирование повторного выбора и роли `active / incoming / outgoing / relay`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/sections/pricingMotion.test.ts --run`

Expected: FAIL, новые constants и reducer functions отсутствуют.

- [ ] **Step 3: Implement the minimal pure state machine**

Состояние не знает о DOM или таймерах. `beginPricingTransition` принимает массив ключей и optional target; `completePricingTransition` фиксирует target как active; `getPricingCardRole` возвращает роль для CSS.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/sections/pricingMotion.test.ts --run`

Expected: PASS.

### Task 2: Синхронный React-контроллер

**Files:**
- Modify: `src/sections/PricingSection.test.tsx`
- Modify: `src/sections/PricingSection.tsx`
- Modify: `src/sections/PricingOrbit.tsx`

**Interfaces:**
- Consumes: state-machine API from Task 1.
- Produces: `data-motion-phase`, `data-motion-direction`, `data-card-role`, controlled manual selection, synchronized selected details.

- [ ] **Step 1: Write failing markup and accessibility contracts**

Проверить наличие phase/role attributes, live state label, pause-capable wrapper и отсутствие старых negative animation delays.

- [ ] **Step 2: Run the focused component test and verify RED**

Run: `npm test -- src/sections/PricingSection.test.tsx --run`

Expected: FAIL на новых data-contracts.

- [ ] **Step 3: Implement timers and lifecycle cleanup**

Добавить hold timeout `4 800 мс`, transition timeout `1 150 мс`, `IntersectionObserver`, `visibilitychange`, `matchMedia('(prefers-reduced-motion: reduce)')`, hover/focus pause и cleanup каждого listener/timeout. Details переключать только в `completePricingTransition`.

- [ ] **Step 4: Implement manual selection**

Карточки и tabs вызывают единый `selectPlan`. В reduced motion выбор мгновенный. Во время transition дополнительный выбор игнорируется. После ручного settle начинается полный новый hold.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/sections/pricingMotion.test.ts src/sections/PricingSection.test.tsx --run`

Expected: PASS.

### Task 3: Кинематографическая пластика Obscura

**Files:**
- Modify: `src/styles.css` only inside unique `.pricing-*` selectors and pricing keyframes.
- Test: `src/sections/PricingSection.test.tsx`

**Interfaces:**
- Consumes: `data-motion-phase`, `data-motion-direction`, `data-card-role`, `data-plan`.
- Produces: static hold positions, forward/backward transition choreography, art morph, exposure pulse and synchronized portal echoes.

- [ ] **Step 1: Add failing source contracts for the new motion vocabulary**

Проверить, что render содержит mirror echoes per plan and data-plan attributes. CSS contract проверяется по именам scoped keyframes через существующий source test pattern.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/sections/PricingSection.test.tsx src/sections/landingCopy.test.ts --run`

Expected: FAIL на отсутствующих mirror/phase selectors.

- [ ] **Step 3: Replace the independent infinite orbit**

Удалить `pricing-card-orbit`, negative delays и отдельный reflection pulse. Создать static roles и одноразовые forward/backward keyframes для outgoing, incoming и relay. Использовать `cubic-bezier(0.76, 0, 0.24, 1)` как основную траекторию.

- [ ] **Step 4: Add art morph and synchronized mirrors**

Внутренний art-layer меняет `clip-path`, scale и border-radius по роли. Верхняя и нижняя mirror groups используют цветовые переменные активного и входящего тарифов, chromatic fringe и краткий exposure pulse в середине перехода.

- [ ] **Step 5: Add responsive and reduced-motion behavior**

Снизить амплитуду и rotateY на tablet/mobile, сохранить `overflow: clip`, выключить keyframes и auto-state в reduced motion, оставить все кнопки доступными.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/sections/PricingSection.test.tsx src/sections/landingCopy.test.ts --run`

Expected: PASS.

### Task 4: Полная проверка и визуальный QA

**Files:**
- Verify only.

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --run`

Expected: all tests PASS.

- [ ] **Step 2: Build production bundle**

Run: `npm run build`

Expected: TypeScript and Vite build PASS.

- [ ] **Step 3: Verify local runtime**

Проверить HTTP `200`, отсутствие console errors и синхронную смену `Pro -> Studio -> Старт`.

- [ ] **Step 4: Visual QA**

Проверить screenshots на `1440x900`, `1024x768`, `390x844`: центр, боковые карточки, mirror portal, ручное переключение, hover/focus pause, отсутствие overflow.

- [ ] **Step 5: Pre-flight**

Подтвердить, что изменены только pricing files/scoped styles, locked Hero не затронут, новые зависимости не добавлены, все timers/listeners очищаются.
