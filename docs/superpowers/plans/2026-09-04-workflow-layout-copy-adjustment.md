# Workflow Layout Copy Adjustment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обновить заголовки и выравнивание блока сравнения, сохранив существующую безопасную сетку и адаптивность.

**Architecture:** Изменение остаётся внутри `OneClientStory` и его scoped-селекторов `workflow-*`. Контракт текста фиксируется raw-source тестом, а геометрия проверяется вычисленными стилями и границами элементов в браузере на desktop/mobile.

**Tech Stack:** React, TypeScript, CSS, Vitest, Vite.

## Global Constraints

- Hero и его глобальные стили не меняются.
- Внутренний контейнер `.workflow-compare__inner` и трёхколоночная сетка `.workflow-evidence__grid` сохраняются.
- Новый заголовок результатов не выходит за безопасные боковые поля.
- На mobile не допускается горизонтальный overflow.

---

### Task 1: Зафиксировать новый контракт текста и сетки

**Files:**
- Modify: `src/sections/landingCopy.test.ts:1-96`

**Interfaces:**
- Consumes: raw-source `OneClientStory.tsx`.
- Produces: тестовый контракт для нового заголовка и отсутствия eyebrow.

- [ ] **Step 1: Написать падающие проверки**

Добавить проверки:

```ts
expect(clientStorySource).toContain('Больше времени на клиентов. Меньше — на рутину.')
expect(clientStorySource).not.toContain('Ориентиры экономии')
```

- [ ] **Step 2: Запустить целевой тест и подтвердить RED**

Run: `npm test -- --run src/sections/landingCopy.test.ts`

Expected: FAIL на старом заголовке, eyebrow и ограниченной ширине.

### Task 2: Обновить DOM и scoped-стили

**Files:**
- Modify: `src/sections/OneClientStory.tsx:52-108`
- Modify: `src/styles.css:1601-1627`
- Modify: `src/styles.css:1735-1763`
- Modify: `src/styles.css:1832-1839`
- Modify: `src/styles.css:1926-1967`

**Interfaces:**
- Consumes: существующие классы `.workflow-compare__intro`, `.workflow-evidence`, `.workflow-evidence__grid`, `.workflow-evidence__note`.
- Produces: прежнюю DOM-структуру строк и цифр с обновлённой intro/evidence композицией.

- [ ] **Step 1: Обновить JSX**

```tsx
<h2 id="workflow-compare-title">Больше времени на клиентов. Меньше — на рутину.</h2>
```

Удалить `<span>Ориентиры экономии</span>` из evidence header, сохранив `h3`, три карточки цифр, ссылки и методологическую подпись.

- [ ] **Step 2: Растянуть заголовок внутри существующего контейнера**

```css
.workflow-evidence > header {
  display: block;
  padding-bottom: clamp(30px, 4vw, 56px);
}

.workflow-evidence h3 {
  max-width: none;
}

.workflow-evidence__note {
  max-width: none;
  margin: 22px 0 0;
}
```

Удалить неиспользуемый селектор `.workflow-evidence > header > span` и mobile-отступ `margin-top` у evidence `h3`. Не менять `.workflow-evidence__grid`.

- [ ] **Step 3: Запустить целевой тест и подтвердить GREEN**

Run: `npm test -- --run src/sections/landingCopy.test.ts`

Expected: PASS.

- [ ] **Step 4: Проверить результат в браузере**

Проверить 1440×900, 1024×768 и 390×844: заголовки входят в `.workflow-compare__inner`, колонки цифр не изменились, подпись стоит слева. На mobile ни один потомок `.workflow-compare` не выходит за границы viewport; отдельно учитывать, что скрытые элементы Hero уже создают общий `documentElement.scrollWidth` после handoff.

- [ ] **Step 5: Полная проверка**

Run: `npm test -- --run`

Expected: все тесты PASS.

Run: `npm run build`

Expected: exit code 0.
