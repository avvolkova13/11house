# Cinematic Pricing Orbit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить статичную трёхколоночную таблицу тарифов на кинематографическую 3D-орбиту с зеркальными спектральными отражениями и стабильным блоком подробностей выбранного тарифа.

**Architecture:** Motion-параметры и выбор тарифа остаются детерминированными и тестируемыми вне React. `PricingSection` управляет выбранным тарифом и видимостью секции, а новый `PricingOrbit` отвечает только за сцену и пользовательский выбор. Вся графика создаётся scoped CSS-слоями без видео, canvas и новых зависимостей.

**Tech Stack:** React 19, TypeScript, CSS animations/transforms, Vitest, Vite, IntersectionObserver.

## Global Constraints

- Не менять Hero, блок сравнения и глобальные reset/root rules.
- Не добавлять runtime-зависимости и чужие ассеты.
- Сохранить текущие данные `pricingPlans` и ссылки на `https://app.elevenhouse.ai`.
- Подробности меняются только после действия пользователя, не от autoplay.
- `prefers-reduced-motion: reduce` отключает орбиту, morph и зеркальные движения.
- Mobile не получает горизонтальный scroll внутри `.pricing-section`.

---

### Task 1: Motion-контракт тарифной орбиты

**Files:**
- Create: `src/sections/pricingMotion.ts`
- Create: `src/sections/pricingMotion.test.ts`

**Interfaces:**
- Produces: `PRICING_ORBIT_DURATION_MS`, `PRICING_ORBIT_PHASE_MS`, `DEFAULT_PRICING_PLAN_KEY`, `getPricingOrbitDelay(index)`.
- Consumes: тип `PricingPlan['key']` из `pricingData.ts`.

- [ ] **Step 1: Написать падающий unit-тест**

```ts
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRICING_PLAN_KEY,
  PRICING_ORBIT_DURATION_MS,
  PRICING_ORBIT_PHASE_MS,
  getPricingOrbitDelay,
} from './pricingMotion'

describe('pricing orbit motion contract', () => {
  it('keeps the three cards equally phased at the reference cadence', () => {
    expect(PRICING_ORBIT_DURATION_MS).toBe(9087)
    expect(PRICING_ORBIT_PHASE_MS).toBe(3029)
    expect([0, 1, 2].map(getPricingOrbitDelay)).toEqual([0, -3029, -6058])
  })

  it('opens Pro details by default', () => {
    expect(DEFAULT_PRICING_PLAN_KEY).toBe('pro')
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `npm test -- --run src/sections/pricingMotion.test.ts`

Expected: FAIL, модуль `pricingMotion.ts` отсутствует.

- [ ] **Step 3: Реализовать минимальный контракт**

```ts
import type { PricingPlan } from './pricingData'

export const PRICING_ORBIT_DURATION_MS = 9087
export const PRICING_ORBIT_PHASE_MS = PRICING_ORBIT_DURATION_MS / 3
export const DEFAULT_PRICING_PLAN_KEY: PricingPlan['key'] = 'pro'

