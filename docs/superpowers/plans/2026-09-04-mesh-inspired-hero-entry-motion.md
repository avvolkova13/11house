# Mesh-inspired Hero Entry Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить с первого кадра Hero каскад появления, повторяющий пространственный ритм Mesh3D, без изменения финальной композиции и существующей scroll-логики.

**Architecture:** React управляет одноразовой фазой `preparing | entering | settled`; чистый helper определяет начальное состояние и раннее завершение по scroll. Scoped CSS анимирует canvas, header, первый copy-stage и progress indicator; Three.js и глобальные стили не меняются.

**Tech Stack:** React 19, TypeScript 5.9, CSS keyframes, Vitest 3, существующий Vite/Three.js runtime.

## Global Constraints

- Общая длительность intro — 2100 ms после двух последовательных `requestAnimationFrame`.
- Не менять `CosmicScene`, shaders, stars, terrain, product stages, Hero copy, typography, layout и scroll-progress mapping.
- Не добавлять dependencies и постоянный RAF.
- Новые стили только под `.cosmic-runway[data-intro]`.
- Early scroll немедленно переводит intro в `settled`, не меняя `copyProgress`.
- Reduced motion не использует camera travel, scale, blur или glyph stagger.
- Не коммитить и не пушить без отдельного прямого разрешения пользователя.

---

### Task 1: Чистая модель lifecycle

**Files:**
- Create: `src/cosmic/heroEntryMotion.ts`
- Create: `src/cosmic/heroEntryMotion.test.ts`

**Interfaces:**
- Produces: `HeroEntryPhase`, `HERO_ENTRY_DURATION_MS`, `getInitialHeroEntryPhase(reducedMotion, scrollY)`, `shouldSettleHeroEntry(phase, startScrollY, currentScrollY)`.

- [ ] **Step 1: Написать failing tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  HERO_ENTRY_DURATION_MS,
  getInitialHeroEntryPhase,
  shouldSettleHeroEntry,
} from './heroEntryMotion'

describe('hero entry motion', () => {
  it('starts preparing only at the top with full motion', () => {
    expect(getInitialHeroEntryPhase(false, 0)).toBe('preparing')
    expect(getInitialHeroEntryPhase(false, 1)).toBe('settled')
    expect(getInitialHeroEntryPhase(true, 0)).toBe('settled')
  })

  it('settles on the first real scroll delta', () => {
    expect(shouldSettleHeroEntry('entering', 0, 0)).toBe(false)
    expect(shouldSettleHeroEntry('entering', 0, 1)).toBe(true)
    expect(shouldSettleHeroEntry('settled', 0, 20)).toBe(false)
  })

  it('uses the approved total duration', () => {
    expect(HERO_ENTRY_DURATION_MS).toBe(2100)
  })
})
```

- [ ] **Step 2: Запустить RED**

Run: `npm test -- --run src/cosmic/heroEntryMotion.test.ts`

Expected: FAIL because `./heroEntryMotion` does not exist.

- [ ] **Step 3: Добавить минимальную реализацию**

```ts
export type HeroEntryPhase = 'preparing' | 'entering' | 'settled'

export const HERO_ENTRY_DURATION_MS = 2100

export const getInitialHeroEntryPhase = (
  reducedMotion: boolean,
  scrollY: number,
): HeroEntryPhase => reducedMotion || scrollY > 0 ? 'settled' : 'preparing'

export const shouldSettleHeroEntry = (
  phase: HeroEntryPhase,
  startScrollY: number,
  currentScrollY: number,
) => phase !== 'settled' && Math.abs(currentScrollY - startScrollY) >= 1
```

- [ ] **Step 4: Запустить GREEN**

Run: `npm test -- --run src/cosmic/heroEntryMotion.test.ts`

Expected: 3 tests PASS.

---

### Task 2: Подключить lifecycle к locked Hero boundary

**Files:**
- Modify: `src/components/CosmicHero.tsx:1-170`
- Create: `src/cosmic/heroEntryContract.test.ts`
- Test: `src/cosmic/heroEntryMotion.test.ts`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: `data-intro="preparing|entering|settled"` on `.cosmic-runway`.

- [ ] **Step 1: Написать failing source-contract test**

```ts
import { describe, expect, it } from 'vitest'
import heroSource from '../components/CosmicHero.tsx?raw'

