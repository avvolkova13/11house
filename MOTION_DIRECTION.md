# Motion direction

## Motion language

Spatial motion должен быть причинным: entity появляется, связывается, меняет state или масштаб. Основные инструменты: transform, translate3d, scale, opacity, clip-path/masks, SVG paths, controlled perspective и sticky scenes. Не использовать scroll-jacking, endless floating, heavy blur animation или один fade-up для всего.

Existing Hero и его boundary принадлежат native scroll system через `PageScrollCoordinator -> HeroScrollAdapter`. GSAP/ScrollTrigger предлагается только для Section 3 pinned storytelling. Section 4, если это непрерывная трансформация финального состояния Section 3, остаётся в том же GSAP timeline/ownership. Stage A оценивается до решения по Section 5. Lenis, Motion и R3F не используются; GSAP пока не устанавливается.

## Global contract

- Trigger: natural scroll position, pointer only as secondary ambient input.
- Scroll relation: readable scrub or discrete settled state; no forced scroll.
- Easing: cinematic ease-out for entrances, smooth continuous interpolation for camera, spring-like settling only where it clarifies state.
- Animate only transform/opacity/filter in moderation; never layout properties when avoidable.
- Offscreen scenes pause or reduce work.
- Mobile gets fewer simultaneous layers and shorter pin distances.
- `prefers-reduced-motion`: static composition or short opacity/state transition, no camera travel, no infinite motion.
- Performance risk is tracked per scene before implementation.

## Scene contracts

| Scene | Trigger / pin | Camera / transformation | Lifecycle / easing | Mobile / reduced motion | Risk |
|---|---|---|---|---|---|
| S2 Chaos -> system | enter after Hero, sticky corridor only if architecture allows | fragments separate in z, converge to one workspace | staggered depth release, smooth settle on convergence | fewer fragments, no pin or shorter pin; static layered composition | DOM/object count and runaway scroll integration |
| S3.1 public page -> purchase | scroll progress inside pinned story | page panel advances, product panel comes forward, purchase state morphs | FLIP-like transform, opacity, mask; no screenshot swap | one panel + one state transition; static fallback | fake UI if screenshots absent |
| S3.2 payment -> client -> calendar | causal scroll step | purchase card emits trajectory to client, then calendar | path draw + scale/opacity, no node-graph decoration | vertical causal sequence, reduced paths | too many simultaneous layers |
| S3.3 professional tools | selection/scroll step | shared coordinate anchor transforms between tools | controlled geometry morph, crossfade only when necessary | two or three tool states max; static first state | invented data and complex SVG/WebGL |
| S3.4 10:00 consultation | scroll focus | zoom from week to appointment, surroundings recede | scale/parallax with focus easing | direct appointment state, no video clone | focus loss and heavy crop |
| S3.5 follow-up pause | narrative tempo change | active UI dissolves into calm journal/history line | slower opacity and path reveal | static typography + one line | decorative motion without product meaning |
| S3.6 funnel remembers Anna | causal scroll step | node adds delay/message/condition/action, Anna passes through | sequential state construction, quick settle | linear 3-state story | fake functionality / DOM complexity |
| S4 one -> whole practice | camera pullback | Anna scales into a practice network | continuous zoom-out then settle | bounded network, no 100 avatars | visual noise and performance |
| S5 clients/time/money | each zone enters with own trigger | profile expand, calendar focus, finance update | three distinct motion grammars | stacked scenes, no hover dependence | inconsistent data / three heavy demos |
| S6 brand pause | section enter | almost no camera movement, slow ambient shift | long quiet opacity/mask | static copy | over-animation breaks emotional pause |
| S7 feature constellation | scroll through editorial composition | varied modules reveal via relation, not grid fade | local transitions, no perpetual loops | fewer modules and readable list | generic bento/card overload |
| S8 growth orbit | scroll stages | core service stays fixed while layers orbit/appear | controlled orbital path / scale | stacked expanding rings or vertical sequence | literal astrology and path overload |
| S9 proof/pricing | section enter and plan focus | material surface depth, selected plan hierarchy | restrained surface transition | static plan structure | fake business data and gradient excess |
| S10 return home | final scroll | motif closes around calm center | short dissolve/scale, no spectacle | static CTA composition | CTA obscured by effect |

## Pointer contract

Pointer is ambient depth modulation and focus cue, never required to understand product. It must not fight scroll-driven transforms. On touch, no hover-only state; all meaningful states must be reachable by scroll/tap or static fallback.

## Dependency decision deferred

1. GSAP/ScrollTrigger: useful for pinned scrub sequences; cost is dependency weight and coordination with existing native Hero. Alternative: custom RAF/state machine, but harder to maintain.
2. Lenis: not necessary until native scroll quality is measured; it may conflict with natural scroll and locked Hero.
3. Motion: unnecessary for Three.js scenes; only consider for isolated DOM micro-interactions, after dependency review.
4. R3F: not justified; existing Three.js scene already owns WebGL.

No installation is approved in Phase 2-3.
