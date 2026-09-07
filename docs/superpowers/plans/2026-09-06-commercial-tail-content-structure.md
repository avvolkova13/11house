# ElevenHouse Commercial Tail Content Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перестроить post-Hero коммерческую последовательность ElevenHouse от блока сравнения до финального CTA по утверждённому сценарию, сохранив locked Hero и WebGL motion тарифов.

**Architecture:** Существующие React-секции остаются отдельными смысловыми модулями. `ProductProof` объединяет onboarding и five-screen product story; `UnifiedWorkspace` становится статическим двухсторонним сравнением; новый `PractitionerResults` вставляется перед тарифами. Каждый task проходит отдельный RED → GREEN цикл.

**Tech Stack:** React 19, TypeScript, vanilla scoped CSS, Three.js pricing scene без изменений, Vitest, Vite, local browser QA.

## Global Constraints

- Locked Hero и вся часть страницы выше `Больше времени на клиентов. Меньше — на рутину.` не меняются.
- В `OneClientStory` меняются только две строки и четыре показателя сокращаются до трёх.
- `CosmicHero`, `src/cosmic/**`, Hero scroll architecture, package/config files и существующие root/body/global selectors не изменяются.
- В `App.tsx` разрешено только добавить `PractitionerResults` между `UnifiedWorkspace` и `PricingSection`; вызов `<CosmicHero />` и его порядок остаются неизменными.
- WebGL pricing motion, lifecycle, shaders, timing `4500 / 1350 / 5850` и controls не изменяются.
- Новые стили — только scoped selectors затронутых post-Hero секций и нового `.practitioner-results`.
- Product imagery берётся только из `public/assets/product-screenshots/*`.
- Старый сайт `https://elevenhouse.ai` используется только как источник фактов, отзывов, контактов и ссылок; визуал не копируется.
- Отзывы используют монограммы `МК`, `ДЛ`, `ВМ`; фотографии не генерируются и не подменяются.
- Commit, push, publish и dependency install запрещены без отдельного разрешения пользователя.

## File map

- `src/sections/landingCopy.test.ts` — copy, counts, removals and source-order contracts.
- `src/sections/OneClientStory.tsx` — exact copy replacements and three outcomes.
- `src/sections/ProductProof.tsx` — four-step onboarding plus five-screen process.
- `src/sections/AiRoutine.tsx` — approved five-step causal flow.
- `src/sections/UnifiedWorkspace.tsx` — external stack versus ElevenHouse.
- `src/sections/PractitionerResults.tsx` — three sourced practitioner stories.
- `src/sections/FinalCta.tsx` — confirmed registration/contact/document links.
- `src/App.tsx` — one import and one insertion only.
- `src/styles.css` — scoped layout, responsive and reduced-motion rules.

---

### Task 1: Исправить comparison copy и оставить три результата

**Files:**
- Modify: `src/sections/landingCopy.test.ts`
- Modify: `src/sections/OneClientStory.tsx`

**Interfaces:**
- Produces: five existing comparison rows and exactly three evidence stats.

- [ ] **Step 1: Write the failing copy test**

Заменить старые ожидания в `compares the five workflow stages...`:

```ts
expect(clientStorySource).toContain('Оплата переводом «на карту»')
expect(clientStorySource).toContain('Клиент пропадает после первой консультации')
expect(clientStorySource).not.toContain('Время согласуете в переписке')
expect(clientStorySource).not.toContain('После первой консультации клиент пропадает')
expect(clientStorySource).not.toContain("value: '24/7'")
expect(clientStorySource.match(/value:/g) ?? []).toHaveLength(3)
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: FAIL on the two old strings and fourth metric.

- [ ] **Step 3: Implement the exact replacement**

```ts
{
  stage: 'Запись и оплата',
  manual: 'Оплата переводом «на карту»',
  elevenHouse: 'Запись, предоплата и платёжная ссылка работают в одном процессе',
},
{
  stage: 'Повторный контакт',
  manual: 'Клиент пропадает после первой консультации',
  elevenHouse: 'Астрокалендарь и воронки находят повод вернуть клиента',
},

const evidenceStats = [
  { value: '−12 ч', label: 'рутины в неделю' },
  { value: '×3', label: 'быстрее готов разбор' },
  { value: '+34%', label: 'повторных продаж' },
]
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: all `landingCopy` tests PASS.

---

### Task 2: Объединить onboarding и five-screen product story

