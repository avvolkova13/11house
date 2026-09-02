# ElevenHouse: правила работы

## Goal

Создать production-quality redesign лендинга ElevenHouse. Лендинг продаёт переход: разрозненная практика -> единая система -> работа с одним клиентом -> сопровождение -> автоматизация -> управление всей практикой.

## Language

- Communication, planning, QA, reviews: русский.
- Code, identifiers, paths: английский.
- Public landing copy: русский.

## Core rule: locked Hero

Существующий первый экран утверждён и считается locked / immutable region. Весь новый дизайн начинается после него.

Без отдельного согласования нельзя менять его layout, тексты, типографику, размеры, фон, графику, motion, DOM, responsive, header, компоненты, а также dependencies и global styles, способные на него повлиять.

Полностью заблокированы:

- `src/components/CosmicHero.tsx`;
- `src/cosmic/CosmicScene.ts`, `NebulaField.ts`, `StarField.ts`, `PostProcessing.ts`, `PointerTrail.ts`;
- `src/cosmic/motion.ts`, `copyMotion.ts`, `starProfile.ts`;
- `src/cosmic/shaders/*` и связанные тесты `src/cosmic/*.test.ts`;
- `src/cosmic/CelestialBodies.ts` и `public/assets/planets/*` как неактивная, но относящаяся к Hero реализация.

Общие файлы с locked-областями:

- `src/styles.css`: все существующие global rules и Hero selectors locked; новые стили допустимы только под уникальными scoped selectors после cascade-impact review;
- `src/App.tsx`: вызов `<CosmicHero />` и его порядок locked; будущая интеграция требует сначала согласовать scroll-runway architecture;
- `src/main.tsx`, `index.html`, package/lock files и Vite/TypeScript configs: перед изменением обязательна Hero-impact проверка.

Изменения `:root`, `html`, `body`, `#root`, global `*`, overflow, viewport sizing, background, font inheritance, color scheme, renderer dependencies и animation timing требуют отдельной проверки и согласования при риске влияния на Hero.

## Design principle

Нельзя генерировать redesign из общих представлений о SaaS, AI, astrology, CRM, Awwwards или futuristic websites. У каждого крупного решения должен быть traceable reference origin. Design lead должен отвечать: «Из какого предоставленного референса взят принцип этого решения?»

Допустимо переносить принципы composition, spatial logic, motion logic, card architecture, transition, typography relationship, depth и rhythm. Нельзя копировать бренд, контент, изображения, логотипы, proprietary assets и уникальные готовые иллюстрации.

## Anti-AI design rule

Избегать generic SaaS bento, повторяющихся rounded cards, icon-title-paragraph cards, случайных radial gradients, purple-on-black AI aesthetics, decorative glow, fake glassmorphism, dashboard screenshots без сюжета, endless pills, одинаковых feature grids, стандартных landing templates, случайных сфер/планет, star wallpaper, частиц без композиционной функции, одинаковой высоты секций и одного fade-up/motion-паттерна везде.

Космическая тема выражается через пространство, глубину, орбитальную композицию, перспективу, масштаб, свет, движение, темп, траектории и ощущение системы, а не literal astrology clichés.

## Motion principle

Motion служит storytelling и product explanation. Каждая сложная анимация должна объяснять продукт, показывать причинно-следственную связь или transformation, переводить между этапами, менять масштаб истории либо направлять внимание. До реализации определить reduced-motion behavior, cleanup lifecycle, responsive behavior и performance budget.

## Agents, skills и workflow

Использовать минимум необходимых специалистов. Не разрешать двум агентам одновременно менять одни файлы. Skill считается использованным только если он установлен, instructions полностью прочитаны и рекомендации реально применены.

Порядок: project audit -> skills audit -> reference research -> reference matrix -> design direction -> motion direction -> approval -> implementation -> visual review -> responsive review -> motion QA -> performance QA -> accessibility QA.

Не переходить между крупными фазами без approval. Не коммитить, не пушить, не публиковать, не устанавливать dependencies и не менять locked Hero без прямого разрешения пользователя.
