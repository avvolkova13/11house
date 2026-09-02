# Design direction

## Design read

Это redesign-preserve для SaaS workspace астролога с утверждённым spatial WebGL Hero. Направление: premium editorial astrology / digital observatory. Дизайн variance - 7, motion intensity - 8, visual density - 3.

## Visual thesis

ElevenHouse - private digital observatory for an astrologer's practice.

Это не literal observatory и не эзотерический интерфейс. Визуальный язык соединяет:

- astrology: orbit, relation, coordinates, cycles, trajectories, layers, time, maps, constellations;
- practice system: clients, events, payments, products, flows, data, history.

Результат должен ощущаться как система, в которой множество процессов связано, а не как набор декоративных космических объектов.

## Continuation from locked Hero

Hero не меняется. Первая новая сцена под ним продолжает его spatial grammar: particles / points / trajectories получают смысловые anchors и расходятся в controlled depth. Затем они не превращаются в generic vortex, а собираются в corridor из abstract UI fragments и orbit-like relations. Transition должен ощущаться как вход внутрь уже существующего мира.

## Art direction

- Тёмная, глубокая, спокойная сцена с одной доминирующей luminous accent family, согласованной с Hero.
- Большая editorial typography, короткие фразы, читаемая иерархия.
- Асимметрия и свободное пространство вокруг основного объекта; центр кадра остаётся спокойным, когда motion происходит по периферии.
- UI показывается как materialized system: panels, states, relations, history, а не как collection of cards.
- Глубина создаётся перспективой, scale, z-order, light falloff, masks и camera travel; не декоративным blur everywhere.
- Микро-детали только если они несут meaning: state, timestamp, action, relation.

## Что запрещено

Zodiac signs as decoration, glitter, magic dust, tarot aesthetic, galaxy wallpaper, generic purple nebula, floating planets, moon icons everywhere, random 3D spheres, fake dashboards, одинаковый bento, карточки icon + title + paragraph, endless pills, fake metrics и invented product fields.

## Typography and surface direction

На текущем этапе не менять типографику Hero. Для новых секций сначала использовать существующий system stack как safe baseline, затем отдельно утвердить webfont/dependency decision. Display type - wide, calm, not condensed; body - readable and restrained. No decorative all-caps labels unless they communicate actual UI state.

Surfaces: dark translucent planes only where they clarify an interface layer; one radius logic, thin low-contrast borders, controlled gradients only for material depth and pricing. Не переносить gradient treatment R3 на всю страницу.

## Signature moments

1. **The practice corridor:** разрозненные сущности практики проходят из хаоса в связанную систему.
2. **Anna as anchor:** один клиент последовательно проходит public page -> purchase -> client profile -> calendar -> session -> follow-up.
3. **Professional tool metamorphosis:** общий circle/node/coordinate сохраняется, а tool state трансформируется между Natal chart, Matrix, Numerology и Human Design без invented fields.
4. **Scale pullback:** Анна становится частью всей practice network без сотни avatar circles.
5. **Orbit of growth:** core consultation expands into layers of products and support, с семантической orbital composition.

## Section composition system

- Section 2: spatial transition from Hero into controlled chaos, then convergence.
- Section 3: one long sticky narrative sequence, not six cards or six independent sections.
- Section 4: camera pullback from one client to whole practice.
- Section 5: three distinct compositions inside one system: clients, time, money.
- Section 6: typographic pause without cards or dashboard.
- Section 7: editorial feature constellation using varied proportions and UI density.
- Section 8: expanding orbital system around a core service.
- Section 9: pricing as calm material object; social proof only with real data.
- Section 10: spatial homecoming and short CTA.

## Data and asset rules

Real product screenshots are source of truth for product states. Do not invent fields, metrics, reviews, names, prices, plan names, user counts or revenue. If source assets are missing, use neutral structural placeholders and mark the missing business input before implementation.

## Analytical reference-board rule for implementation

Перед кодированием каждой visually important section создавать analytical reference board только из screenshots/crops approved reference websites, screenshots реального ElevenHouse product и существующих ElevenHouse assets. Synthetic/generated reference imagery и AI image generation не использовать. На board фиксировать composition, typography relation, spacing, depth, motion implication и конкретный product UI element. Для Hero reference boards не используются для изменения locked Hero.

## Approval notes

Это направление не разрешает implementation. Перед кодом всё ещё нужно согласовать Phase 4 integration architecture из-за 100000px Hero runway и отдельно получить реальные product screenshots/business data.
