# Landing storyboard

Статус: direction only. UI-код, новые секции и motion implementation не создаются на Phase 2-3.

## 1. Existing Hero - locked

Purpose: approved opening world. Copy, DOM, layout, graphics and motion immutable.

What user sees first: existing ElevenHouse cosmic Hero.

Scroll: existing behavior only. No transition is implemented here.

Assets: current procedural Canvas/WebGL Hero.

## 2. Chaos -> ElevenHouse

Purpose: показать, что практика уже является системой, но сейчас разложена по инструментам.

Exact copy: «Хотя подождите. У вас ведь уже есть система. Вот она.» Final statement: «Мы просто собрали вашу работу обратно.»

Visual composition: corridor из abstract message window, calendar event, spreadsheet fragment, payment notification, video meeting, note и document. Реальные чужие logos не использовать без разрешения.

What user sees first: спокойное продолжение Hero, затем первые separated entities по периферии.

On scroll: entities расходятся по depth, коротко создают controlled chaos, trajectories сходятся и собираются в ElevenHouse workspace.

In/out: вход через existing spatial grammar; выход - relief, собранная система и следующий anchor-клиент.

References: R6, R1, R5.

Assets: approved Hero language; abstract UI fragments; no invented integrations.

Desktop: широкая перспектива и асимметричная периферия, центр читаемый.

Mobile: 4-6 крупных entities, короткая sequence, без длинного pin.

Complexity / risks: high; scroll-runway integration, DOM/object count, generic tunnel risk.

## 3. One client inside ElevenHouse

Purpose: главный product-story WOW-блок, провести одного клиента через систему.

User story: Анна выбирает астролога, покупает консультацию, получает профессиональную подготовку, приходит на встречу и остаётся в сопровождении.

UI state: public page -> selected product -> purchase confirmed -> client profile -> calendar appointment -> professional tool -> journal/follow-up -> funnel action.

Exact copy: «Давайте проведём через ElevenHouse одного клиента.» Anchor: «Анна.»

Structure: одна длинная sticky storytelling sequence, внутри шесть scenes, а не шесть независимых feature blocks.

### 3.1 Выбрала вас

User story: Анна выбирает подходящую консультацию.

UI state: public astrologer page -> product list -> selected consultation -> purchase state. UI panel remains recognizable; one card comes forward.

### 3.2 Купила консультацию

User story: Анна оплачивает консультацию, а организационная работа может происходить автоматически только если это подтверждено продуктом.

UI state: purchase confirmed -> client profile -> calendar appointment -> purchase history. Truth audit: payment state может быть подтверждён только реальным payment state; переходы client profile, calendar appointment и purchase history пока являются conceptual relationship, автоматическое поведение не подтверждено предоставленными материалами. До product confirmation это blocker; визуально automation не имитировать.

### 3.3 Вы готовитесь

User story: астролог готовится к работе с Анной в привычных профессиональных инструментах.

UI state: one professional tool stage transforms Natal chart -> Matrix of Destiny -> Numerology -> Human Design using real screenshots/data only. Shared coordinate/circle anchor persists.

### 3.4 10:00 consultation

User story: «Наступает время консультации - астрологу не нужно искать клиента, запись или ссылку на встречу.»

UI state: «10:00. Анна уже здесь.» Week/month view zooms into appointment; surrounding UI recedes. No invented video-call clone.

### 3.5 11:00. Всё?

User story: консультация не заканчивается в момент звонка.

UI state: «11:00. Всё?» Consultation continues through journal/follow-up. Tempo slows, conversation/history line remains.

### 3.6 Через две недели

User story: «После консультации Анна не теряется - в нужный момент ElevenHouse продолжает заранее настроенный сценарий работы с ней.»

UI state: «А потом ElevenHouse снова вспомнит об Анне.» Funnel builder adds delay, message, condition, action; Anna passes through it. Automation is shown as system movement, not robot imagery.

References: R10, R12, R5, R8.

Desktop: central Anna anchor with controlled depth around it; each causal state gets readable pause.

Mobile: one state at a time, vertical causal order, shorter sticky sequence, no hover dependency.

Complexity / risks: very high; requires real product screenshots and approved fields.

## 4. One client -> whole practice

Purpose: physical scale transition from Anna to whole workspace.

Exact copy: «Анна - только один клиент. А ElevenHouse работает так с каждым.»

Visual composition: camera pulls back; Anna becomes one meaningful entity among product-language entities. No hundred generic avatar circles.

