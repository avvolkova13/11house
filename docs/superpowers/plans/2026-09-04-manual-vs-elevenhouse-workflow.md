# Manual vs ElevenHouse Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sticky client-story carousel with a compact five-stage manual-versus-ElevenHouse comparison and three sourced evidence figures.

**Architecture:** `OneClientStory.tsx` becomes a data-driven static semantic section with comparison rows and evidence items. Existing `.client-story*` CSS is replaced with scoped editorial comparison styles; no global styles, Hero code, dependencies, or scroll coordinator behavior change.

**Tech Stack:** React 19, TypeScript, vanilla CSS, Vitest, Vite.

## Global Constraints

- Первый экран и финальный звёздный кадр не меняются.
- Меняется только светлая секция `OneClientStory` и её scoped-стили.
- Секция не перехватывает скролл и не требует прохождения нескольких экранов.
- Цифры обозначаются как отраслевые ориентиры и не выдаются за измеренный результат ElevenHouse.
- Не добавляются зависимости, глобальные стили или неподтверждённые функции продукта.
- Новый коммит не создаётся без отдельного прямого разрешения пользователя.

---

### Task 1: Lock the comparison content contract

**Files:**
- Modify: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: raw source of `OneClientStory.tsx`.
- Produces: a regression contract for five stages, two modes, three figures, source links, and the methodology disclaimer.

- [ ] **Step 1: Write the failing test**

Add assertions for `Ручной режим`, `ElevenHouse`, the five stage labels, `≈5 минут`, `−40%`, all three source URLs, and the exact disclaimer. Assert that `data-client-scene`, `client-story__rail`, and `Клиент Анна` are absent.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/sections/landingCopy.test.ts`

Expected: FAIL because the current component still contains the six-scene sticky story and lacks the new comparison/evidence contract.

- [ ] **Step 3: Do not change production code in this task**

The failing test is the executable requirement for Task 2.

---

### Task 2: Replace the story carousel with a static semantic comparison

**Files:**
- Modify: `src/sections/OneClientStory.tsx`
- Verify: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: two local arrays, `comparisonRows` and `evidenceStats`.
- Produces: `.workflow-compare` with a heading, five `<article>` rows, an evidence `<section>`, source links, and a disclaimer.

- [ ] **Step 1: Define the five rows**

Use the exact approved copy from `docs/superpowers/specs/2026-09-04-manual-vs-elevenhouse-workflow-design.md` for `stage`, `manual`, and `elevenHouse`.

- [ ] **Step 2: Define the three evidence items**

Use `≈5 минут`, `≈5 минут`, and `−40%` with labels and direct URLs from the approved spec. Each item includes a visible `Источник ↗` link.

- [ ] **Step 3: Replace the old component**

Remove the scroll effect, refs, six screenshots, Anna anchor, rail, stage carousel, and footer. Render semantic headings and ordered comparison rows. Use this hierarchy:

```tsx
<section className="workflow-compare" aria-labelledby="workflow-compare-title">
  <header className="workflow-compare__intro">...</header>
  <div className="workflow-compare__head">...</div>
  <div className="workflow-compare__rows">...</div>
  <section className="workflow-evidence" aria-labelledby="workflow-evidence-title">...</section>
</section>
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run src/sections/landingCopy.test.ts`

Expected: all tests in the file pass.

---

### Task 3: Build the editorial comparison layout

**Files:**
- Modify: `src/styles.css`
- Verify: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: `.workflow-compare*` and `.workflow-evidence*` class names from Task 2.
- Produces: desktop two-column comparison, mobile stacked rows, entry motion, reduced-motion behavior, and accessible focus states.

- [ ] **Step 1: Remove obsolete client-story styles**

Delete selectors that only target `.client-story`, `.client-scene`, their rail, anchor, sticky stage, crop, contexts, footer, and associated responsive overrides.

- [ ] **Step 2: Add scoped desktop styles**

Use the existing warm background `#d9d7cf`, thin grid lines, a max-width editorial container, muted manual copy, dark ElevenHouse copy, and one restrained gold accent. Avoid cards, rounded containers, shadows, and gradients that alter the established section surface.

- [ ] **Step 3: Add entry motion and reduced motion**

Rows use opacity and `translateY` only, with per-row CSS delays. Under `[data-motion="reduced"]` all rows and evidence items render immediately without transform or animation.

- [ ] **Step 4: Add tablet and mobile layouts**

At mobile width each article stacks as stage, manual label/copy, then ElevenHouse label/copy. Evidence becomes one column and remains readable without horizontal scrolling.

- [ ] **Step 5: Run automated verification**

Run: `npm test -- --run`

Run: `npm run build`

Expected: 120 or more tests pass and Vite builds successfully; the existing bundle-size warning may remain.

- [ ] **Step 6: Run visual QA**

Inspect `1440×900`, `1024×768`, and `390×844`. Verify the Hero handoff, natural scrolling, five complete comparisons, three evidence figures, source focus states, no horizontal overflow, and correct reduced-motion rendering.

- [ ] **Step 7: Leave the worktree uncommitted**

Report the changed files and verification evidence. Commit and push only after a new explicit user request.
