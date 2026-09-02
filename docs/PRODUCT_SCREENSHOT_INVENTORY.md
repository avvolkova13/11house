# ElevenHouse product screenshot inventory

Статус: product evidence baseline, 2026-09-02.
Источники: 9 приложенных пользователем screenshots текущего `app.elevenhouse.ai`, каждый 3024×1964 px.
Назначение: зафиксировать реальную anatomy продукта до создания visual references и до implementation лендинга.

## Source-of-truth contract

- Эти screenshots — primary source of truth для product UI: сущностей, полей, controls, состояний и иерархии.
- Reference websites могут определять только marketing art direction, composition, depth, motion, transitions и presentation.
- Marketing scene может менять crop, scale, camera, focus, masks, spatial position и порядок раскрытия уже существующих UI-слоёв.
- Marketing scene не может менять product component anatomy, добавлять поля, метрики, статусы, продуктовые действия или новые экраны.
- Browser chrome Safari не является частью ElevenHouse UI и не переносится в marketing composition.
- Если нужного состояния нет в inventory, scene получает `partially blocked` или `blocked`, а не synthetic UI.
- Locked Hero не анализировался и не изменялся в рамках этой работы.

## Global product shell

Подтверждено всеми screenshots:

1. **Persistent left navigation**
   - brand block `ElevenHouse / ASTROLOGER WORKSPACE`;
   - collapse/back control;
   - primary navigation: `Дашборд`, `Календарь`, `Клиенты`, `Финансы`, `Воронки`, `Продукты`, `Отзывы`, `Движок карт`, `Нумерология`, `Матрица судьбы`, `Дизайн человека`, `Астрокалендарь`, `Астродневник`;
   - separate lower card `Личная страница` with client-domain preview;
   - bottom item `Настройки`;
   - current section uses a dark warm surface, thin yellow border and yellow icon.

2. **Persistent global top bar**
   - global search: `Поиск клиентов, заказов, карт...`;
   - yellow `Создать` dropdown;
   - notifications control with unread dot;
   - user identity `Ксения`, avatar initial `К`, timezone `GMT+3 · Europe/Moscow`.

3. **Shared visual component families**
   - near-black/navy workspace background;
   - elevated violet/navy surfaces with thin low-contrast borders;
   - yellow primary/action accent;
   - mint/green confirmed or active state;
   - coral/red liability or warning state;
   - segmented controls, rounded buttons, chips, tabs, search/select fields, status badges;
   - compact line icons with text labels;
   - three-pane layouts for entity list / working canvas / inspector where the task requires it.

4. **Observed desktop geometry, approximate**
   - capture is Retina-scale; approximate CSS viewport is 1512×982 including browser chrome;
   - app sidebar is about 248 CSS px wide;
   - global top bar is about 68 CSS px high;
   - dense tools use approximately 16–24 px page gutters and 12–20 px inter-control gaps;
   - cards and inspector blocks commonly use roughly 16–28 px internal padding;
   - exact DOM dimensions are not proven by screenshots and must not be treated as measured CSS tokens.

## Screenshot inventory

### EH-P01 — Calendar / confirmed appointment

Source: `Снимок экрана — 2026-09-02 в 14.02.11.png`
Product function: scheduling, availability and entry into a booked session.

**Hierarchy and layout**

- page toolbar: previous/next, `Сегодня`, week range `31 августа — 6 сентября 2026 г.`;
- view switcher: `День / Неделя / Месяц`, with `Неделя` active;
- actions: `Доступность`, `Скрыть панель`, `Запись`;
- main week grid: days across columns, times down rows;
- right appointment inspector opens beside the calendar.

**Confirmed controls and data**

- day columns `пн 31`, `вт 1`, `ср 2`, `чт 3`, `пт 4`, `сб 5`, `вс 6`;
- visible hour range approximately 08:00–18:00;
- at least two event cards are visible;
- selected event status `Подтверждена`;
- client `Елена Смирнова`, initials `ЕС`;
- product/service `Видео консультация`;
- amount `0 ₽`;
- date `Вт, 1 сентября`;
- time/duration `10:00–11:00 · 60 мин`;
- channel `Видеозвонок`;
- action `Войти в сессию`.

**Captured state**

