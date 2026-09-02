# Phase 4: integration architecture and implementation contract

Статус: proposal only. Код, зависимости и Hero не изменялись.

## 1. Фактический Hero runway

Владелец высоты: `.cosmic-runway` в `src/styles.css`, `position: relative; height: 100000px`.

Причина: не визуальная высота, а большой scroll budget для псевдобесконечного travel. `.cosmic-hero` внутри него имеет `position: sticky; top: 0; height: 100svh; min-height: 620px; overflow: hidden`. Canvas `.cosmic-canvas` имеет `position: absolute; inset: 0; width/height: 100%`, поэтому он не fixed, а absolute внутри sticky viewport.

`CosmicHero.tsx` и `CosmicScene.ts` напрямую читают `window.scrollY`. React copy progress увеличивается через `delta / 760`, а Three.js накапливает signed scroll velocity. При `scrollY < maxScroll * .16` или `scrollY > maxScroll * .84` `centerScrollRunway()` переносит окно в `maxScroll * .5` через `window.scrollTo`, сохраняя travel-поток.

Hero визуально заканчивается только в конце `.cosmic-runway`, то есть сейчас следующая DOM-секция после Hero будет достижима после почти всего 100000px диапазона. Это создаёт giant dead scroll area для будущего лендинга. Уменьшение runway меняет `maxScroll`, recenter thresholds, момент программного `scrollTo`, scroll restoration и взаимодействие с любым следующим sticky section. Нельзя тестировать такую гипотезу изменением Hero в этой фазе.

На mobile sticky viewport использует `100svh`, breakpoint Hero CSS - 700px, renderer снижает DPR ниже 1100px. Safari-риск: динамические browser bars влияют на viewport units; `window.scrollTo` во время восстановления истории может дать скачок; nested sticky containers могут конфликтовать с momentum scrolling.

## 2. HERO EXIT CONTRACT

Architecture A owns the page boundary, not the visual scene. The contract is state-based; corridor distances remain calibration parameters and no arbitrary pixel values are selected before live measurement.

### Ownership

`PageScrollCoordinator` owns page-level section boundaries and Hero lifecycle state. `HeroScrollAdapter` is the only bridge between page scroll and existing Hero scroll input. Existing Hero camera, velocity feel, copy, shader, render, pointer and composition logic remain untouched except for the smallest abstraction needed to receive the adapter source.

### State machine

`PRE_HERO -> TRAVEL -> EXIT_ARMED -> EXITING -> BELOW_HERO`.

- `PRE_HERO`: page is at or above the Hero entry boundary. Recentring is disabled until the travel corridor is active.
- `TRAVEL`: finite corridor is active. Native page deltas are forwarded through `HeroScrollAdapter`; Hero visual and interaction feel remain equivalent. Recentring is enabled only while the coordinator owns this state.
- `EXIT_ARMED`: calibrated terminal travel boundary is reached and the final Hero state has settled. Recentring is disabled before releasing the page boundary.
- `EXITING`: a downward scroll intent crosses the terminal boundary. The coordinator freezes adapter state, cancels recenter scheduling and yields to natural document scroll into Section 2.
- `BELOW_HERO`: Section 2 or later owns the viewport. Hero recentering, Hero `window.scrollTo` and Hero scroll forwarding are disabled.
- Reverse scroll enters `REENTERING` logically: crossing upward from Section 2 reclaims the adapter, restores the terminal Hero state, then returns to `TRAVEL` with signed reverse deltas. Recentring is re-enabled only after `TRAVEL` is established.

### Finite corridor strategy

The corridor has an opening travel phase, a terminal settle band and an exit handoff band. Its length is derived from desired Hero travel distance, viewport height, copy-stage completion and the minimum clean entry distance for Section 2. Exact pixel calibration is deferred until before/after captures compare idle, forward travel, reverse travel and terminal state against the approved Hero.

### Restoration and hard guarantee

On refresh or browser restoration below the Hero boundary, the coordinator initializes directly in `BELOW_HERO`; it must not recenter, call `window.scrollTo` or replay Hero travel. Restoration inside the corridor initializes the corresponding `TRAVEL` phase without a forced jump. Every recenter callback checks coordinator ownership and state immediately before acting; exit/disposal cancels pending RAFs and timers. No Hero recenter or `window.scrollTo` can fire after `EXITING` or `BELOW_HERO`.

