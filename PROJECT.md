# ElevenHouse

## Product

ElevenHouse - рабочее пространство для практики астролога.

Подтверждённые области: CRM/клиенты, календарь, записи, видеоконсультации, продукты астролога, оплаты, продажи, выплаты/финансы, автоматические воронки, отзывы, публичная страница астролога, натальные карты, нумерология, Матрица судьбы, Дизайн человека, астрокалендарь, астродневник и AI-функции внутри продукта. Неподтверждённые возможности не придумывать.

## Landing goal

Создать не перечень функций, а желание: «Я хочу, чтобы моя практика была организована именно так». История: астролог занимается астрологией; ElevenHouse собирает систему вокруг его практики.

## Approved landing structure

1. Existing Hero - LOCKED.
2. Chaos -> ElevenHouse.
3. One client inside ElevenHouse - главная storytelling-секция.
4. One client -> whole practice.
5. Practice under control.
6. Emotional brand pause.
7. Everything inside.
8. Practice growth.
9. Social proof + pricing.
10. Final CTA.

Hero не реализовывать заново и не redesign-ить.

## Current architecture

- Working directory: `/Users/anastasiavolkova/Documents/ChatGPT/11хаус`.
- React 19.1.1 + Vite 7 + TypeScript 5.9; npm и `package-lock.json`.
- Routing отсутствует; `src/main.tsx` монтирует `App`, а `src/App.tsx` рендерит только `CosmicHero`.
- Runtime dependencies: React, React DOM, Three.js. UI library отсутствует.
- Styling: один global `src/styles.css`; нет Tailwind, CSS Modules, CSS-in-JS и formal tokens.
- Fonts: system stack (`Avenir Next`, `Helvetica Neue`, Helvetica, sans-serif), webfonts отсутствуют.
- Tests: Vitest для motion, copy settling, pointer trail и star profile.

## Animation/rendering stack

Native scroll/pointer/resize/visibility/media-query listeners, `requestAnimationFrame`, custom damping/velocity helpers, CSS transforms/opacity/filters/transitions, Three.js, custom GLSL, EffectComposer, bloom и output passes. GSAP, Lenis, Motion/Framer Motion, React Three Fiber и Swiper не установлены.

## Hero architecture

`src/components/CosmicHero.tsx` владеет DOM, утверждённым copy, fragment heading motion, scroll settling, reduced motion и lifecycle `CosmicScene`.

`CosmicScene.ts` управляет renderer/camera/input/travel/parallax/lifecycle; `NebulaField.ts` - displaced terrain и particles; `StarField.ts` - procedural stars; `PostProcessing.ts` - bloom/output; остальные cosmic helpers и shaders обеспечивают pointer trail, motion и визуальные профили.

Hero процедурный Canvas/WebGL. `public/assets/planets/*` и `CelestialBodies.ts` сейчас неактивны, но относятся к Hero и locked. Референсы находятся в `docs/design-reference/`.

Responsive baseline: CSS `max-width: 700px`, DPR branch ниже 1100px, `prefers-reduced-motion` и dev query flag, canvas fallback.

## Integration constraint

`.cosmic-runway` занимает `100000px` scroll range, а `.cosmic-hero` sticky. Простое добавление секций после `<CosmicHero />` поместит их после всего runway. Изменение runway, sticky behavior, recentering или progress mapping меняет утверждённый Hero. Phase 4 должна предложить сохраняющую Hero архитектуру и получить отдельное approval до изменения кода.
