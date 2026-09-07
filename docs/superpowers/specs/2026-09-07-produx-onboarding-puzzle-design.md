# Produx-style Onboarding Puzzle — Design Specification

## Goal

Rebuild only the four-step onboarding chapter inside `04 · Возможности` as a centered, sequential scroll story inspired by the supplied [Produx](https://www.produx.design/) reference. Each step must show its title above a single centered ElevenHouse interface screenshot and a benefit-led caption below it. The existing locked Hero and the following `От построения карты до оплаты — один рабочий процесс` chapter remain unchanged.

## Reference findings

- The reference is a sticky scroll scene rather than a timed autoplay carousel.
- One image is divided into a gapless `7 × 4` grid of 28 fragments.
- At 1280px the assembled image is approximately `69.4vw × 498px` with an aspect ratio close to `1.784 / 1`.
- Fragment images use `background-size: 700% 400%` and the matching row/column background position.
- Pieces begin at deterministic but irregular X/Y offsets, often several tile widths from their destination, with Z depth ranging from foreground to beyond `-2000px`.
- Unstarted deep pieces use approximately `scale(0.2)`, `opacity: 0`, and `blur(40px)`.
- Fragments enter in an irregular stagger. Active pieces quickly reach about `0.8` opacity, then softly settle at `opacity: 1`, `blur(0)`, zero translation, zero depth, and scale `1`.
- Every tile is `101%` of its grid cell so the final image has no hairline seams.
- The introductory type moves upward and is progressively clipped/blurred while the image pieces take visual priority.
- The reference uses roughly `650vh` of sticky runway for its complete hero sequence.

## Chosen direction

Use one reusable 28-fragment DOM puzzle stage for all four ElevenHouse onboarding steps. The visible step changes only while the puzzle is substantially dispersed, so a screenshot source swap cannot flash inside a fully assembled image. This keeps the implementation visually faithful while avoiding four simultaneous 28-layer filter stacks.

The stage is centered and structured vertically:

1. top: section eyebrow, current step number, and current step title;
2. center: the puzzle-built interface screenshot;
3. bottom: one concise benefit-led caption.

The existing four approved step titles remain unchanged. Add these captions:

1. `Профиль и данные практики собраны в одном рабочем пространстве.`
2. `Клиент сразу видит формат, стоимость и переходит к записи.`
3. `Время, предоплата и напоминания работают без ручной переписки.`
4. `После консультации система помогает продолжить контакт и вернуть клиента.`

## Scroll architecture

- Expand the onboarding share of `ProductProof` from the current first 20% to approximately 42% of section progress.
- Increase the section runway only enough to preserve the existing physical scroll distance of the five-card process chapter; target approximately `1420svh` desktop height.
- Each onboarding step receives one equal local interval.
- Within each step:
  - `0.00–0.14`: title and caption resolve from soft blur and vertical offset;
  - `0.04–0.66`: fragments assemble in deterministic irregular order;
  - `0.66–0.82`: complete screenshot holds crisp and centered;
  - `0.82–1.00`: copy blurs away and fragments softly disperse before the next step.
- Step changes occur only near the locally dispersed state. Reverse scrolling must reconstruct the previous step deterministically.
- The handoff into the existing process chapter remains a crossfade/vertical transition, but its start moves to the new onboarding boundary.

## Puzzle model

Create a pure motion module that owns:

- the 28 deterministic fragment seeds;
- grid row/column and background-position calculation;
- step index/local-progress calculation;
- per-fragment X, Y, Z, scale, opacity, and blur;
- title/caption opacity, blur, and vertical offset;
- assembled hold and outgoing dispersion;
- compact/reduced-motion fallbacks.

Use a smootherstep-style curve for zero-jerk landings. Blur is coupled to unresolved depth and capped at `40px`. Animate only `transform`, `opacity`, and `filter`; update inline custom properties in a single `requestAnimationFrame` scroll loop.

## Component structure

- `ProductProof.tsx` remains the section owner and existing scroll coordinator.
- Add a focused `OnboardingPuzzle` component responsible for the visible stage, accessible copy, 28 decorative fragments, and source swapping.
- The component receives the existing `onboardingSteps` data extended with `caption` and a screenshot-specific `objectPosition` if needed.
- Keep one real `<img>` with the active screenshot and meaningful alt text for accessibility; puzzle fragments are decorative and `aria-hidden`.
- Preserve an accessible ordered list of all four steps even though only one is visually active in the sticky desktop scene.

## Visual direction

- Retain the section's existing dark navy ElevenHouse palette; do not copy Produx branding, imagery, typography, or logos.
- Use the real ElevenHouse screenshots already in `public/assets/product-screenshots`.
- Assembled screen width: `min(70vw, 1120px)` with a maximum height near `55svh` and the screenshot's natural wide dashboard ratio.
- Use a subtle cool edge and very restrained shadow only after assembly; the depth effect comes primarily from fragment motion and focus.
- Center all onboarding text. The step title remains readable in no more than two desktop lines; the caption stays below the image and does not overlap it.

## Responsive and reduced motion

- Desktop above 900px: sticky scroll-controlled single-stage puzzle.
- At 900px and below: render four centered static steps in document flow. Each uses a large action-focused screenshot crop, title above, caption below, and no 28-layer animated puzzle.
- `prefers-reduced-motion: reduce`: same static four-step sequence at every viewport.
- Source images remain lazy-loaded except the first onboarding image, which should be eager enough to avoid an empty first assembly.

## Performance and lifecycle

- Exactly 28 animated fragment elements exist in the desktop puzzle stage.
- Only the active screenshot source is painted by those fragments.
- Scroll and resize listeners are passive and feed one animation-frame render queue.
- Cancel the pending frame and remove listeners on unmount.
- Avoid new dependencies, canvases, video decoding, and changes to renderer/global styles.

## Acceptance criteria

1. The onboarding chapter contains exactly four approved steps and presents one centered step at a time on desktop.
2. Every visible step has its title above, screenshot centered, and benefit caption below, all center-aligned.
3. The screenshot visibly assembles from 28 irregular 3D fragments with staggered movement, depth-linked blur, scale, and opacity closely matching the Produx reference.
4. The assembled state is gapless, crisp, and held long enough to read.
5. Forward and reverse scrolling produce deterministic scenes without flashing the next image while assembled.
6. Mobile and reduced-motion experiences render all four steps clearly without sticky or filter-heavy animation.
7. The existing process-card chapter, public step titles, section order, and locked Hero are unchanged.
8. Focused tests, the full test suite, production build, browser console, and whitespace checks pass.

## Scope exclusions

- No changes to `CosmicHero`, `src/cosmic/**`, Hero dependencies, global root/body rules, package files, or public product assets.
- No recreation of Produx brand assets or imagery.
- No redesign of the following five-card process chapter in this task.
- No autoplay, drag interaction, or navigation controls.