### Mobile

Mobile uses the same ownership/state machine with a separately calibrated shorter corridor, fewer future-section layers, no hover dependency and no competing nested sticky owner. Safari viewport changes refresh coordinator measurements without changing Hero scene values. Reduced motion bypasses travel animation and uses a static/short transition while preserving the no-recenter-after-exit guarantee.

## 3. Integration approaches

### A. Compatibility boundary refactor - recommended, approval required

Сохранить визуальный output и motion contract Hero, но вынести ownership scroll boundary из giant page runway в отдельный page coordinator. Hero получит finite, специально измеренный corridor, а его travel/recenter state будет работать от локального scroll progress/velocity adapter. Existing canvas, scene tuning, copy и composition сохраняются; меняется только технический boundary layer.

Files likely changed: `src/App.tsx`, `src/styles.css`, новый scoped page coordinator и adapter; потенциально `src/components/CosmicHero.tsx` и `src/cosmic/CosmicScene.ts` для инъекции scroll source. Hero DOM/CSS/JS/WebGL changes: возможно да, но только boundary/API portions. Appearance: должен остаться pixel-equivalent. Motion timing: должен остаться behavior-equivalent, требуется before/after visual QA.

Document height: finite Hero corridor плюс sections, без 100000px dead range. Compatible with future sticky storytelling because coordinator owns section boundaries. Mobile: shorter corridor and no nested competing sticky; reduced-motion stays static. Risks: highest implementation risk, Safari scroll restoration, potential subtle timing drift. Requires explicit approval before any code.

### B. Keep Hero implementation, add a page-level transition after existing runway

Не трогать Hero files, а рендерить следующие sections через отдельную page shell after `.cosmic-runway`.

Files changed: `src/App.tsx` and new strictly scoped section files/CSS. Hero DOM/CSS/JS/WebGL and appearance: unchanged. Motion timing: unchanged. Document height: 100000px plus sections, so the user still travels through a giant dead range before content. Sticky storytelling below remains technically possible, but poor UX and heavy scroll restoration cost. Mobile inherits the same dead range. Risk: fails landing requirement despite maximal Hero safety.

### C. Separate page route or alternate entry for the landing body

Keep Hero as one route/entry and place the rest of the landing in another route/entry, with an explicit link/transition between them.

Files changed: `src/App.tsx`, `main.tsx`, routing/entry configuration, new page components. Hero implementation and appearance can remain unchanged; no direct DOM coupling. Document height per route is sane, but the approved requirement says the new design begins directly after Hero, so this breaks continuity and requires routing/URL/product decision. Mobile is simpler per route, but navigation and scroll restoration between routes become product concerns. Risk: not an acceptable direct continuation without additional approval.

## Recommendation

Выбираю A как единственную архитектуру, которая одновременно сохраняет непрерывность, убирает dead scroll и поддерживает sticky storytelling. Приоритет изменений: `PageScrollCoordinator -> HeroScrollAdapter -> existing Hero logic`. CosmicScene/WebGL не рефакторить сверх минимальной scroll-source abstraction. Визуальный и interaction feel Hero сохраняются в `TRAVEL`; новый page-exit boundary является изолированным, намеренно новым поведением. Реализацию не начинаю до отдельного approval.

## 4. Motion ownership and dependency decision

| Stack | Подходит | Плюсы | Минусы / cost | Решение |
|---|---|---|---|---|
| Native scroll + RAF + IntersectionObserver | S2, S4, часть S5 | уже соответствует проекту, минимальный bundle, полный контроль lifecycle | pinned scrub и resize bookkeeping придётся поддерживать вручную | base layer и fallback |
| GSAP + ScrollTrigger | Section 3 pinned story; Section 4 if continuous from final Section 3 state | mature scrub/pin, refresh, timelines, clear scene orchestration | новая dependency, bundle cost, cleanup/context discipline | proposal only; defer install |
| Lenis | потенциально global smooth scroll | inertia | меняет scroll semantics, может конфликтовать с locked Hero и Safari restoration | не использовать на этом этапе |
| Motion | isolated DOM micro-interactions | удобные state transitions | отсутствует, не нужен для WebGL, не смешивать с Three.js scene tree | не добавлять сейчас |
| React Three Fiber | React-owned new WebGL scenes | declarative scene composition | существующий Three.js уже владеет renderer; migration overhead | не оправдан |

