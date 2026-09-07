# Workflow Comparison Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить содержание блока «Ручной режим / ElevenHouse» утверждённым пятиэтапным сравнением и четырьмя продуктовыми метриками.

**Architecture:** Существующий компонент и его трёхколоночная композиция сохраняются. Меняются только данные, подписи и scoped CSS сетки метрик; регрессии контента фиксируются статическим Vitest-тестом.

**Tech Stack:** React 19, TypeScript, CSS Grid, Vitest.

## Global Constraints

- Не изменять locked Hero и связанные global styles.
- Сохранить текущую сетку сравнения и существующий reduced-motion fallback.
- Не перезаписывать незакоммиченные изменения тарифов.
- Не выполнять commit или push без отдельной команды пользователя.

---

### Task 1: Зафиксировать утверждённый контент тестом

**Files:**
- Modify: `src/sections/landingCopy.test.ts`
- Test: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: исходный текст `src/sections/OneClientStory.tsx` как строку.
- Produces: assertions для пяти этапов, десяти сравнительных формулировок, четырёх метрик и продуктовой подписи.

- [x] **Step 1: Replace the old research-benchmark assertions**

Проверить наличие утверждённых текстов и отсутствие старых внешних ссылок, `≈5 минут`, `−40%` и исследовательской оговорки.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: FAIL, потому что компонент всё ещё содержит прежние показатели и тексты строк.

### Task 2: Обновить данные компонента

**Files:**
- Modify: `src/sections/OneClientStory.tsx`
- Test: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: утверждённый текст из спецификации.
- Produces: пять строк `comparisonRows` и четыре элемента `evidenceStats` без внешних ссылок.

- [x] **Step 1: Implement the approved copy**

Обновить `comparisonRows`, подзаголовок, метрики и подпись; удалить заголовок «Что дают автоматизированные операции.» и ссылки источников.

- [x] **Step 2: Run focused test to verify it passes**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: PASS.

### Task 3: Адаптировать сетку четырёх метрик

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: четыре `.workflow-evidence__stat` из компонента.
- Produces: 4-column desktop grid, 2-column responsive grid and 1-column narrow-mobile fallback.

- [x] **Step 1: Update only scoped workflow evidence rules**

Удалить стили несуществующих ссылок, настроить четыре колонки и адаптивные границы между показателями.

- [x] **Step 2: Run the full automated verification**

Run: `npm test -- --run`

Expected: all tests PASS.

- [x] **Step 3: Build the production bundle**

Run: `npm run build`

Expected: exit code 0.

- [x] **Step 4: Verify rendered desktop and mobile layouts**

Открыть локальную страницу после `networkidle`, проверить заголовок, пять строк, четыре метрики, отсутствие старых ссылок и переполнений на desktop/mobile.
