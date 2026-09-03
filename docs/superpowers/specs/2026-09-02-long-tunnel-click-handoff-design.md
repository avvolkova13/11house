# Long tunnel and click handoff design

## Решение

Финальная curved funnel ElevenHouse остаётся активной сценой до явного действия пользователя. Автоматический выход из Hero после последней scroll-фазы удаляется. Вместо него tunnel-flight продолжается три полные scroll-дистанции, после чего внутри тоннеля появляется CTA. Только клик по CTA запускает page-like переход к уже существующей секции `OneClientStory`; URL не меняется.

Предыдущая утверждённая фаза `terrain → particle cloud → formed surface` остаётся locked. Product screenshots, продуктовая anatomy и публичные тексты существующих сцен не меняются.

## Reference origin

Источник motion logic — финал `https://mesh3d.gallery/the-state-of-the-gallery`:

- тоннель не заканчивается автоматическим уходом вниз;
- финальная copy и CTA появляются поверх продолжающей движение WebGL-сцены;
- переход начинается только после клика;
- новый экран сначала показывает базовую структуру, затем раскрывает вторичные элементы;
- route-like ощущение создаётся коротким тёмным hold и staged reveal, а не вертикальным перелистыванием секций.

Бренд, контент, изображения и assets референса не используются.

## Scroll choreography

- Сформированный тоннель начинается при visual progress `6`.
- Tunnel-flight занимает visual progress `6…9`, то есть `3 × 760 = 2280 px` нативного scroll.
- `getTunnelDive()` растягивается на весь диапазон `6…9`; текущая camera curve, roll, particle stretch и reverse response сохраняются, но проигрываются медленнее.
- Copy progress остаётся clamped на существующем последнем текстовом этапе. Новые временные narrative stages не добавляются.
- CTA начинает проявляться при progress `8.45` и полностью доступна при progress `8.9`.
- При progress `9` страница заканчивается на Hero. Продолжение wheel/trackpad не выводит пользователя к следующей секции, потому что следующий layout ещё не участвует в document flow.
- Обратный scroll до клика полностью обратим и возвращает camera dive, presentation и предыдущие сцены без скачка.

## CTA

- Используется реальный `<button type="button">`, а не декоративная ссылка.
- Временная функциональная подпись изолирована в одной константе: `Продолжить`. Она не является частью product UI и может быть заменена после получения финального текста без изменения motion.
- До reveal CTA имеет `aria-hidden="true"`, `tabIndex={-1}` и не принимает pointer events.
- После reveal кнопка получает keyboard focusability и видимый focus-ring.
- CTA располагается по центру поверх тёмного горла, как финальное действие внутри той же пространственной сцены.

## Click-gated handoff

`App` хранит три состояния перехода:

1. `tunnel` — `OneClientStory` смонтирован, но исключён из layout и accessibility tree.
2. `covering` — после клика тёмный transition layer набирает opacity за `200 ms`.
3. `story` — layout следующей секции включается; под полностью тёмным слоем scroll позиция мгновенно переносится к её началу. Затем cover уходит, а элементы следующего экрана раскрываются до `900 ms`.

Переход не создаёт новый route и не меняет browser history. После раскрытия `OneClientStory` пользователь может прокручивать страницу назад в Hero.

## New-screen reveal

- На первом reveal-такте появляется светлый фон секции и её header.
- Anchor клиента проявляется вместе с header.
- Rail, первая product scene и footer получают вторую задержанную фазу.
- Existing layout, типографика, product screenshots и content `OneClientStory` не redesign-ятся.
- Transition CSS добавляется только под новыми scoped selectors и не меняет locked Hero rules глобально.

## Component boundaries

- `heroNarrative.ts` определяет visual progress `9`, CTA reveal и расширенный dive timing.
- `PageScrollCoordinator.ts` рассчитывает длинный travel corridor, но не отвечает за click state.
- `CosmicHero.tsx` рендерит CTA и сообщает наружу событие `onEnterStory`.
- `App.tsx` владеет handoff state, длиной runway до/после клика и переносом scroll position под cover.
- `OneClientStory.tsx` получает только transition-phase hook/class для staged reveal; его сцены и данные не меняются.
- `styles.css` содержит новые scoped CTA, cover и story-enter selectors.

## Reduced motion

- Длинный camera flight, scroll-driven roll, streaks и animated cover отключены.
- CTA остаётся доступной на статичном Hero.
- По клику следующая секция включается и получает focus без искусственной задержки.

## Testing and QA

- Unit: visual end равен `9`, dive монотонно занимает `6…9`, CTA reveal ограничен `8.45…8.9`.
- Unit: до click runway заканчивается на `travelEnd`; после click существует handoff distance к `OneClientStory`.
- Component/runtime: CTA недоступна до reveal и вызывает handoff один раз.
- Visual desktop: три различимые tunnel-flight точки, CTA hold, cover, header-first reveal, delayed product scene.
- Visual mobile: горло и CTA остаются в viewport; новый экран не открывается боковым сдвигом.
- Reverse scroll: до click тоннель обратим; после click можно вернуться в Hero.
- Runtime: нет WebGL/React errors; focus после перехода попадает на heading следующей секции.

## Performance limits

- Новые dependencies и дополнительные WebGL draw calls не добавляются.
- Click transition использует только opacity/transform.
- Таймеры handoff очищаются при unmount; повторный click игнорируется.

## Вне scope

- Новый route или browser-history entry.
- Изменение текстов и product anatomy `OneClientStory`.
- Изменение утверждённого terrain-to-tunnel morph.
- Копирование исходного кода, shader assets или бренда Mesh3D.