On scroll: individual journey resolves into full workspace, then into practice scale.

References: R10, R8, R7.

Desktop: continuous zoom-out with calm peripheral density.

Mobile: bounded network of 6-12 entities, no infinite visual pullback.

Complexity / risks: high; scale continuity and object density.

## 5. Practice under control

Purpose: показать three operational truths without three equal cards.

Exact copy: «Пока вы работаете с людьми, ElevenHouse работает с практикой.» Zones: `CLIENTS`, `TIME`, `MONEY`.

Visual composition: Clients = profile expands around selected person; Time = calendar focuses day and appointment; Money = purchase enters and finance state updates. Each zone has distinct composition.

References: R5, R10, R12.

Desktop: one system, three different spatial grammars.

Mobile: stacked scenes, direct states, touch-safe.

Assets: real CRM/product screenshots; no invented analytics.

Complexity / risks: high; data fidelity and three simultaneous demos.

## 6. Emotional brand pause

Purpose: вернуть человека из product complexity к смыслу бренда.

Exact copy:

«Вы не открывали практику,
чтобы управлять таблицами.

Не становились астрологом,
чтобы сверять оплаты.

И точно не для того,
чтобы помнить всё на свете.

Поэтому существует ElevenHouse.»

Visual composition: typography/spatial pause, no cards or dashboard. Slow ambient transformation only.

References: R2, R7, R11.

Desktop: large calm type and generous negative space.

Mobile: readable line lengths, no clipped type, static fallback.

Complexity / risks: medium; too much motion would break the pause.

## 7. Everything inside

Purpose: показать breadth продукта как одну editorial composition.

Copy: «Возможно, вам понадобится не всё. Но вам больше не придётся искать это где-то ещё.»

Features: Натальные карты, Нумерология, Матрица судьбы, Дизайн человека, Астрокалендарь, Астродневник, Клиенты, Календарь, Продукты, Воронки, Финансы, Отзывы, Личная страница, AI.

Visual composition: varied card archetypes, proportions, density; some UI, some type, some relation diagram, one or two atmospheric modules. No 14 equal cards.

References: R5 primarily, R3 sparingly, R9.

Desktop: editorial constellation with open gaps and intentional relationships.

Mobile: ordered list/stack with 4-6 key visual moments, no horizontal overflow.

Complexity / risks: medium-high; generic bento drift.

## 8. Practice growth

Purpose: показать, как practice expands around core expertise.

Copy: «Начните с консультаций. Постройте вокруг них больше.» Then: «Не нужно использовать ElevenHouse целиком с первого дня. Начните с того, как работаете сейчас. Остальное подключите, когда понадобится.»

Sequence: Консультации -> Разборы -> Сопровождение -> Курсы -> Астродневники -> Автоматические сценарии.

Visual composition: core service stays fixed; new layers appear as an expanding orbit/system. No planet icons.

References: R1, R2, R11.

Desktop: semantic orbital composition with strong center and expanding periphery.

Mobile: vertical expansion sequence or simplified concentric rings.

Complexity / risks: medium-high; literal astrology risk.

## 9. Social proof + pricing

Purpose: доверие и коммерческое решение.

Copy/data: use only real project data. No invented reviews, names, counts, revenue, discounts, prices or plan names. If absent, build only approved component structure and mark missing business input.

Visual composition: pricing surfaces borrow controlled depth from R3; hierarchy remains clear and calm. Social proof may share scene if it improves flow.

References: R3, R5, R9.

Desktop: one selected hierarchy, no identical tariff towers.

Mobile: readable plan comparison without horizontal scroll.

Complexity / risks: medium; business-data blocker.

## 10. Final CTA

Purpose: return to feeling of home and system.

Exact copy:

«Оставьте себе астрологию.

Клиенты, записи, продукты, оплаты и процессы соберём вокруг неё.

Вашей практике нужен свой дом.

ElevenHouse

Создать своё пространство ->»

Visual composition: short, calm, motif closes from Section 2. Do not overload.

References: R1, R2, R6.

Desktop: spatial homecoming, clear CTA.

Mobile: static readable CTA and preserved contrast.

Complexity / risks: medium; CTA must remain primary.

## Required inputs before implementation

- Phase 4 architecture proposal for the locked Hero runway.
- Real product screenshots for CRM, calendar, payments, professional tools and funnels.
- Approved business data for reviews and pricing.
- Decision on whether any new motion dependency is justified.
