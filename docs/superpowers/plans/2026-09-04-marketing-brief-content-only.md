# Marketing Brief Content-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обновить тексты существующего лендинга по новому маркетинговому ТЗ без визуальных или структурных изменений.

**Architecture:** Тексты остаются в существующих narrative arrays и React-компонентах. Новый source-level content-contract тест проверяет ключевые формулировки без рефакторинга компонентов или изменения DOM.

**Tech Stack:** React 19, TypeScript, Vitest, Vite.

## Global Constraints

- Не менять layout, CSS, DOM-анатомию, motion, WebGL, screenshots и dependencies.
- Не добавлять отсутствующие menu, onboarding, metrics или review sections.
- Не придумывать отзывы, результаты, условия хранения данных и неподтверждённые product capabilities.
- Не менять цены: Старт — 0 ₽ / 8%, Pro — 1 990 ₽ / 4%, Studio — 4 990 ₽ / 2%.
- Не коммитить и не пушить без отдельной команды пользователя.

---

### Task 1: Content contract

**Files:**
- Create: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: source files that render public landing copy.
- Produces: regression assertions for Hero, section headings, CTA and all eight FAQ questions.

- [ ] Write assertions for the exact marketer-approved phrases.
- [ ] Run `npm test -- --run src/sections/landingCopy.test.ts` and confirm RED against the old copy.

### Task 2: Hero copy

**Files:**
- Modify: `src/hero/heroNarrative.ts`
- Modify: `src/components/CosmicHero.tsx`
- Modify: `src/hero/heroNarrative.test.ts`

**Interfaces:**
- Consumes: existing seven-stage Hero choreography.
- Produces: new category-first headline, exact subheading and registration CTA using the unchanged motion contract.

- [ ] Replace only stage strings and Hero description/button strings.
- [ ] Update existing narrative expectations without altering stage count or modes.

### Task 3: Post-Hero section copy

**Files:**
- Modify: `src/sections/OneClientStory.tsx`
- Modify: `src/sections/ProductProof.tsx`
- Modify: `src/sections/AiRoutine.tsx`
- Modify: `src/sections/UnifiedWorkspace.tsx`
- Modify: `src/sections/PricingSection.tsx`
- Modify: `src/sections/FaqSection.tsx`
- Modify: `src/sections/FinalCta.tsx`

**Interfaces:**
- Consumes: unchanged section components and confirmed product screenshots.
- Produces: benefit-first copy matching the new funnel order where an existing section is available.

- [ ] Replace headings, labels, body copy and CTA strings only.
- [ ] Keep screenshot paths, array lengths, element order and links unchanged.
- [ ] Run the content-contract test and targeted existing tests; confirm GREEN.

### Task 4: Verification

**Files:**
- Modify only if text overflow is found: the relevant string source file; CSS remains locked.

**Interfaces:**
- Consumes: local desktop and mobile render.
- Produces: readable copy with no clipping and a clean production build.

- [ ] Inspect Hero and every post-Hero section on desktop.
- [ ] Inspect long headings, tariff copy and eight FAQ items on mobile.
- [ ] Run `npm test -- --run`, `npm run build` and `git diff --check`.

