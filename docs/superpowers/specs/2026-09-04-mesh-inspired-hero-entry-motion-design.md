# Mesh-inspired Hero entry motion

## Статус и разрешение

Пользователь отдельно разрешил изменить entrance-motion существующего locked Hero и выбрал адаптированный перенос механики появления с `mesh3d.gallery/the-state-of-the-gallery`.

Разрешение касается только первого появления Hero после загрузки страницы. Layout, тексты, типографика, DOM-сюжет, WebGL-композиция, product stages, scroll-progress mapping, handoff и header anatomy остаются неизменными.

## Reference origin

Источник принципов — интро `The state of the gallery` на Mesh3D:

- сцена начинается из почти полного black frame;
- пространственный фон проявляется раньше текста и одновременно медленно приближается к камере;
- служебная навигация входит отдельным ранним слоем;
- крупная типографика появляется не единым fade, а разнесёнными пространственными слоями;
- вторичный текст запаздывает относительно главного;
- после завершения intro элементы переходят в scroll-driven depth без заметного скачка;
- easing мягкий, с длинным cinematic settle и без spring/bounce.

Код, бренд, шрифты и ассеты Mesh3D не копируются. Переносятся только наблюдаемые motion-принципы и относительный ритм.

## Motion sequence

Общая длительность: 2100 ms после первого стабильного browser paint. Тайминг начинается после двух последовательных `requestAnimationFrame`, чтобы пользователь видел исходный black frame.

### Phase 0 — black hold

- 0–120 ms.
- Hero-контейнер уже занимает viewport.
- Canvas и UI скрыты scoped-переменными Hero; глобальные стили не меняются.
- Состояние не блокирует загрузку и не требует overlay DOM.

### Phase 1 — spatial field

- Старт 120 ms, длительность 1180 ms.
- Canvas проявляется `opacity: 0 -> 1`.
- Визуальная камера/поле проходит короткий entrance-offset в глубине и мягко возвращается в существующее нулевое состояние.
- Амплитуда умеренная: эффект должен читаться как пробуждение пространства, а не как дополнительный scroll-step.
- Эффект выполняется на DOM canvas через `scale(1.045) -> scale(1)` и не вмешивается в camera state. Существующая idle/scroll motion внутри canvas продолжает работать без изменений.

### Phase 2 — header

- Старт 280 ms, длительность 760 ms.
- Header проявляется с `opacity`, небольшим `translateY(-10px -> 0)` и лёгким blur settle.
- Все header-элементы входят как один слой; DOM и доступность не меняются.

### Phase 3 — primary copy

- Старт 480 ms, длительность 1080 ms.
- Первый заголовок проявляется по существующим glyph fragments.
- Для intro добавляется только общий multiplier: opacity, небольшой `translateY`, `scale` и depth settle.
- Фрагментированный scroll-motion заголовка остаётся текущим и становится активным после intro без пересчёта stage progress.
- Не добавлять новый посимвольный DOM и не менять текст.

### Phase 4 — secondary UI

- Старт 940 ms, длительность 720 ms.
- Progress indicator и остальные видимые служебные элементы входят последними с меньшей амплитудой.
- CTA поздних tunnel stages не участвует: он остаётся привязан к текущему tunnel progress.

### Phase 5 — handoff to scroll

- После 2100 ms intro multiplier фиксируется в `1`.
- Scroll разрешён с первого кадра и не блокируется.
- Если пользователь начинает scroll до завершения intro, motion ускоренно settling-ится к финальному состоянию, а scroll-driven progress имеет приоритет.
- Не допускается reset прогресса, повтор intro при re-entry из landing sections или повтор после resize.

## Architecture

### React ownership

`CosmicHero.tsx` хранит только lifecycle-фазу intro (`preparing | entering | settled`) и выставляет scoped `data-intro`/CSS custom properties на `.cosmic-runway` или `.cosmic-hero`.

Lifecycle:

1. initial render = `preparing`;
2. два `requestAnimationFrame` после mount гарантируют black starting frame;
3. phase = `entering`;
4. `animationend` или bounded timer переводит в `settled`;
5. cleanup отменяет RAF/timer;
6. ранний scroll переводит intro в `settled` без изменения `copyProgress`.

### Three.js ownership

`CosmicScene`, camera state, terrain, stars, bloom и pointer trail не меняются. Пространственный entrance выполняется только compositor-анимацией `.cosmic-canvas`: `opacity: 0 -> 1`, `scale(1.045) -> scale(1)`.

### CSS ownership

Новые правила добавляются только под `.cosmic-runway[data-intro=...]` / `.cosmic-hero[data-intro=...]`. Не меняются `:root`, `html`, `body`, `#root`, global `*` или общие transition rules.

## Responsive behavior

- Desktop: canvas `scale(1.045) -> scale(1)` и полная последовательность.
- Tablet: canvas `scale(1.036) -> scale(1)`, те же задержки.
- Mobile: canvas `scale(1.026) -> scale(1)`; без blur на canvas; длительность фаз сохраняется, чтобы ритм не менялся между ориентациями.
- Resize не перезапускает intro.

## Reduced motion

При `prefers-reduced-motion: reduce`:

- отсутствуют camera travel, scale и glyph stagger;
- canvas и интерфейс получают короткое одновременное opacity reveal до 180 ms либо сразу видимы;
- существующий reduced-motion Hero contract сохраняется.

## Performance budget

- Никаких новых dependencies.
- Не создавать дополнительный canvas, texture, particle system или постоянный RAF.
- Intro использует уже существующий render loop и compositor-friendly `opacity/transform`.
- После `settled` intro-specific `will-change` снимается.
- Не увеличивать DPR, particle count и post-processing cost.

## Accessibility

- Hero content остаётся в accessibility tree с первого render.
- Intro не блокирует keyboard/pointer interaction header.
- Нет flashing, bounce или резких ускорений.
- Ранний пользовательский scroll всегда имеет приоритет над декоративным intro.

## Expected files

- `src/components/CosmicHero.tsx` — lifecycle и scoped intro state.
- `src/styles.css` — scoped entrance choreography.
- `src/cosmic/heroEntryMotion.ts` — чистые constants/helper для lifecycle и early-scroll settle.
- `src/cosmic/heroEntryMotion.test.ts` — тесты timing, early-scroll settle и reduced motion.

## Verification

- Unit tests для intro helper и существующих Hero motion helpers.
- Production build.
- Захват первого кадра, промежуточного кадра и settled state на desktop/mobile.
- Сравнение settled state с текущим Hero: layout и визуальное положение элементов должны совпасть.
- Проверка early scroll, reverse scroll, resize, page restore и reduced motion.
- Console errors, long-frame spikes и лишние RAF/listener lifecycle leaks отсутствуют.

## Out of scope

- Переработка следующих Hero stages.
- Изменение звездного поля, terrain, shaders или product imagery.
- Изменение Hero copy, header content, typography или layout.
- Перенос Mesh3D assets, fonts, source code или branding.
- Добавление GSAP, Motion, Lenis или другой зависимости.