**Files:**
- Modify: `src/sections/landingCopy.test.ts`
- Modify: `src/sections/ProductProof.tsx`
- Verify: `src/sections/sectionMotion.test.ts`

**Interfaces:**
- Produces: exported `onboardingSteps` array with 4 items.
- Produces: exported `productScenes` array with 5 items.
- Preserves: `getSectionProgress`, `getScenePosition`, one RAF listener lifecycle and reduced motion.

- [ ] **Step 1: Write the failing product-story test**

Add imports:

```ts
import { onboardingSteps, productScenes } from './ProductProof'
```

Add test:

```ts
it('uses four onboarding steps followed by five benefit-first product scenes', () => {
  expect(onboardingSteps.map((step) => step.title)).toEqual([
    'Зарегистрировались и заполнили профиль.',
    'Добавили услуги и опубликовали личную страницу.',
    'Настроили запись, оплату и автоматизацию.',
    'Проводите консультации, а система напоминает клиентам и помогает возвращать их.',
  ])
  expect(productScenes).toHaveLength(5)
  expect(productScenes.map((scene) => scene.eyebrow)).toEqual([
    'Карта и AI-черновик',
    'Клиенты и история',
    'Услуги и личная страница',
    'Запись и оплаты',
    'Аналитика',
  ])
})
```

Extend raw-source checks:

```ts
expect(sectionSource).toContain('Настройте кабинет за четыре шага')
expect(sectionSource).toContain('От построения карты до оплаты —<br />один рабочий процесс.')
expect(sectionSource).toContain('И ещё внутри: астрокалендарь, воронки, контент и подписки')
expect(sectionSource).not.toContain('Расчёты и профессиональный контекст')
expect(sectionSource).not.toContain('Запись и консультация')
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: FAIL because `onboardingSteps` is absent and `productScenes` contains three old scenes.

- [ ] **Step 3: Define the four real-interface onboarding steps**

```ts
export const onboardingSteps = [
  { index: '01', title: 'Зарегистрировались и заполнили профиль.', src: '/assets/product-screenshots/eh-p05-products.png', alt: 'Профиль пользователя в верхней панели ElevenHouse', crop: 'profile' },
  { index: '02', title: 'Добавили услуги и опубликовали личную страницу.', src: '/assets/product-screenshots/eh-p05-products.png', alt: 'Каталог услуг ElevenHouse', crop: 'products' },
  { index: '03', title: 'Настроили запись, оплату и автоматизацию.', src: '/assets/product-screenshots/eh-p04-funnel.png', alt: 'Сценарий автоматизации ElevenHouse', crop: 'automation' },
  { index: '04', title: 'Проводите консультации, а система напоминает клиентам и помогает возвращать их.', src: '/assets/product-screenshots/eh-p09-journal.png', alt: 'Астродневник для сопровождения клиента между консультациями', crop: 'followup' },
] as const
```

- [ ] **Step 4: Replace product scenes with five benefit-first scenes**

```ts
export const productScenes = [
  {
    index: '01', eyebrow: 'Карта и AI-черновик',
    title: 'Данные превращаются в основу разбора без ручного переноса.',
    copy: 'Система строит карту и передаёт контекст в AI-черновик, который вы проверяете и дополняете.',
    src: '/assets/product-screenshots/eh-p04-funnel.png', alt: 'Воронка с построением натальной карты и AI-черновиком трактовок', crop: 'map-ai',
  },
  {
    index: '02', eyebrow: 'Клиенты и история',
    title: 'Контекст клиента остаётся рядом с каждой следующей задачей.',
    copy: 'Поиск, статусы и рабочая область помогают вести клиентскую базу без отдельной таблицы.',
    src: '/assets/product-screenshots/eh-p02-clients.png', alt: 'Раздел клиентов ElevenHouse с поиском и статусами', crop: 'clients',
  },
  {
    index: '03', eyebrow: 'Услуги и личная страница',
    title: 'Клиент понимает формат и сразу переходит к следующему шагу.',
    copy: 'Консультации, курсы и сопровождение собраны в одном каталоге с ценой и статусом публикации.',
    src: '/assets/product-screenshots/eh-p05-products.png', alt: 'Каталог опубликованных и черновых продуктов ElevenHouse', crop: 'products',
  },
  {
    index: '04', eyebrow: 'Запись и оплаты',
    title: 'Запись, встреча и деньги связаны с одним клиентом.',
    copy: 'Календарь хранит подтверждённую встречу, а финансовый раздел показывает оплату и вывод средств.',
    src: '/assets/product-screenshots/eh-p01-calendar.png',
    secondarySrc: '/assets/product-screenshots/eh-p03-finance.png', alt: 'Подтверждённая запись и финансовый раздел ElevenHouse', crop: 'booking-payment',
  },
  {
    index: '05', eyebrow: 'Аналитика',
    title: 'Доходы и выплаты видны без ручной сверки.',
    copy: 'Финансовые показатели и история операций дают понятную картину движения денег.',
    src: '/assets/product-screenshots/eh-p03-finance.png', alt: 'Финансовые показатели и история операций ElevenHouse', crop: 'analytics',
  },
] as const
```

- [ ] **Step 5: Render two chapters and adapt scroll progress**

Inside `.product-proof__sticky`, render in this order:

```tsx
<header className="product-proof__heading">
  <span>04 · Настройка кабинета</span>
  <h2 id="product-proof-title">Настройте кабинет<br />за четыре шага.</h2>
