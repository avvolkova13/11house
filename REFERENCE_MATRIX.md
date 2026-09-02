# Reference matrix

Дата live-инспекции: 2026-09-02. Все URL открыты через Codex In-app Browser, после `networkidle` выполнен pointer move и попытка scroll. Референсы ниже не являются готовыми шаблонами: каждый отвечает только за указанный слой.

| ID / URL | Проверка | Что заимствуем | Что не заимствуем | Секции | Motion principle | Composition principle | UI principle | Риск неправильного использования |
|---|---|---|---|---|---|---|---|
| R1 [Cosmoq](https://cosmoq.framer.website/) | verified live | dark luminous scale, atmospheric product scenes, interface-to-space transitions | AI-branding, enterprise copy, assets | 2, 4, 7, 10 | крупные сцены раскрываются по мере scroll | hero-scale visual с чистой иерархией | продуктовые элементы как часть spatial world | generic AI space и слишком много glow |
| R2 [Naya / Cube](https://naya-studio-dubai.webflow.io/) | verified live | premium art direction, cinematic pacing, text/visual tension | floral content, brand, exact layouts | 6, 8, 10 | slow scene changes и смена темпа | большие поля и нестандартный баланс текста/визуала | минимум управляющих элементов | декоративность вытеснит product story |
| R3 [Obscura](https://recent.design/i/ghhhqxm-obscura-visuals-gradient-pack) | principle supplied by user brief; detail not live-verified | controlled gradient surfaces, depth, pricing materiality | exact assets and whole-site gradient treatment | 7, 9 | restrained surface shift | карточка как объект с внутренней глубиной | ясная plan hierarchy | весь сайт превратится в одинаковые gradient cards |
| R4 [Faux Real](https://recent.design/i/d0zj0fm-faux-real-3d-scans) | principle supplied by user brief; detail not live-verified | oversized object framing, asymmetry, promotional object presentation | exact scans/assets | 4, 6, 10 | object reveal и scale transition | объект выходит из спокойного пространства | один visual anchor вместо UI clutter | 3D-объект станет самоцелью |
| R5 [Glyphic](https://www.glyphic.bio/) | verified live | disciplined cards, whitespace, borders, dense-but-clean information | biotech semantics, copy, logos | 5, 7, 9 | UI states change with hierarchy, не ради эффекта | controlled grid с разными proportions | labels, nested UI, readable hierarchy | generic bento и одинаковые cards |
| R6 [Mesh3D](https://mesh3d.gallery/the-state-of-the-gallery) | verified live | deep spatial background, particle field, zoom/travel, typography over scene | mesh branding, exact copy, proprietary art | 2, 6, 10 | scroll-driven camera travel, dissolve and re-form | tunnel/corridor из собственных ElevenHouse entities | minimal fixed chrome, giant type | generic starfield tunnel и копирование 1:1 |
| R7 [Nothin'](https://www.noth.in/) | verified live | purposeful section transitions, pacing, unexpected visual shifts | studio identity and assets | 2, 6, 8 | section choreography with distinct modes | visual surprise with clear hierarchy | simple navigation and strong media moments | motion reel вместо лендинга |
| R8 [PRODUX](https://www.produx.design/) | verified live | pinned composition, scale, typography + visual choreography | branding-company content and exact cookie/UI patterns | 3, 6, 8 | pin/scrub/scale tied to narrative | page avoids identical rectangles | copy remains the anchor | scroll hijack и перегруз |
| R9 [Sharplink](https://www.sharplink.com/) | verified live | restrained luminous accents, contrast, gradients, proportion | crypto/finance semantics | 5, 7, 9 | controlled entrance and section contrast | dark/light depth without rainbow | strong headings and simple nav | finance visual language начнёт менять бренд |
| R10 [Squarespace Foundations](https://brand.squarespace.com/) | principle supplied by user brief; loading state only live-verified | object transformation, masks, scale, visual system states | Squarespace brand system and copy | 3, 4, 5, 7 | one object transforms into another state | identity system as a sequence | elements themselves explain the product | decorative morph without causal meaning |
| R11 [21hrs](https://www.21hrs.space/story/194116729/) | principle supplied by user brief; page content not live-verified | cosmic storytelling, narrative pacing, journey feeling | sci-fi spectacle and unavailable page content | 2, 6, 8, 10 | long-form story rhythm | scale shifts from intimate to vast | clarity remains above atmosphere | page becomes film trailer |
| R12 [Krepling](https://www.krepling.com/) | principle supplied by user brief; detail not live-verified | functional product motion, causal UI sequence, zoom/crop focus | visual styling, commerce semantics | 3, 5, 7 | UI action -> state change -> next module | product demo embedded in story | modules remain recognizable | fake functionality or invented data |

## Evidence limitations

Recent/Obscura and Recent/Faux Real rendered only a shell. Squarespace rendered a loading/intro state; 21hrs and Krepling returned an effectively empty page in this browser session. Их detailed interaction behavior не подтверждён. Эти источники используются только в роли, заданной user brief. Mesh3D, Cosmoq, Naya, Glyphic, Nothin', PRODUX и Sharplink вернули inspectable page structures и live scroll movement.

## Cross-reference conclusions

- Spatial background and transition: R6, supported by R1 and R11.
- Product UI cleanliness: R5.
- Functional product storytelling: R10 and R12.
- Pinned long-form choreography: R7 and R8.
- Controlled commercial surfaces: R3 and R9.
- Promotional object moments: R4.

Не смешивать все источники в одну стилистику: R6 задаёт пространственную сцену, R5 - дисциплину интерфейса, R10/R12 - причинный motion, R3 - только pricing materiality.
