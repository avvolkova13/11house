# Naya-style product card stack — design specification

## Scope

Redesign only the `product-proof__process-chapter` inside `ProductProof`: the chapter titled “От построения карты до оплаты — один рабочий процесс.” The locked `CosmicHero`, onboarding chapter, WorkflowMetrics, pricing, and all later sections remain unchanged.

## Reference origin

The spatial and motion system is derived from the capabilities card sequence at `https://naya-studio-dubai.webflow.io`. Direct inspection at 1280×720 measured these reference properties:

- portrait card base size about 29.5vw × 59.6vh;
- 25.6px corner radius;
- translucent white gradient over a near-black/navy moving image layer;
- 5px entry blur fading to 0;
- alternating left/right entry with approximately 360px horizontal travel, 260px upward offset, 10° rotation, and 1.1 scale;
- five cards accumulate into a compact central fan, then leave upward one at a time;
- scroll runway roughly eleven viewport heights for four reference cards.

The implementation copies these principles and timings, not Naya’s brand assets, copy, fonts, video, or border artwork.

## Chosen composition

Keep the existing chapter heading at the top-left. Replace the current wide screenshot/copy crossfade with five portrait cards centered in a sticky viewport. Each card contains:

1. a real ElevenHouse UI screenshot as a full-bleed atmospheric layer;
2. a navy/black tint and a soft blue light wash to match the reference palette;
3. the scene number at the top;
4. the benefit-led title centered in large, light-weight type;
5. the existing explanation at the bottom;
6. a fine inset border and soft depth shadow.

The existing five product scenes and their Russian content remain intact. The “А ещё внутри…” line remains visible near the lower-right edge of the chapter.

## Motion model

The process chapter receives a normalized progress value from 0 to 1. Every card has three phases:

- **entry:** staggered by index; starts above the viewport and far on alternating horizontal sides, scaled to 1.1, rotated ±10°, blurred 5px, and transparent; then approaches the center with a power-style ease-out;
- **settle:** all entered cards remain visible and continue a slow secondary drift into a compact fan with individual offsets, rotations, and scale near 1;
- **exit:** after the full stack is visible, cards leave upward in reverse visual order one by one, with their rotation resolving toward 0 and no reintroduced blur.

The heading gently fades as the stack becomes dominant but remains legible long enough to establish the chapter. Motion is scrubbed directly by scroll with no timer and no delayed state changes.

## Responsive behavior

- Desktop/tablet above 900px: sticky Naya-style stack with alternating side entries and upward exits.
- Mobile at or below 900px: cards become a static vertical sequence because the four-step onboarding chapter already exceeds one viewport and cannot share the desktop sticky runway without clipping. Each card uses a large crop of one interface action rather than a shrunken dashboard.
- Very short viewports clamp card height to avoid clipping the title/footer.

## Reduced motion

For `prefers-reduced-motion: reduce` and the existing development reduced-motion query, remove the sticky runway and render the five cards as a vertical static list. No blur, transforms, or scroll-linked updates remain.

## Accessibility and performance

- Keep semantic `article`, heading hierarchy, and descriptive image alt text.
- Decorative tint/border layers are hidden from assistive technology.
- Update only CSS custom properties in one `requestAnimationFrame` scroll handler.
- Animate transform, opacity, and filter only; avoid layout reads per card.
- Preserve the existing cleanup of scroll/resize listeners and animation frame.

## Acceptance criteria

- Five cards are visibly distinct and stack in order rather than crossfading in place.
- Entry direction alternates right/left, blur resolves 5→0, and cards settle into a compact fan.
- Once all cards are stacked, they exit upward sequentially.
- Cards visually match the reference’s dark navy, translucent, rounded, softly blurred treatment while using only ElevenHouse assets/content.
- Desktop, mobile, and reduced-motion behavior are verified.
- Existing copy tests, motion tests, full test suite, and production build pass.