Recommendation: existing native system owns Hero and Hero boundary. GSAP/ScrollTrigger is proposed for Section 3 pinned storytelling. If Section 4 is continuous from the final Section 3 state, it remains under that same GSAP timeline/ownership, with no mid-transition handoff to unrelated native RAF. Section 5 dependency decision is deferred until Stage A is evaluated. Lenis, Motion and R3F are not used. Do not install GSAP yet.

## 5. Implementation tokens for sections below Hero

Tokens are proposal only and must not be placed in global `:root` until Hero impact is reviewed.

### Layout

- max content box width: 1280px, excluding page gutters;
- desktop gutters: clamp(32px, 5vw, 80px);
- tablet gutters: 32px;
- mobile gutters: 20px;
- text column: 42-64ch for body, 8-11 columns for display when wide;
- section rhythm: 160-240px desktop, 96-144px tablet, 72-112px mobile;
- grid: 12-column editorial desktop, 6-column tablet, single-column mobile;
- breakpoints: existing 700px must remain untouched for Hero; new sections may use 1100px and 700px only after cascade audit.

### Typography

Do not replace Hero typography. Until a font is explicitly approved, sections use the existing project stack as temporary baseline.

- display: clamp(3.25rem, 8vw, 8rem), line-height .88-.98;
- section heading: clamp(2.25rem, 5vw, 5rem), line-height .94-1.04;
- body: clamp(1rem, 1.25vw, 1.25rem), line-height 1.45-1.6;
- labels: .7-.85rem, line-height 1.2, only for semantic UI state;
- weights: 400 display/body, 500-600 only for hierarchy;
- max line length: 65ch body, 18-26ch display where intentional;
- no random Google font and no font dependency without approval.

### Color roles

Extract from existing Hero/product before coding. Provisional semantic roles, not global tokens:

- `--section-background`: Hero-compatible near-black/navy;
- `--section-elevated`: slightly lifted blue-black;
- `--section-text-primary`: cool off-white;
- `--section-text-secondary`: desaturated cool gray;
- `--section-text-subtle`: low-contrast slate;
- `--section-border`: translucent cool-white;
- `--section-accent-primary`: Hero's existing luminous accent;
- `--section-accent-secondary`: omit unless a real product state requires it;
- success/warning/error: product UI semantics only, never decoration.

No separate purple SaaS palette.

### Surface system

- primary panel radius: 24px;
- secondary UI radius: 12px;
- small control radius: 8px;
- border: 1px solid low-opacity cool-white, used only to define hierarchy;
- transparency: 0.06-0.16 for dark surfaces;
- blur: only where layer separation requires it, never as constant texture;
- shadows: tinted toward existing navy, subtle and directional;
- gradients: controlled, localized, mostly for depth/pricing materiality.

### Depth levels

- D0: background plane;
- D1: ambient terrain/atmosphere;
- D2: interface plane;
- D3: focused product object;
- D4: active state or narrative anchor.

No arbitrary z-transform values outside these semantic levels without a scene-specific reason.

## 6. Product UI fidelity contract

Product screenshots are the UI source of truth. Marketing animation may change crop, camera, scale, spatial position, layer visibility, focus, mask and transition. It must not invent a redesigned CRM, redesigned calendar, new controls, prettier fake product states, fictional fields or fictional metrics.

Marketing composition may be new; the underlying product anatomy may not be fictional. Missing screenshots or data are blockers to fidelity, not invitations to fabricate.

## 7. Approval required before implementation

- approve Architecture A or choose B/C;
- approve any limited Hero boundary/API refactor required by A;
- approve whether GSAP/ScrollTrigger is added, with exact scenes and cost;
- provide product screenshots and business data;
- approve provisional section token layer after Hero cascade audit.
