# Cipher-style Workflow Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the three workflow outcome figures as a Cipher-style, scroll-triggered odometer rail with drawn borders and corner points.

**Architecture:** A pure helper converts each public metric string into prefix, digits, suffix, deterministic reel stops, and measured pointer-position column widths. A focused React component owns the replayable viewport lifecycle plus a fine-pointer `requestAnimationFrame` loop and renders semantic final text plus aria-hidden animated reels. `OneClientStory` remains the content owner and delegates only evidence rendering.

**Tech Stack:** React 19, TypeScript 5.9, vanilla scoped CSS, Vitest, native IntersectionObserver and CSS transforms.

## Global Constraints

- The locked Hero and all `src/cosmic/**` files remain unchanged.
- Do not change dependencies, package files, global root/body rules, or public copy.
- Use only `.workflow-metrics*` scoped selectors for new styling.
- Animate only compositor-friendly `transform` and `opacity` properties.
- Reduced motion must render the final state immediately.
- Do not commit, push, or publish.

---

### Task 1: Metric token and reel model

**Files:**
- Create: `src/sections/workflowMetricModel.ts`
- Test: `src/sections/workflowMetrics.test.ts`

**Interfaces:**
- Produces: `parseWorkflowMetric(value: string): WorkflowMetricParts`
- Produces: `buildWorkflowReel(digit: number): { digits: number[]; stopEm: string }`
- `WorkflowMetricParts` contains `prefix`, `digits`, and `suffix`.

- [ ] **Step 1: Write failing tests** for all three exact strings, three repeated `0–9` cycles, and second-cycle stop positions.
- [ ] **Step 2: Run `npm test -- --run src/sections/workflowMetrics.test.ts`** and confirm missing-module failure.
- [ ] **Step 3: Implement the parser and reel model** without DOM dependencies.
- [ ] **Step 4: Run the focused test** and confirm all cases pass.

### Task 2: Accessible viewport-triggered metrics rail

**Files:**
- Create: `src/sections/WorkflowMetrics.tsx`
- Create: `src/sections/WorkflowMetrics.test.tsx`
- Modify: `src/sections/OneClientStory.tsx`
- Modify: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: `evidenceStats: ReadonlyArray<{ value: string; label: string }>`.
- Produces: `<WorkflowMetrics stats={evidenceStats} note="…" />`.
- Uses: `data-entered`, `data-workflow-digit`, and CSS custom property `--workflow-metric-stop`.

- [ ] **Step 1: Write failing source-contract tests** for exactly three articles, aria-label preservation, reel markup, observer cleanup, fallback, and reduced-motion handling.
- [ ] **Step 2: Run focused component/copy tests** and confirm failure against the current static markup.
- [ ] **Step 3: Implement `WorkflowMetrics`** with one-shot `IntersectionObserver`, cleanup, accessible final labels, decorative line/point markup, and 30-character reels.
- [ ] **Step 4: Replace only the current `workflow-evidence` body** in `OneClientStory` with the isolated component.
- [ ] **Step 5: Run focused tests** and confirm they pass.

### Task 3: Reference-matched styling and motion

**Files:**
- Modify: `src/styles.css`
- Test: `src/sections/WorkflowMetrics.test.tsx`

**Interfaces:**
- Consumes the component classes under `.workflow-metrics*`.
- Produces desktop three-column and mobile stacked layouts.

- [ ] **Step 1: Add failing style-contract assertions** for `1.2s` reels, per-digit stagger, `0.8s` line draws, measured delays, `8px` points, three columns, and reduced motion.
- [ ] **Step 2: Run the focused test** and confirm the style contract fails.
- [ ] **Step 3: Append scoped CSS** matching reference proportions and adapting the palette to ElevenHouse.
- [ ] **Step 4: Run focused tests** and confirm the style contract passes.

### Task 4: Browser and repository verification

**Files:**
- Verify only: `src/sections/WorkflowMetrics.tsx`
- Verify only: `src/sections/workflowMetricModel.ts`
- Verify only: `src/sections/OneClientStory.tsx`
- Verify only: `src/styles.css`

**Interfaces:**
- No new interfaces; this task validates the complete integration.

- [ ] **Step 1: Run `npm test -- --run`** and confirm the full suite passes.
- [ ] **Step 2: Run `npm run build`** and confirm TypeScript and Vite production build pass.
- [ ] **Step 3: Inspect desktop entry** at `http://127.0.0.1:5185/`, capture start/mid/final states, and compare reel, border, point, type, and spacing behavior with the reference.
- [ ] **Step 4: Inspect a narrow viewport** and confirm a legible three-item vertical stack with no clipping or horizontal overflow.
- [ ] **Step 5: Inspect reduced motion** and confirm final numbers render immediately.
- [ ] **Step 6: Check browser console and `git diff --check`** for errors and whitespace problems.

### Task 5: Cipher-style elastic hover rail

**Files:**
- Modify: `src/sections/workflowMetricModel.ts`
- Modify: `src/sections/workflowMetrics.test.ts`
- Modify: `src/sections/WorkflowMetrics.tsx`
- Modify: `src/sections/WorkflowMetrics.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `getWorkflowMetricColumns(position: number): readonly [number, number, number]` where `position` is clamped to `-1…1`.
- Uses CSS custom properties `--workflow-column-1`, `--workflow-column-2`, and `--workflow-column-3` on `.workflow-metrics__grid`.

- [x] **Step 1: Write failing model tests** asserting left `[35.02, 34.10, 30.88]`, center `[33.333, 33.334, 33.333]`, right `[31.49, 32.41, 36.10]`, and clamping beyond both edges.
- [x] **Step 2: Run `npm test -- --run src/sections/workflowMetrics.test.ts`** and confirm failure because `getWorkflowMetricColumns` is missing.
- [x] **Step 3: Implement the minimal piecewise-linear column model** using the three measured states and preserving a total of exactly `100`.
- [x] **Step 4: Run the model test** and confirm it passes.
- [x] **Step 5: Write a failing component/style contract test** for fine-pointer gating, `pointermove`, `pointerleave`, `requestAnimationFrame` interpolation and the three CSS grid custom properties.
- [x] **Step 6: Run `npm test -- --run src/sections/WorkflowMetrics.test.tsx`** and confirm the pointer interaction contract fails.
- [x] **Step 7: Implement the scoped pointer effect** with normalized cursor position, time-corrected spring interpolation, leave-to-center reset, full listener/frame cleanup, and no behavior at `700px` or below.
- [x] **Step 8: Replace only the desktop grid track declaration** with the three custom-property tracks; retain the existing later mobile `1fr` override.
- [x] **Step 9: Run both focused test files, `npm run build`, desktop browser motion sampling, responsive CSS inspection, and `git diff --check`**; confirm this task did not edit a Hero file.

## Self-review

- Spec coverage: component mechanics, exact timings, responsive layout, reduced motion, cleanup, accessibility, and locked-Hero isolation are mapped to tasks.
- Placeholder scan: no deferred implementation language or unspecified code work remains.
- Type consistency: `WorkflowMetricParts`, `parseWorkflowMetric`, `buildWorkflowReel`, and `WorkflowMetrics` names are used consistently.
- Execution note: the user explicitly requested continuation in the current dirty workspace; no new worktree or commit will be created, and unrelated changes will be preserved.