</header>
<ol className="product-proof__onboarding">
  {onboardingSteps.map((step) => (
    <li data-onboarding-step key={step.index}>
      <span>{step.index}</span><p>{step.title}</p>
      <figure className={`product-proof__fragment product-proof__fragment--${step.crop}`}>
        <img src={step.src} alt={step.alt} loading="lazy" />
      </figure>
    </li>
  ))}
</ol>
<header className="product-proof__process-heading">
  <p>Единый процесс</p>
  <h3>От построения карты до оплаты —<br />один рабочий процесс.</h3>
</header>
```

Then render the existing progress index and stage from five `productScenes`; render `secondarySrc` only for scene `04`. End with:

```tsx
<p className="product-proof__more">
  И ещё внутри: астрокалендарь, воронки, контент и подписки,
  справочник и дополнительные системы расчётов.
</p>
```

Use one shared normalized timeline:

```ts
const onboardingProgress = clamp01(progress / 0.28)
const processProgress = clamp01((progress - 0.28) / 0.72)
const { index, local } = getScenePosition(processProgress, productScenes.length)
section.style.setProperty('--onboarding-progress', onboardingProgress.toFixed(4))
section.style.setProperty('--proof-progress', processProgress.toFixed(4))
section.style.setProperty('--process-heading-opacity', String(clamp01((progress - 0.24) / 0.08)))
```

- [ ] **Step 6: Verify GREEN**

Run: `npm test -- src/sections/landingCopy.test.ts src/sections/sectionMotion.test.ts --run`

Expected: copy/product counts and motion helper tests PASS.

---

### Task 3: Довести AI-flow и заменить workspace viewer на сравнение

**Files:**
- Modify: `src/sections/landingCopy.test.ts`
- Modify: `src/sections/AiRoutine.tsx`
- Modify: `src/sections/UnifiedWorkspace.tsx`

**Interfaces:**
- Produces: exactly five causal AI steps.
- Produces: six `externalTools` and six `elevenHouseTools`.
- Removes: `useState`, tabs and screenshot viewer from `UnifiedWorkspace`.

- [ ] **Step 1: Write the failing AI/workspace test**

```ts
expect(sectionSource).toContain('Клиент оставил данные')
expect(sectionSource).toContain('Система построила карту')
expect(sectionSource).toContain('AI подготовил черновик')
expect(sectionSource).toContain('Астролог проверил и дополнил')
expect(sectionSource).toContain('Клиент получил результат')
expect(sectionSource).toContain('≈ 5 280 ₽/мес')
expect(sectionSource).toContain('Данные переходят между этапами без ручного переноса')
expect(sectionSource).not.toContain('unified-workspace__index')
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: FAIL on past-tense AI copy and static comparison.

- [ ] **Step 3: Update `AiRoutine`**

```ts
const routineSteps = [
  'Клиент оставил данные',
  'Система построила карту',
  'AI подготовил черновик',
  'Астролог проверил и дополнил',
  'Клиент получил результат',
]
```

Keep the exact lead:

```tsx
<p>AI считает и готовит черновик по вашим трактовкам и в вашем тоне. Последнее слово всегда за вами.</p>
```

- [ ] **Step 4: Replace `UnifiedWorkspace` data and JSX**