- weekly view;
- current/focused day `ср 2` highlighted;
- appointment on Tuesday selected;
- right detail panel open;
- appointment confirmed;
- session-entry CTA available.

**Not proven**

- day and month layouts;
- availability editor;
- create/edit/cancel/reschedule flows;
- unconfirmed/cancelled/completed states;
- actual video-call UI.

### EH-P02 — Clients / zero-count loading or empty selection

Source: `Снимок экрана — 2026-09-02 в 14.02.26.png`
Product function: CRM client list, filtering and client-card selection.

**Hierarchy and layout**

- page header `Клиенты 0`;
- left work pane for client discovery and filtering;
- large right pane reserved for selected client details;
- vertical divider between list and detail regions.

**Confirmed controls and data**

- mode tabs `Список` and `Воронка`, `Список` active;
- search `Поиск по имени клиента...`;
- status filters `Все`, `Новый`, `Активный`, `Ждет клиента`, `В работе`, `Неактивный`;
- connection-source select `Источник связи`, current value `Все`;
- action `Добавить`;
- right placeholder `Выберите клиента`;
- helper text: client card opens from an active connection with the astrologer;
- lower-left text `Загрузка клиентов`.

**Captured state**

- zero count is displayed;
- no client is selected;
- list content is in a visible loading/empty transition state;
- the screenshot does not prove whether the terminal state is truly empty or still loading.

**Not proven**

- populated client rows;
- client profile/card fields;
- CRM funnel layout;
- add-client form;
- status-change and source-change behavior;
- orders, cards or history inside a client record.

### EH-P03 — Finances / no operations and no withdrawable balance

Source: `Снимок экрана — 2026-09-02 в 14.02.32.png`
Product function: financial overview, operation history, payout rules and payout request.

**Hierarchy and layout**

- page header `Финансы`;
- tariff/commission context plus report, refresh and withdraw actions;
- four KPI tiles;
- large operation-history panel;
- right payout and balance panel with request form.

**Confirmed controls and data**

- `Тариф Internal Max Access · комиссия 0%`;
- actions `Отчёт`, `Обновить`, `Вывести средства`;
- KPIs: `Доступно к выводу 0 ₽`, `В ожидании 0 ₽`, `Продажи за месяц 0 ₽`, `MRR (подписки) —`;
- MRR helper: subscription circuit is not connected;
- history filters `Все`, `Продажи`, `Выплаты`, `Возвраты`, `Корректировки`, plus search;
- table columns `Операция`, `Брутто`, `Комиссия`, `Нетто`;
- empty-state copy says sales, returns, holds and payouts appear after the first client payment;
- empty-state CTA `Открыть продукты`;
- payout facts: method not added, processing `заявка в админку`, minimum `1 000 ₽`, provider `банк вручную`;
- balance composition: available now, in payout requests, reserve/holds, debt;
- amount field contains `5000`, nearby `Всё` control and `Создать заявку` action.

**Captured state**

- all money values are zero or unavailable;
- no operation rows;
- payout method absent;
- amount entered exceeds available balance;
- the muted `Создать заявку` treatment appears unavailable, but disabled semantics are not mechanically proven by the screenshot.

**Not proven**

- populated transactions;
- successful payment, refund, hold, correction or payout rows;
- report output;
- payout request success/error;
- how a finance KPI animates or updates after a purchase.

### EH-P04 — Funnels / draft visual automation editor

Source: `Снимок экрана — 2026-09-02 в 14.02.45.png`
Product function: build and publish automated practice workflows.

**Hierarchy and layout**

- editor header with funnel list navigation, draft metadata, save/publish status;
- node library on the left;
- dotted infinite canvas in the center;
- selected-node inspector and execution summary on the right;
- zoom controls pinned near the lower canvas edge.

**Confirmed controls and data**