export function getPricingOrbitDelay(index: number) {
  return -index * PRICING_ORBIT_PHASE_MS
}
```

- [ ] **Step 4: Запустить тест и подтвердить GREEN**

Run: `npm test -- --run src/sections/pricingMotion.test.ts`

Expected: 2 tests PASS.

### Task 2: React-сцена и стабильные подробности

**Files:**
- Create: `src/sections/PricingOrbit.tsx`
- Create: `src/sections/PricingSection.test.tsx`
- Modify: `src/sections/PricingSection.tsx`

**Interfaces:**
- `PricingOrbitProps`: `{ plans: PricingPlan[]; selectedKey: PricingPlan['key']; inView: boolean; onSelect(key: PricingPlan['key']): void }`.
- `PricingOrbit` emits only explicit user selection through `onSelect`.
- `PricingSection` renders the selected plan from `pricingPlans` and defaults to `DEFAULT_PRICING_PLAN_KEY`.

- [ ] **Step 1: Написать падающий markup-контракт**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PricingSection } from './PricingSection'

describe('PricingSection', () => {
  it('renders the cinematic orbit and defaults stable details to Pro', () => {
    const html = renderToStaticMarkup(<PricingSection />)
    expect(html).toContain('pricing-orbit__reflection--top')
    expect(html).toContain('pricing-orbit__reflection--bottom')
    expect(html).toContain('data-selected="true"')
    expect(html).toContain('Pro')
    expect(html).toContain('Все системы расчётов')
  })

  it('keeps all plans available as explicit controls', () => {
    const html = renderToStaticMarkup(<PricingSection />)
    expect(html.match(/aria-pressed=/g)).toHaveLength(6)
    expect(html).toContain('Подробнее о тарифе Старт')
    expect(html).toContain('Подробнее о тарифе Studio')
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `npm test -- --run src/sections/PricingSection.test.tsx`

Expected: FAIL, новая сцена и selected-details отсутствуют.

- [ ] **Step 3: Создать `PricingOrbit`**

Компонент рендерит:

```tsx
<div className="pricing-orbit" data-in-view={inView}>
  <div className="pricing-orbit__reflection pricing-orbit__reflection--top" aria-hidden="true" />
  <div className="pricing-orbit__reflection pricing-orbit__reflection--bottom" aria-hidden="true" />
  <div className="pricing-orbit__track">
    {plans.map((plan, index) => (
      <button
        className={`pricing-orbit-card pricing-orbit-card--${plan.key}`}
        style={{ '--orbit-delay': `${getPricingOrbitDelay(index)}ms` } as React.CSSProperties}
        type="button"
        aria-label={`Подробнее о тарифе ${plan.name}`}
        aria-pressed={selectedKey === plan.key}
        onClick={() => onSelect(plan.key)}
        key={plan.key}
      >
        <span className="pricing-orbit-card__art" aria-hidden="true" />
        <span className="pricing-orbit-card__content">…</span>
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Перестроить `PricingSection`**

Добавить `useState`, `useRef`, `useEffect` с `IntersectionObserver`, отрисовать `PricingOrbit`, три нижние кнопки выбора и один стабильный `.pricing-details` для `selectedPlan`.

Подробности содержат существующие `limits`, `features`, цену, комиссию и CTA. Автоматическое движение не вызывает `setSelectedPlanKey`.

- [ ] **Step 5: Запустить markup-тест и подтвердить GREEN**

Run: `npm test -- --run src/sections/PricingSection.test.tsx src/sections/pricingMotion.test.ts`

Expected: 4 tests PASS.

### Task 3: Визуал, зеркала и адаптивное движение

**Files:**
- Modify: `src/styles.css:2507-2560`
- Modify: `src/styles.css:2627-2673`
- Modify: `src/sections/landingCopy.test.ts`

**Interfaces:**
- Consumes: DOM-классы `pricing-orbit*`, `pricing-plan-switcher`, `pricing-details*`.
- Produces: 3D-орбиту `9.087s`, pausable motion, отражения, responsive и reduced-motion режимы.

- [ ] **Step 1: Добавить source-контракт**

В `landingCopy.test.ts` проверить наличие `pricing-orbit`, `pricing-orbit__reflection--top`, `pricing-orbit__reflection--bottom`, `pricing-details` и отсутствие старого `.pricing-section__plans` в `PricingSection.tsx`.

- [ ] **Step 2: Запустить целевой тест и подтвердить RED**

Run: `npm test -- --run src/sections/landingCopy.test.ts`

Expected: FAIL до завершения нового markup-контракта.

- [ ] **Step 3: Реализовать desktop CSS**

Добавить:

```css
.pricing-orbit {
  --pricing-orbit-duration: 9087ms;
  position: relative;
  min-height: min(72vw, 760px);
  overflow: clip;
  contain: layout paint;
  isolation: isolate;
  perspective: 1200px;
}

.pricing-orbit-card {
  animation: pricing-orbit var(--pricing-orbit-duration) linear infinite;
  animation-delay: var(--orbit-delay);
  animation-play-state: paused;
  will-change: auto;
}

.pricing-orbit[data-in-view="true"] .pricing-orbit-card {
  animation-play-state: running;
  will-change: transform, opacity, filter;
}
```

Добавить keyframes орбиты, morph внутреннего art-слоя и двух отражений. Hover/focus-within ставит все эти animations на pause.

- [ ] **Step 4: Реализовать responsive и reduced motion**

На tablet уменьшить амплитуду и perspective. На mobile оставить центральную карточку и края боковых, переключатели и details сложить в одну колонку. В `@media (prefers-reduced-motion: reduce)` отключить все pricing animations и показать статичную композицию.

- [ ] **Step 5: Запустить целевые тесты**

Run: `npm test -- --run src/sections/landingCopy.test.ts src/sections/PricingSection.test.tsx src/sections/pricingMotion.test.ts`

Expected: PASS.

### Task 4: Browser QA и полная проверка

**Files:**
- Modify only if QA exposes a scoped defect.

**Interfaces:**
- Verifies the completed pricing contract without changing public interfaces.

- [ ] **Step 1: Visual QA**

Проверить `1440×900`, `1024×768`, `390×844`: центральную и боковые карточки, безопасные поля, зеркальные слои, стабильный details-блок и отсутствие overflow внутри `.pricing-section`.

- [ ] **Step 2: Motion QA**

Проверить непрерывность полного цикла, смену центральной карточки примерно каждые `3,03 сек`, pause на hover/focus и остановку вне viewport.

- [ ] **Step 3: Interaction и accessibility QA**

Клавиатурой выбрать каждый тариф; проверить `aria-pressed`, сохранение фокуса, CTA и reduced-motion CSS-контракт.

- [ ] **Step 4: Полная проверка**

Run: `npm test -- --run`

Expected: все тесты PASS.

Run: `npm run build`

Expected: exit code 0 и отсутствие новых предупреждений, кроме уже существующего bundle-size warning.

- [ ] **Step 5: Проверить рабочее дерево**

Run: `git diff --check && git status --short`

Expected: только файлы тарифной сцены плюс сохранённые незакоммиченные правки предыдущего блока.