describe('hero entry integration', () => {
  it('exposes the entry lifecycle to the scoped Hero boundary', () => {
    expect(heroSource).toContain("from '../cosmic/heroEntryMotion'")
    expect(heroSource).toContain('data-intro={entryPhase}')
    expect(heroSource.match(/requestAnimationFrame/g) ?? []).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Запустить RED**

Run: `npm test -- --run src/cosmic/heroEntryContract.test.ts`

Expected: FAIL because `CosmicHero.tsx` does not contain the entry import or `data-intro`.

- [ ] **Step 3: Добавить React lifecycle**

Импортировать helper и добавить состояние:

```ts
const [entryPhase, setEntryPhase] = useState<HeroEntryPhase>(() => (
  getInitialHeroEntryPhase(reducedMotion, window.scrollY)
))
```

Добавить два effects после вычисления reduced motion:

```ts
useEffect(() => {
  if (entryPhase !== 'preparing') return
  let firstFrame = 0
  let secondFrame = 0

  firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(() => {
      setEntryPhase('entering')
    })
  })

  return () => {
    window.cancelAnimationFrame(firstFrame)
    window.cancelAnimationFrame(secondFrame)
  }
}, [entryPhase])

useEffect(() => {
  if (entryPhase === 'settled') return

  const startScrollY = window.scrollY
  const settle = () => setEntryPhase('settled')
  const onScroll = () => {
    if (shouldSettleHeroEntry(entryPhase, startScrollY, window.scrollY)) settle()
  }
  const settleTimer = entryPhase === 'entering'
    ? window.setTimeout(settle, HERO_ENTRY_DURATION_MS)
    : 0

  window.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    window.clearTimeout(settleTimer)
    window.removeEventListener('scroll', onScroll)
  }
}, [entryPhase])
```

Добавить на `.cosmic-runway`:

```tsx
data-intro={entryPhase}
```

- [ ] **Step 4: Проверить TypeScript и Hero tests**

Run: `npm test -- --run src/cosmic/heroEntryContract.test.ts src/cosmic/heroEntryMotion.test.ts src/cosmic/introMotion.test.ts src/cosmic/copyMotion.test.ts src/hero/heroNarrative.test.ts`

Expected: all selected tests PASS.

---

### Task 3: Реализовать Mesh-inspired choreography в scoped CSS

**Files:**
- Modify: `src/styles.css:32-250`
- Test: `src/cosmic/heroEntryContract.test.ts`

**Interfaces:**
- Consumes: `data-intro` from Task 2.
- Produces: compositor-only entrance animations for `.cosmic-canvas`, `.landing-header`, first `.hero-copy__stage`, and `.hero-copy__progress`.

- [ ] **Step 1: Расширить source-contract test и запустить RED**

```ts
import stylesSource from '../styles.css?raw'

it('keeps the choreography scoped to the Hero entry state', () => {
  expect(stylesSource).toContain('.cosmic-runway[data-intro="preparing"]')
  expect(stylesSource).toContain('.cosmic-runway[data-intro="entering"]')
  expect(stylesSource).toContain('@keyframes hero-entry-field')
  expect(stylesSource).toContain('1180ms 120ms')
  expect(stylesSource).toContain('1080ms 480ms')
  expect(stylesSource).not.toContain('body[data-intro')
})
```

Run: `npm test -- --run src/cosmic/heroEntryContract.test.ts`

Expected: FAIL because the scoped CSS choreography is missing.

- [ ] **Step 2: Добавить isolated preparing state**

```css
.cosmic-runway[data-intro="preparing"] .cosmic-canvas,
.cosmic-runway[data-intro="preparing"] .landing-header,
.cosmic-runway[data-intro="preparing"] .hero-copy__stage:first-child,
.cosmic-runway[data-intro="preparing"] .hero-copy__progress {
  opacity: 0;
}

.cosmic-runway[data-intro="preparing"] .cosmic-canvas {
  transform: scale(var(--hero-entry-field-scale, 1.045));
}
```

- [ ] **Step 3: Добавить entering animations с утверждённым timing**

```css
.cosmic-runway[data-intro="entering"] .cosmic-canvas {
  animation: hero-entry-field 1180ms 120ms cubic-bezier(0.16, 0.76, 0.2, 1) both;
}

.cosmic-runway[data-intro="entering"] .landing-header {
  animation: hero-entry-header 760ms 280ms cubic-bezier(0.16, 0.76, 0.2, 1) both;
}

.cosmic-runway[data-intro="entering"] .hero-copy__stage:first-child {
  animation: hero-entry-copy 1080ms 480ms cubic-bezier(0.16, 0.76, 0.2, 1) both;
}

.cosmic-runway[data-intro="entering"] .hero-copy__progress {
  animation: hero-entry-secondary 720ms 940ms cubic-bezier(0.16, 0.76, 0.2, 1) both;
}
```

- [ ] **Step 4: Добавить keyframes без изменения settled geometry**

```css
@keyframes hero-entry-field {
  from { opacity: 0; transform: scale(var(--hero-entry-field-scale, 1.045)); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes hero-entry-header {
  from { opacity: 0; filter: blur(5px); transform: translate3d(0, -10px, 0); }
  to { opacity: 1; filter: blur(0); transform: translate3d(0, 0, 0); }
}

@keyframes hero-entry-copy {
  from { opacity: 0; filter: blur(8px); transform: translate3d(-50%, calc(-50% + 38px), -70px) scale(0.94); }
  to { opacity: 1; filter: blur(0); transform: translate3d(-50%, -50%, 0) scale(1); }
}

@keyframes hero-entry-secondary {
  from { opacity: 0; transform: translate3d(0, 10px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
```

- [ ] **Step 5: Добавить responsive amplitude**

```css
@media (max-width: 1099px) {
  .cosmic-runway[data-intro="preparing"] .cosmic-canvas { transform: scale(1.036); }
  .cosmic-runway[data-intro="entering"] .cosmic-canvas {
    --hero-entry-field-scale: 1.036;
  }
}

@media (max-width: 700px) {
  .cosmic-runway[data-intro="preparing"] .cosmic-canvas { transform: scale(1.026); }
  .cosmic-runway[data-intro="entering"] .cosmic-canvas {
    --hero-entry-field-scale: 1.026;
  }
}
```

Reduced motion не получает `preparing`/`entering`, потому что `getInitialHeroEntryPhase(true, scrollY)` сразу возвращает `settled`; существующий reduced-motion CSS остаётся без изменений.

- [ ] **Step 6: Запустить GREEN и проверить отсутствие cascade-impact**

Run: `npm test -- --run src/cosmic/heroEntryContract.test.ts`

Expected: integration and CSS contract tests PASS.

Run: `git diff --check`

Expected: no output, exit 0. Проверить, что отсутствуют изменения `:root`, `html`, `body`, `#root`, `.cosmic-hero`, Three.js и shader files.

---

### Task 4: Полная проверка и визуальная калибровка

**Files:**
- Modify only if captures require calibration: `src/styles.css`
- Update tests only if behavior changes: `src/cosmic/heroEntryMotion.test.ts`

**Interfaces:**
- Consumes: completed lifecycle and CSS choreography.
- Produces: verified desktop/mobile/reduced-motion implementation.

- [ ] **Step 1: Запустить полный test suite**

Run: `npm test -- --run`

Expected: all tests PASS, 0 failures.

- [ ] **Step 2: Собрать production bundle**

Run: `npm run build`

Expected: exit 0 with TypeScript and Vite build complete.

- [ ] **Step 3: Запустить локальный preview и снять состояния**

Run: `npm run dev -- --host 127.0.0.1 --port 5185`

Capture at 1440×900 and 390×844:

- initial black/preparing frame;
- field-visible frame около 500 ms;
- copy-entering frame около 1050 ms;
- settled frame после 2200 ms;
- early-scroll frame;
- `?reduced-motion` frame.

Expected: settled frame совпадает по layout с baseline; early scroll не сбрасывает Hero progress; mobile не обрезает header/title.

- [ ] **Step 4: Проверить runtime**

Проверить browser console после load, early scroll, resize и reduced-motion route.

Expected: no errors; один intro timer и один временный scroll listener очищаются после `settled`.

- [ ] **Step 5: Финальный diff audit**

Run: `git status --short`

Run: `git diff -- src/components/CosmicHero.tsx src/cosmic/heroEntryMotion.ts src/cosmic/heroEntryMotion.test.ts src/styles.css`

Expected: только утверждённый lifecycle, tests и scoped CSS; никаких изменений текста, layout или Three.js.