- `Все воронки`;
- `ЧЕРНОВИК · РЕДАКЦИЯ 50`, title `Новая воронка`;
- `Изменения сохранены`, actions `Сохранить` and `Опубликовать`;
- node-library categories `ТРИГГЕРЫ`, `КОММУНИКАЦИИ`, `ЛОГИКА`, `КАРТА И AI`, `РАБОТА АСТРОЛОГА`, `РЕЗУЛЬТАТЫ`;
- visible node types include `Старт воронки`, `Отправить сообщение`, birth-data branching, `Рассчитать натальную карту`, `AI-черновик трактовок`, `Задача астрологу`, `Решение астролога`, `Завершено`, and a partially visible suppressed/stopped result;
- canvas visibly contains connected message, natal-chart, birth-data and astrologer-task nodes;
- selected node inspector: `НАТАЛЬНАЯ КАРТА`, `Рассчитать натальную карту`, id `natal-chart-request-2`;
- node fields: `Тип natal_chart_request`, `Контракт config v1 · executor v1`, `Связи 1 вход · 1 выход`, editable `Название узла`;
- description `Натальная карта взрослого`;
- execution warning: execution is currently unavailable; scenario may be edited and published;
- `Запуски 0` and no previous runs;
- zoom state `30%`, controls minus/plus and `Уместить`.

**Captured state**

- draft editor;
- revision 50;
- changes saved;
- natal-chart calculation node selected;
- connected graph visible;
- execution unavailable;
- zero runs.

**Not proven**

- live execution and client passage through the graph;
- delay/timer node;
- successful send/action result;
- node creation, dragging, connection or branching interaction;
- published/running/failed execution states;
- run logs.

### EH-P05 — Products / mixed active and draft catalog

Source: `Снимок экрана — 2026-09-02 в 14.02.51.png`
Product function: create and manage sellable formats of work.

**Hierarchy and layout**

- product title/count and status filters in header;
- `Создать продукт` primary action;
- catalog summary strip;
- three-column grid of heterogeneous product cards.

**Confirmed controls and data**

- counts: `Продукты 9`, `Все 9`, `Активные 6`, `Черновики 3`, `Архив 0`;
- summary: `Активных 6 из 9`; total sales, catalog revenue and bestseller are unavailable (`—`);
- each product card can contain type, title, status, price, delivery summary, capabilities, sales value, overflow menu and `Изменить`;
- visible product formats and states:
  - `СВОЙ ФОРМАТ`, `Астрография · где ...`, `Черновик`, `7 900 ₽`, `Видео · 60 мин`, `Запись сессии`, `Анализ карты по городам`;
  - `КУРС`, `Мини-курс (копия)`, `Активен`, `5 900 ₽`, `Видео + Файл · 4–6 уроков`, `Запись сессии`, `Короткие видеоуроки`;
  - `АСТРОДНЕВНИК`, `Астродневник`, `Активен`, `10 ₽`, `Чат + Аудио + Файл`, `Аудиозапись`, `4 цикла рефлексии за оплаченный период`;
  - `РАЗБОР В ЗАПИСИ`, `тестовый пакет`, `Активен`, `3 000 ₽`, `Видео · 3 × 60 мин` and an image cover;
  - `РАЗОВАЯ КОНСУЛЬТАЦИЯ`, truncated title `Индивидуальная ко...`, `Активен`, `4 900 ₽`, `Видео · 90 мин`, `Запись сессии`, `Онлайн-встреча 1 : 1`;
  - `РАЗБОР В ЗАПИСИ`, `Разбор в записи`, `Активен`, `2 900 ₽`, `Видео + Файл · 20–30 мин`, `Видео + Файл · 3 дня`, `Запись сессии`, `Видео или аудио-разбор`.

**Captured state**

- mixed catalog with active and draft products;
- no recorded sales metrics;
- six of nine products active;
- editing controls available on cards.

**Not proven**

- product editor fields;
- public product page;
- checkout, purchase confirmation or order record;
- archive behavior;
- subscription billing behavior;
- complete content of truncated product titles/cards below the fold.

### EH-P06 — Chart engine / natal chart before calculation

Source: `Снимок экрана — 2026-09-02 в 14.03.02.png`
Product function: calculate and inspect professional astrology charts for a selected client.

**Hierarchy and layout**

- client selector and mode/action toolbar;
- left summary region `БОЛЬШАЯ ТРОЙКА`;
- central circular chart workspace;
- right detail tabs and inspector region.

**Confirmed controls and data**

- selected client `Анна Романова`, date `18.07.1992`, initials `АР`;
- modes `Натал`, `Детская`, `Транзиты`, overflow; `Натал` active;
- primary action `Рассчитать` and secondary `Действия`;
- chart frame contains 12 zodiac glyphs, degree/tick ring and concentric circles;
- right tabs `Планеты`, `Аспекты`, `Дома`, `Трактовки`, with `Планеты` active;
- left and right copy explicitly says content appears after calculation;
- central hint: hover a planet to see details, house and aspects.

