# Mesh-reference tunnel design

## Решение

Отдельный `CosmicTunnel` удаляется. Существующий `NebulaField` становится одной непрерывной процедурной поверхностью, которая повторяет spatial и motion logic референса Mesh3D, но использует только палитру и материалы ElevenHouse. Product UI, порядок заголовков и первые hero-состояния не меняются.

Утверждённая фаза `terrain → particle cloud → formed surface` считается locked. Доработка начинается после неё: сформированная поверхность меняет presentation с полноэкранной оболочки на асимметричную curved funnel, затем камера проходит по её оси ещё одну полную scroll-дистанцию.

## Визуальная модель

- Один набор параметрических продольных контуров образует и раскрытый рельеф, и воронку, и глубокий тоннель. Отдельного crossfade между разными геометриями нет.
- Провал асимметричен: центр смещён вправо и вверх, форма слегка овальная и постоянно дышит.
- Контуры нерегулярны. Деформация складывается из низкочастотной волны по глубине, углового шума и twist, который усиливается к дальней части тоннеля.
- Плотность линий и точек увеличивается к vanishing point. Ближние части выходят за края кадра, дальние образуют компактный тёмный провал.
- Основной цвет — почти чёрный navy. Линии — muted antique gold, частицы — champagne, тени — едва заметный indigo/violet. Зелёный отсутствует.
- В финальном состоянии горло занимает компактную область около `58%` ширины и `35%` высоты desktop viewport. Оно не центрируется и не превращается в mandala.
- В кадре одновременно читаются примерно `30–40` основных contour strands (shader frequency около `120`, с учётом perspective compression); ближние линии длиннее и преимущественно тянутся из нижнего левого foreground.
- Far-side strands и равномерная сетка подавляются view/depth mask. Частицы образуют halo вокруг горла, а не равномерно покрывают цилиндр.

## Scroll choreography

`tunnelMix` управляет формированием поверхности, а сглаженная скорость scroll управляет ощущением пролёта.

1. `mix 0…0.34`: широкий волнистый рельеф занимает нижние две трети кадра; небольшой провал начинает формироваться выше и правее центра.
2. `mix 0.34…0.72`: края поверхности стягиваются вокруг провала, камера приближается, twist и перспектива усиливаются.
3. `mix 0.72…1`: поверхность заканчивает формирование без изменения утверждённого перехода.
4. `presentation 0…1`: после почти полного формирования уменьшается частота contour bands, включается depth/view mask и проявляется компактная curved funnel.
5. `dive 0…1`: отдельная полная scroll-дистанция двигает камеру вдоль кривой оси, растягивает частицы и сохраняет небольшой тёмный vanishing point.

Scroll остаётся нативным для страницы. Визуальная инерция повторяет референс через damped velocity: импульс колеса временно ускоряет z-travel, растягивает ближние частицы и добавляет небольшой camera roll. Это сохраняет доступность и не создаёт scroll trap.

`HERO_NARRATIVE_STAGES` не получает временный текстовый блок. Scroll corridor расширяется с visual progress `6` до `7`, а copy progress продолжает clamp на последнем существующем этапе. Поэтому будущая замена контента не затрагивает WebGL timing.

## Motion limits

- Camera roll: максимум `±0.035 rad`.
- Pointer parallax: вторичен и не смещает vanishing point больше чем на `4vw / 4vh`.
- При reverse scroll направление z-travel и roll меняются плавно, геометрия не прыгает.
- `prefers-reduced-motion`: статичный сформированный мягкий рельеф без пролёта, roll и streaks.

## Performance

- Без новых dependencies и текстур.
- Две draw calls: одна и та же grid geometry как translucent surface и particles.
- Геометрия создаётся один раз; shader сохраняет identity каждой вершины и непрерывно переводит её из terrain coordinates в tubular coordinates.
- Pixel ratio остаётся ограниченным текущим `CosmicScene`.

## Контрольные кадры

- Wide terrain-to-vortex: organic valley, small offset void, dominant negative space.
- Collapse phase: connected surface curls inward; no perfect rings.
- Deep tunnel: irregular packed contours, offset black void, restrained particles and highlights.

## Вне scope

- Тексты, product screenshots и их DOM choreography.
- Header, responsive typography и последующие sections.
- Копирование исходного кода или ассетов Mesh3D.