```ts
const externalTools = [
  ['Программа расчётов', '≈ 750 ₽/мес'],
  ['Таблица или CRM', '≈ 1 490 ₽/мес'],
  ['Taplink или сайт', '≈ 990 ₽/мес'],
  ['Бот и рассылки', '≈ 1 290 ₽/мес'],
  ['Онлайн-запись', '≈ 760 ₽/мес'],
  ['Платёжный сервис', 'договор + комиссия'],
] as const

const elevenHouseTools = [
  'Расчёты и дополнительные системы',
  'CRM, запись и календарь',
  'Личная страница и продукты',
  'Воронки и AI-автоматизация',
  'Оплаты, кошелёк и выплаты',
  'Контент, коммуникации и сопровождение',
] as const
```

Render:

```tsx
<div className="unified-workspace__comparison">
  <article className="unified-workspace__stack">
    <header><span>Обычная связка</span><strong>6 сервисов</strong></header>
    <ul>{externalTools.map(([name, price]) => <li key={name}><span>{name}</span><small>{price}</small></li>)}</ul>
    <footer><span>Примерная сумма</span><strong>≈ 5 280 ₽/мес</strong></footer>
  </article>
  <div className="unified-workspace__merge" aria-hidden="true"><i /><span>один кабинет</span><i /></div>
  <article className="unified-workspace__stack unified-workspace__stack--product">
    <header><span>ElevenHouse</span><strong>Всё связано</strong></header>
    <ul>{elevenHouseTools.map((item) => <li key={item}>{item}</li>)}</ul>
    <footer><span>Данные переходят между этапами без ручного переноса</span></footer>
  </article>
</div>
```

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: all AI/workspace copy assertions PASS.

---

### Task 4: Добавить три результата практиков и разрешённую вставку в App

**Files:**
- Modify: `src/sections/landingCopy.test.ts`
- Create: `src/sections/PractitionerResults.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `PractitionerResults()` and exactly three stories.
- Consumes: sourced identities/results/quotes from `https://elevenhouse.ai`.

- [ ] **Step 1: Write failing story and order contracts**

Add raw source:

```ts
const practitionerSource = Object.values(import.meta.glob('./PractitionerResults.tsx', {
  eager: true, query: '?raw', import: 'default',
})).join('\n')
const appSource = readRaw(import.meta.glob('../App.tsx', {
  eager: true, query: '?raw', import: 'default',
}))
```

Add test:

```ts
expect(practitionerSource.match(/monogram:/g) ?? []).toHaveLength(3)
expect(practitionerSource).toContain('Марина К.')
expect(practitionerSource).toContain('Дарья Л.')
expect(practitionerSource).toContain('Виктор М.')
expect(practitionerSource).toContain('+33% клиентов')
expect(practitionerSource).toContain('18 продаж на автопилоте')
expect(practitionerSource).toContain('+47% к среднему чеку')

const workspacePosition = appSource.indexOf('<UnifiedWorkspace />')
const resultsPosition = appSource.indexOf('<PractitionerResults />')
const pricingPosition = appSource.indexOf('<PricingSection />')
expect(workspacePosition).toBeLessThan(resultsPosition)
expect(resultsPosition).toBeLessThan(pricingPosition)
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: FAIL because the component and App insertion do not exist.

- [ ] **Step 3: Create `PractitionerResults.tsx`**

Use this exact data:

```ts
const practitionerStories = [
  { monogram: 'МК', name: 'Марина К.', speciality: 'Астролог · 7 лет практики', result: '+33% клиентов', quote: 'Разбор занимал у меня весь вечер. Теперь AI собирает черновик за пару минут по моим же трактовкам, я только довожу его своим тоном.' },
  { monogram: 'ДЛ', name: 'Дарья Л.', speciality: 'Нумерология · Матрица судьбы', result: '18 продаж на автопилоте', quote: 'Уехала в отпуск на две недели, а воронка сама продала разборы: собрала даты рождения, приняла оплаты и выдала материалы.' },
  { monogram: 'ВМ', name: 'Виктор М.', speciality: 'Human Design', result: '+47% к среднему чеку', quote: 'Платёжные ссылки и предоплата сделали запись серьёзнее — клиенты перестали пропадать, а средний чек вырос.' },
] as const
```

Render one `<section className="practitioner-results">`, one semantic heading, and three `<article className="practitioner-results__story">`. Each story renders result, `<blockquote>`, monogram with `aria-hidden="true"`, name and speciality.

- [ ] **Step 4: Insert the component without changing Hero**

```tsx
import { PractitionerResults } from './sections/PractitionerResults'

