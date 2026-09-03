# New Brief Copy Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public copy in the existing six-scene client story so it communicates the approved path from offer creation to AI-assisted follow-up without changing visual structure or motion.

**Architecture:** Keep `OneClientStory` as the single source of truth for scene copy. Preserve every scene key, screenshot path, DOM node, CSS class, animation calculation and footer label; replace only the string fields in its `scenes` array and section heading.

**Tech Stack:** React 19, TypeScript, Vite, Vitest.

## Global Constraints

- Change only public strings in `src/sections/OneClientStory.tsx`.
- Preserve the six existing scene keys, order, screenshot paths, crop, DOM anatomy, CSS and motion.
- Do not modify the locked Hero, WebGL, tunnel, scroll helpers or global styles.
- Keep tariff facts faithful to the approved brief: Start includes natal/numerology, calendar, online booking and CRM; video sessions are paid; other calculation systems are paid.
- Describe AI as preparing a draft in the astrologer's interpretations and tone; the astrologer keeps final control.
- Do not add unsupported performance numbers or claim that the funnel screenshot shows execution.
- Do not commit or push without a separate user request.

---

### Task 1: Replace the six-scene public copy

**Files:**
- Modify: `src/sections/OneClientStory.tsx` (the `scenes` array and section `<h2>` only)

**Interfaces:**
- Consumes: existing scene keys, screenshot paths and animation fields.
- Produces: the same `scenes` array shape consumed by the existing renderer.

- [ ] **Step 1: Replace the section heading**

Change only the `<h2>` string to:

```tsx
<h2 id="client-story-title" tabIndex={-1}>
  От первого продукта — к работе с постоянным клиентом.
</h2>
```

- [ ] **Step 2: Replace scene strings without changing structure**

Keep each `key`, `marker`, `src`, `alt` and object order. Replace the string fields with:

```ts
{
  key: 'choice',
  marker: '3.1',
  label: 'Собрали услуги',
  title: 'Начните с формата, который уже можно продать.',
  copy: 'Консультация, разбор, курс или сопровождение — соберите предложение и разместите его на личной странице.',
  note: 'Клиент сразу видит формат, стоимость и следующий шаг.',
}
{
  key: 'context',
  marker: '3.2',
  label: 'Открыли запись',
  title: 'Клиент выбирает время — вы видите весь контекст.',
  copy: 'Запись, клиент и история работы остаются в одном кабинете.',
  note: 'Календарь, онлайн-запись и CRM доступны уже на тарифе «Старт».',
}
{
  key: 'prepare',
  marker: '3.3',
  label: 'Подготовили расчёт',
  title: 'Расчёт готов там же, где данные клиента.',
  copy: 'Натальная карта и нумерология доступны на «Старте»; остальные системы открываются на платных тарифах.',
  note: 'Меньше переключений между сервисами — больше времени на интерпретацию.',
}
{
  key: 'session',
  marker: '3.4',
  label: 'Провели встречу',
  title: 'Консультация начинается из календаря.',
  copy: 'Клиент, время и ссылка на встречу собраны в одной записи.',
  note: 'Видеоконсультации и запись сессий входят в платные тарифы.',
}
{
  key: 'continue',
  marker: '3.5',
  label: 'Продолжили работу',
  title: 'После консультации контакт не теряется.',
  copy: 'В Астродневнике клиент оставляет записи, а вы отвечаете в общем приватном контексте.',
  note: 'Сопровождение продолжается между встречами без разрозненных переписок.',
}
{
  key: 'scenario',
  marker: '3.6',
  label: 'Передали рутину AI',
  title: 'Сценарий ведёт клиента, AI готовит основу.',
  copy: 'Система собирает данные рождения, строит карту, готовит черновик разбора, принимает оплату и возвращает клиента.',
  note: 'AI работает по вашим трактовкам и в вашем тоне. Последнее слово всегда за вами.',
}
```

- [ ] **Step 3: Verify the structural diff**

Run:

```bash
git diff -- src/sections/OneClientStory.tsx
```

Expected: only string literals in the heading and six scene objects differ; no keys, paths, JSX structure or styles change.

### Task 2: Validate copy in the running page

**Files:**
- Review only: `src/sections/OneClientStory.tsx`

- [ ] **Step 1: Run the full test suite**

Run: `npm test -- --run`

Expected: all existing test files pass.

- [ ] **Step 2: Build the production bundle**

Run: `npm run build`

Expected: TypeScript and Vite complete without errors.

- [ ] **Step 3: Check whitespace and working-tree scope**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the intended copy file plus pre-existing uncommitted tunnel/intro work and planning documents appear.

- [ ] **Step 4: Visual copy QA at the local URL**

Open `http://127.0.0.1:5188/`, enter the client-story section and verify:

1. six markers still read `3.1` through `3.6`;
2. each scene keeps its existing screenshot;
3. no heading or note overflows its existing text column on desktop or mobile;
4. the scroll transition remains unchanged;
5. the footer still reads `Один человек` and `Один контекст`.

No code changes are made during this QA step unless a real overflow is observed; if one is observed, stop and report it because CSS/layout changes are outside this copy-only scope.