**Captured state**

- client selected;
- natal mode selected;
- pre-calculation/empty-result state;
- circular coordinate system visible without calculated planets;
- hover affordance is described but cannot be demonstrated in a static capture.

**Not proven**

- any calculated natal-chart result;
- actual planet positions, aspects, houses or interpretations;
- child-chart and transit results;
- action menu contents;
- hover tooltip anatomy;
- calculation loading, success or error state.

### EH-P07 — Numerology / calculated result with selected key number

Source: `Снимок экрана — 2026-09-02 в 14.03.17.png`
Product function: client-linked numerology calculation, overview and interpretation.

**Hierarchy and layout**

- header with tool identity, calculations control, client selector, year/compatibility/actions;
- left key-number navigation;
- central Pythagorean-square result and strength lines;
- right contextual interpretation for the selected number.

**Confirmed controls and data**

- client `Анна Романова`, `18.07.1992`;
- `Расчёты 0` visible in the header;
- `Год · 2026`, `Совместимость`, `Действия`;
- key numbers: life path `1`, expression `8`, soul `9`, personality `8`, birth day `9`, personal year `8`;
- selected item `Число жизненного пути`;
- Pythagorean square: `111 Характер`, `2 Энергия`, `33 Интерес`, `— Здоровье`, `5 Логика`, `— Труд`, `77 Удача`, `88 Долг`, `99 Память и ум`;
- footer `Квадрат Пифагора · психоматрица по дате рождения · рабочие числа: 37 · 1 · 35 · 8`;
- strength lines visible: purposefulness 5, stability 4, materiality 1, spirituality 6, family 4, self-esteem 6, talent 6, temperament 5;
- right detail: source `ИЗ: ДАТА РОЖДЕНИЯ`, number `1`, title `Число жизненного пути`, descriptor `Лидер, инициатор`;
- explanation and `Как считается` card;
- collapsed control `AI-разбор портрета`.

**Captured state**

- calculated numerology result exists for selected client;
- life-path number is selected;
- right interpretation is open;
- AI portrait analysis is collapsed;
- header shows `Расчёты 0` despite visible results; the screenshot alone does not resolve that semantic mismatch.

**Not proven**

- creation of a calculation;
- year calculation detail;
- compatibility flow/result;
- expanded AI portrait analysis;
- action menu, loading or error states.

### EH-P08 — Matrix of Destiny / calculated graph and analysis

Source: `Снимок экрана — 2026-09-02 в 14.03.24.png`
Product function: client-linked destiny-matrix visualization, interpretation and supporting outputs.

**Hierarchy and layout**

- tool/client/action toolbar;
- left navigation of key points and destinations;
- central node-link matrix with legend and a partially visible energy map below;
- right tabbed inspector.

**Confirmed controls and data**

- client `Анна Романова`, `18.07.1992`;
- controls `Год`, `Партнёрская`, `Презентация`, `Привязать`, `PDF`;
- `PDF` appears muted/unavailable in this state;
- selected key point `11 Портрет · Я`;
- other visible key points: `18 Характер`, `7 Детство · род`, `21 Карма рода`, `10 Зона комфорта`, `7 Таланты`, `10 Кармический хвост`, `4 Род · ресурс`, `10 Отношения`;
- visible destinations: `11 Личное · до 40 лет`, `4 Социальное · 40–60 лет`, `15 Духовное · 60+ лет`;
- central graph includes age marks and color-coded personal, karmic, internal and center nodes;
- right tabs `Разбор`, `Заметки`, `Отчёт`, with `Разбор` active;
- inspector title `ЦЕНТР МАТРИЦЫ`, value `11`, `Портрет · Я`, `Сила — портрет`;
- interpretation blocks include main description, `ТЕНЕВАЯ СТОРОНА`, `ВОПРОСЫ ДЛЯ РАЗМЫШЛЕНИЯ`, `ПРАКТИЧЕСКИЕ РЕКОМЕНДАЦИИ`;
- lower central block `Энергетическая карта` is visible only partially.

**Captured state**

