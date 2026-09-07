# Produx-inspired Practitioner Results Design

## Intent

Rebuild the ElevenHouse practitioner-results section with the spatial and motion logic measured from the testimonial section on `produx.design`. The implementation must preserve ElevenHouse copy and identity, must not reuse Produx assets, and must not change the locked Hero or global root styles.

## Reference matrix

| Decision | Reference origin | ElevenHouse translation |
| --- | --- | --- |
| Dark olive stage | Produx testimonial background `rgb(48, 57, 48)` | Scoped section surface `#303930` |
| Warm grey cards | Produx card background `rgb(212, 204, 204)` | Scoped cards `#d4cccc` with dark ElevenHouse copy |
| Scroll runway | Produx spacer measured at `3.2 × viewport height` | Section height `320svh` on desktop |
| Sticky composition | Produx stage measured at about `123vh`, pinned with a negative top offset | Sticky stage `123svh`, `top: -23svh` |
| Card geometry | Produx card width `28.5vw`, aspect ratio `0.95`, gap `2.22vw` | Same desktop values with safe min/max constraints |
| Diagonal cascade | Produx cards enter at `0 / 72 / 144 / 216px` | Three cards enter at `0 / 10vh / 20vh` |
| Horizontal scrub | Produx rail travels left while the cascade flattens | `requestAnimationFrame` maps section scroll progress to rail X and per-card Y |
| Wave ruler | Produx uses 250 low-opacity ticks and a moving 7-tick peak | Render 250 aria-hidden ticks; Gaussian peak follows the rail progress |
| Heading and link settle | Produx copy resolves with vertical movement, rotation and blur | Two-line Russian heading and an underlined text link use the same restrained entrance |
| Card anatomy | Circular portrait, name/speciality at top, large quote at bottom | Privacy-safe monogram portrait, practitioner identity, result line and quote |

## Content

- Heading: `Реальные результаты` / `практиков.`
- Three existing practitioner stories remain unchanged.
- The result is integrated beneath each practitioner identity so the cards retain a single readable quote hierarchy.
- The upper-right link reads `ВСЕ ОТЗЫВЫ` and targets the section itself until a dedicated stories page exists.

## Motion model

1. The section enters in normal document flow.
2. The heading lines reveal from a clipped baseline. The upper-right link settles from `translateY(2.34vh) rotate(-2deg) blur(8px)`.
3. Once the sticky stage reaches its measured pin offset, progress maps from `0…1` across the remaining runway.
4. The rail moves from `23.3vw` to the X position that places the last card inside the right page inset.
5. Card vertical offsets shrink from `index × 10vh` to zero with smootherstep easing.
6. A 250-tick ruler stays fixed while a narrow amplitude peak travels from left to right.
7. Pointer dragging scrolls the same runway, keeping cards, heading and ruler on one source of truth.

## Responsive and accessibility

- At `max-width: 760px`, remove the tall runway and sticky pinning. Keep the same visual language in a native horizontal, scroll-snap rail.
- At `prefers-reduced-motion: reduce`, remove the runway, transforms, blur, and pointer-driven scrolling; preserve all content and native scrolling.
- The decorative ruler and monograms are hidden from assistive technology.
- The section remains navigable by heading and link; quotes remain semantic `blockquote` content.

## Performance budget

- One passive scroll listener and one `requestAnimationFrame` update loop only while a frame is pending.
- Transform and opacity are the only continuously animated properties.
- No new dependencies, images, canvas, WebGL, or timers.
- Every listener, pointer capture state and animation frame is cleaned up on unmount.