<UnifiedWorkspace />
<PractitionerResults />
<PricingSection />
```

- [ ] **Step 5: Verify GREEN and App boundary**

Run:

```bash
npm test -- src/sections/landingCopy.test.ts --run
git diff -U0 -- src/App.tsx
```

Expected: tests PASS; App diff contains only one import and one insertion after `UnifiedWorkspace`.

---

### Task 5: Довести final CTA links и сохранить pricing/FAQ contracts

**Files:**
- Modify: `src/sections/landingCopy.test.ts`
- Modify: `src/sections/FinalCta.tsx`
- Verify: `src/sections/pricingData.ts`
- Verify: `src/sections/FaqSection.tsx`

**Interfaces:**
- Produces: confirmed registration/contact/document links.
- Preserves: prices `0 / 1990 / 4990`, commissions `8 / 4 / 2`, Pro emphasis and 8 FAQ items.

- [ ] **Step 1: Write failing CTA/footer contract**

```ts
expect(sectionSource).toContain('https://app.elevenhouse.ai/auth?mode=register')
expect(sectionSource).toContain('mailto:hello@elevenhouse.ai')
expect(sectionSource).toContain('mailto:support@elevenhouse.ai')
expect(sectionSource).toContain('https://t.me/elevenhouse_support')
expect(sectionSource).toContain('href="/privacy"')
expect(sectionSource).toContain('href="/personal-data-processing"')
expect(sectionSource).not.toContain('7700000000')
expect(sectionSource).not.toContain('1230000000000')
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: FAIL because current final CTA lacks confirmed footer links and auth mode.

- [ ] **Step 3: Implement the exact CTA/footer**

```tsx
<p>Без банковской карты</p>
<a href="https://app.elevenhouse.ai/auth?mode=register">
  Создать кабинет бесплатно <span aria-hidden="true">↗</span>
</a>
<footer>
  <div className="final-cta__brand"><strong>ElevenHouse</strong><span>ASTROLOGER WORKSPACE</span></div>
  <nav aria-label="Контакты">
    <a href="mailto:hello@elevenhouse.ai">hello@elevenhouse.ai</a>
    <a href="mailto:support@elevenhouse.ai">Поддержка</a>
    <a href="https://t.me/elevenhouse_support">Telegram</a>
  </nav>
  <nav aria-label="Документы">
    <a href="/privacy">Конфиденциальность</a>
    <a href="/personal-data-processing">Обработка данных</a>
  </nav>
</footer>
```

- [ ] **Step 4: Add pricing/FAQ assertions**

Import `pricingPlans` and verify:

```ts
expect(pricingPlans.map(({ price, commission }) => [price, commission])).toEqual([
  ['0 ₽', '8%'],
  ['1 990 ₽', '4%'],
  ['4 990 ₽', '2%'],
])
expect(pricingPlans[1].key).toBe('pro')
expect(faqSource.match(/question:/g) ?? []).toHaveLength(8)
```

Do not modify pricing or FAQ production files when these assertions already pass.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/sections/landingCopy.test.ts src/sections/pricingData.test.ts src/sections/PricingSection.test.tsx --run`

Expected: CTA, pricing and FAQ contracts PASS; pricing motion tests remain unchanged.

---

### Task 6: Build the scoped visual and responsive system

**Files:**
- Modify: `src/sections/landingCopy.test.ts`
- Modify: `src/styles.css` only under post-Hero section selectors.

**Interfaces:**
- Consumes: class names from Tasks 2–5.
- Produces: desktop, tablet, mobile and reduced-motion layouts.
- Preserves: all pricing orbit/WebGL rules.

- [ ] **Step 1: Write failing CSS source assertions**

Load `src/styles.css?raw` and verify:

```ts
expect(stylesSource).toContain('.product-proof__onboarding')
expect(stylesSource).toContain('.product-proof__process-heading')
expect(stylesSource).toContain('.unified-workspace__comparison')
expect(stylesSource).toContain('.practitioner-results__stories')
expect(stylesSource).toContain('.final-cta__brand')
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/sections/landingCopy.test.ts --run`

Expected: FAIL because the new selectors are absent.

- [ ] **Step 3: Implement desktop composition**

- Extend `.product-proof` scroll runway to fit two chapters.
- Use a four-column gapless onboarding index with real screenshot crops.
- Fade onboarding out and process heading/stage in through `opacity` and `transform` variables only.
- Keep five product scenes inside the existing perspective stage.
- Render `.unified-workspace__comparison` as `1fr / 92px / 1fr` with the ElevenHouse side as the dominant dark surface.
- Render `.practitioner-results__stories` as an asymmetric `1.2fr / 0.9fr / 1.05fr` editorial grid.
- Expand final footer into brand, contact nav and document nav without moving the CTA above it.

The exact selectors to add are `.product-proof__onboarding`, `.product-proof__onboarding li`, `.product-proof__fragment`, `.product-proof__process-heading`, `.product-proof__more`, `.proof-scene__secondary`, `.unified-workspace__comparison`, `.unified-workspace__stack`, `.unified-workspace__merge`, `.practitioner-results`, `.practitioner-results__heading`, `.practitioner-results__stories`, `.practitioner-results__story`, `.practitioner-results__monogram`, `.final-cta__brand`, and `.final-cta footer nav`.

Values follow existing section gutters `clamp(26px, 4.2vw, 68px)`, warm accent `#c79b39/#d0a439`, dark surface `#07080e–#11121a`, and current typography scale. Do not add new global variables or selectors.