- calculated matrix result;
- center node 11 selected;
- analysis tab open;
- graph and interpretation are synchronized around the selected point;
- PDF action visually unavailable.

**Not proven**

- partner, presentation, link/binding or year flows;
- notes and report content;
- PDF output;
- selection behavior for other graph nodes;
- full energy-map anatomy below the fold.

### EH-P09 — Astrodiary / active private client journal

Source: `Снимок экрана — 2026-09-02 в 14.03.36.png`
Product function: asynchronous post-session/client support in a private journal.

**Hierarchy and layout**

- page identity `ДНЕВНИК КЛИЕНТА / Астродневник`;
- left client/journal list;
- right selected-journal header and conversation timeline;
- no active composer in the captured turn state.

**Confirmed controls and data**

- client list count `1`;
- selected `Клиент 7732266f`, status `Активный журнал`, badge `2`;
- selected-journal header repeats client identity and active status;
- privacy/context notice `Личный контекст` says entries and responses are visible only to journal participants and context is calculated by the server;
- one `Запись клиента`, timestamp `20 авг., 17:59`;
- one `Ответ астролога`, author `Вы`, timestamp `20 авг., 18:01`;
- alternating alignment/surface treatment distinguishes client entry from astrologer response;
- bottom state: `Сейчас ход клиента. Ответ откроется после новой записи.`

**Captured state**

- one active journal selected;
- two visible timeline entries;
- client/astrologer turn-taking;
- astrologer response is currently locked until the client's next entry;
- private shared context is explicit.

**Not proven**

- client-facing journal screen;
- entry composer, attachment controls, audio/file playback or upload;
- new-entry/unlocked-reply state;
- cycle completion, expiration or payment-renewal behavior;
- inactive/closed journal state.

## Confirmed entity relationships

Only relationships visible in the screenshots or explicit screenshot copy are included as confirmed.

| From | To | Evidence |
|---|---|---|
| Appointment | Client | Calendar inspector contains `Елена Смирнова`. |
| Appointment | Product/service | Same inspector contains `Видео консультация · 0 ₽`. |
| Appointment | Session channel | Same inspector contains `Видеозвонок` and `Войти в сессию`. |
| Client | Professional calculation | Chart Engine, Numerology and Matrix headers each contain a client selector. |
| Funnel | Communication | Funnel library and canvas contain `Отправить сообщение`. |
| Funnel | Professional calculation | Funnel library, graph and inspector contain `Рассчитать натальную карту`. |
| Funnel | Astrologer work | Funnel library/canvas contain `Задача астрологу` and `Решение астролога`. |
| Product | Delivery capabilities | Product cards enumerate video, chat, audio, files, recordings, lessons and reflection cycles. |
| Client payment | Finance ledger | Finance empty-state copy says operations appear after the first client payment. |
| Astrodiary | Client | Journal list and selected header identify one client. |
| Astrodiary | Alternating participants | Timeline distinguishes client entry and astrologer response; privacy is limited to participants. |

## Relationships that remain inference only

These may be narratively plausible, but must not be visualized as automatic product behavior without additional product evidence:

- purchase automatically creates a client record;
- purchase automatically creates a calendar appointment;
- a booked product automatically creates a video room;
- a paid Astrodiary product automatically opens a journal or advances its cycles;
- finance counters animate immediately after checkout;
- funnel execution moves a specific client between nodes;
- a funnel can delay exactly two weeks before sending the next message;
- a client profile aggregates appointments, payments, calculations and journal history in one confirmed view.

## Landing-scene evidence matrix