- [ ] **Step 4: Implement tablet/mobile/reduced-motion behavior**

At `max-width: 900px`:

```css
.product-proof__onboarding { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.product-proof__onboarding,
.product-proof__process-heading,
.product-proof__stage,
.product-proof__more { position: relative; inset: auto; opacity: 1; }
.unified-workspace__comparison,
.practitioner-results__stories { grid-template-columns: 1fr; }
```

At `max-width: 560px`:

```css
.product-proof__onboarding { grid-template-columns: 1fr; }
.product-proof__fragment img,
.proof-scene__frame img { width: 190%; max-width: none; transform: translate3d(-34%, -10%, 0); }
.practitioner-results { padding-right: 16px; padding-left: 16px; }
.final-cta footer { position: relative; right: auto; bottom: auto; left: auto; grid-template-columns: 1fr; margin-top: 90px; }
```

Under `prefers-reduced-motion: reduce`, force the onboarding/process layers visible and static; do not alter existing pricing reduced-motion rules.

- [ ] **Step 5: Verify GREEN, build and diff syntax**

Run:

```bash
npm test -- src/sections/landingCopy.test.ts --run
npm run build
git diff --check
```

Expected: source contract PASS, build exit `0`, no whitespace errors.

---

### Task 7: Final functional, visual, responsive and locked-boundary QA

**Files:**
- Verify: all files in File map.
- Modify: only scoped post-Hero section files if QA reveals defects.

**Interfaces:**
- Produces: completed implementation with captured evidence.

- [ ] **Step 1: Run full automated verification**

```bash
npm test -- --run
npm run build
```

Expected: zero failed tests; TypeScript and Vite exit `0`. Existing bundle-size warning may remain; no new errors are accepted.

- [ ] **Step 2: Start local QA server**

Run: `npm run dev -- --host 127.0.0.1 --port 5185`

Expected: Vite serves the landing. Enter the post-Hero sequence through natural page interaction; do not fake visibility with DOM mutation.

- [ ] **Step 3: Capture and inspect `1440×900`, `1024×768`, `390×844`**

For each viewport verify:

- page content above `OneClientStory` is unchanged;
- three outcomes, four onboarding steps and five product scenes are present;
- mobile product images show a large action crop;
- AI flow has five causal steps;
- workspace is a readable two-sided comparison;
- three practitioner cards use monograms and sourced copy;
- pricing WebGL hold/transition and controls still work;
- all eight FAQ entries and final footer links are reachable;
- every changed section has `scrollWidth === clientWidth`.

- [ ] **Step 4: Verify reduced motion and accessibility**

Use `?reduced-motion` and keyboard navigation. Confirm all product content is statically visible, heading hierarchy is valid, meaningful images have descriptive alt text, monograms are decorative, focus remains visible, and pricing `aria-pressed`, live status, canvas `aria-hidden` and fallback behavior are unchanged.

- [ ] **Step 5: Verify locked boundary**

```bash
git diff --check
git diff -- src/components/CosmicHero.tsx src/cosmic src/main.tsx index.html package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json
git diff -U0 -- src/App.tsx
```

Expected: locked files/config/dependencies have empty diff; `App.tsx` contains only the `PractitionerResults` import and insertion.

- [ ] **Step 6: Stop without commit, push or publish**

Report changed files, RED → GREEN evidence, full tests/build, three viewport captures, reduced-motion/accessibility results, locked-boundary result and any pre-existing out-of-scope issue.