| Existing storyboard scene | Evidence status | Safe product material | Missing evidence / constraint |
|---|---|---|---|
| 3.1 `Выбрала вас` | `partially blocked` | Product catalog cards from EH-P05. | No public astrologer page, selected product detail or checkout. |
| 3.2 `Купила консультацию` | `partially blocked` | Calendar appointment from EH-P01; finance empty-state relation to first payment from EH-P03. | No checkout, purchase confirmation, order, populated finance transaction or client profile. Do not animate automatic transitions among them. |
| 3.3 `Вы готовитесь` | `partially supported` | Pre-calculation Natal frame EH-P06; calculated Numerology EH-P07; calculated Matrix EH-P08. | No calculated natal chart and no Human Design screenshot. A direct four-tool metamorphosis is not fully supported. |
| 3.4 `10:00 consultation` | `supported with limits` | EH-P01 selected confirmed appointment and `Войти в сессию`. | No actual video-call screen; stop at the confirmed session-entry action. |
| 3.5 `11:00. Всё?` | `supported with limits` | EH-P09 active journal conversation and turn state. | No proof that this exact journal belongs to the calendar client or follows that appointment automatically. |
| 3.6 `Через две недели` | `partially blocked` | EH-P04 draft funnel editor and its real node types. | No delay node, no live execution, no specific-client progression, no successful message state. Show configuration only. |
| 5 `Clients` | `partially blocked` | EH-P02 list/filter shell and no-selection state; EH-P09 client list. | No populated CRM client profile. |
| 5 `Time` | `supported` | EH-P01 week calendar and appointment inspector. | Other calendar views and editing remain unavailable. |
| 5 `Money` | `partially blocked` | EH-P03 financial anatomy and zero state. | No sale entering the ledger or KPI update. |
| 7 `Everything inside` | `partially supported` | Calendar, Clients shell, Finance, Funnels, Products, Chart Engine, Numerology, Matrix, Astrodiary. | No screenshots for Dashboard, Reviews, Human Design, Astrocalendar, Personal Page or Settings. |
| 8 `Practice growth` | `partially supported` | Product formats from EH-P05 and funnel configuration from EH-P04. | Cross-product lifecycle and automatic expansion are not directly shown. |
| 9 `Social proof + pricing` | `blocked for real data` | None of the screenshots provides reviews or ElevenHouse subscription-plan pricing. | Requires approved reviews, metrics, plans and prices. Product-card prices are customer offer prices, not ElevenHouse SaaS pricing. |

## Product states currently safe for marketing use

1. Calendar week with selected confirmed video-consultation appointment.
2. Client CRM shell with filters and no selected client, preserving loading ambiguity.
3. Finance dashboard with all-zero metrics and no operations.
4. Draft funnel graph with a selected natal-chart node and execution unavailable.
5. Product catalog with mixed active/draft products and real prices/capabilities.
6. Natal chart frame before calculation.
7. Calculated numerology with selected life-path number.
8. Calculated destiny matrix with selected center node and open analysis.
9. Active Astrodiary with two messages and client-turn lock.

## Explicitly blocked product states

- populated Dashboard;
- populated CRM client list and client profile;
- public personal page;
- selected public product detail, checkout and purchase confirmation;
- order history;
- populated financial ledger or successful payout;
- live/published funnel run and run history;
- delay/timer automation;
- calculated Natal, Child or Transit chart;
- Human Design result;
- Astrocalendar UI;
- Reviews UI and real review content;
- expanded AI portrait analysis;
- Matrix notes/report/PDF/presentation states;
- Astrodiary composer, attachments, audio and completed cycle;
- Settings screens;
- responsive/mobile product layouts.

## Implementation guardrails derived from the inventory

- Do not recreate Safari chrome.
- Do not restyle product UI to match reference websites; preserve ElevenHouse product colors, controls and component hierarchy.
- Use marketing composition around the product frame: crop, mask, depth, focus, scale, camera and sequencing are allowed.
- Keep real Russian labels where readable; do not replace them with generic pseudo-data.
- Preserve empty/pre-calculation states as empty/pre-calculation states.
- Do not fill blank panes with invented clients, transactions, planets, metrics or analytics.
- Do not interpret muted controls as definitely disabled unless additional interactive evidence confirms it.
- Do not join two screenshots into a causal automatic flow unless the relation is directly confirmed above.
- Where the storyboard needs unsupported data, isolate the confirmed region and label the scene `partially blocked`.
- Any future visual reference board must cite the exact `EH-Pxx` source for every product UI fragment it uses.

## Open evidence requests for full storyboard fidelity

Highest-priority missing screenshots:

1. public personal page with a real product selected;
2. checkout and successful purchase/order state;
3. populated client list and full client profile;
4. populated finance ledger after a real client payment;
5. calculated natal chart with planet/aspect/house inspector;
6. published/running funnel with delay and execution history;
7. Human Design result;
8. Astrodiary composer and unlocked astrologer-response state;
9. Dashboard, Reviews and Astrocalendar;
10. real ElevenHouse plan/pricing and approved social proof.
