# Cipher-style workflow metrics — design specification

## Goal

Replace only the three outcome figures inside the `Больше времени на клиентов. Меньше — на рутину.` section with the grid and odometer motion language observed on [Cipher Digital](https://cipherdigital.com/), while preserving ElevenHouse copy, palette, section order, comparison table, and the locked Hero.

## Reference findings

- The reference does not count numeric text. Every digit is an independent vertical `0–9` reel.
- Each reel contains three repeated digit sets and stops in the second set, creating one complete turn before the target digit.
- Reel duration is `1.2s`; reels begin after a short lead-in and are staggered by roughly `50ms` per digit.
- The observed deceleration matches a `power3.out`-style curve: fast travel in the first half, then a long soft landing.
- On the ElevenHouse page the reel starts when the rail reaches the visible center band, so the figures are still on screen while rolling; leaving and re-entering replays the sequence.
- Each cell draws its top edge, then right edge, then bottom edge. Reference timing is `0.8s` with delays `0.12s`, `0.35s`, and `0.58s`.
- Four `8px` corner points scale and fade in after `1.08s`.
- At 1280px the reference uses approximately `70px` figures, `26px` units, `18px` labels, `48px 24px` cell padding, and a `206px` rail height.
- The desktop rail is a continuous pointer-responsive flex surface, not three independent hover scales. At the left edge its measured widths are approximately `35.02% / 34.10% / 30.88%`; at center they are equal; at the right edge they are approximately `31.49% / 32.41% / 36.10%`.
- The width response settles in about `0.2s` with spring-like deceleration and returns to equal columns after the pointer leaves.

## Direction

Use the exact reference mechanics inside the existing warm editorial chapter. The reference photograph and brand assets are not copied. ElevenHouse keeps its light surface and dark ink; the metrics receive the same proportions, line choreography, corner points, and reel behavior.

The result is one full-width three-column measurement rail, not three floating cards. Each value is decomposed into:

- optional large prefix (`−`, `×`, `+`);
- one odometer reel per numeric digit;
- optional smaller baseline suffix (`ч`, `%`);
- benefit label below.

The existing evidence note stays below the rail.

On fine-pointer desktop devices the entire rail softly redistributes its three column widths from the pointer's normalized horizontal position. Cells remain in document flow, never overlap, and their content is not scaled. Touch and narrow layouts remain stable.

## Motion lifecycle

- An `IntersectionObserver` watches the rail with `rootMargin: 0px 0px -45% 0px` and `threshold: 0.15`.
- Entry sets `data-entered="true"`; exit resets it so a later entry replays line, point, and reel transitions.
- Reels animate only `transform`; lines animate only `transform`; points animate `transform` and `opacity`.
- Observation is armed on the next animation frame to avoid inheriting stale HMR state; the frame and observer are cleaned up on unmount.
- A separate fine-pointer effect maps the cursor to `-1…1`, interpolates toward the target via `requestAnimationFrame`, and removes listeners/cancels its frame on unmount.
- With `prefers-reduced-motion: reduce`, the rail renders immediately in its final state and no observer or transition is required.
- If `IntersectionObserver` is unavailable, the component renders its final state.

## Responsive behavior

- Desktop and tablet: three equal columns, shared horizontal rail, internal vertical dividers.
- Narrow mobile: the three metrics become one vertical stack so values remain legible; the same draw order is preserved per cell.
- Numeric figures use `clamp()` and tabular figures; no whole desktop dashboard is scaled down.

## Scope and safety

- Create one isolated metrics component and one pure parser/reel helper module (`workflowMetricModel.ts`) under `src/sections`.
- Modify only the evidence markup in `OneClientStory.tsx` and append uniquely scoped `.workflow-metrics*` styles.
- Do not modify `CosmicHero`, `src/cosmic/**`, global root/body rules, dependencies, package files, or external assets.
- Preserve the exact public copy: `−12 ч`, `×3`, `+34%`, labels, and evidence note.

## Acceptance criteria

1. Exactly three metrics remain visible.
2. Every numeric digit makes a full odometer turn and stops on the correct digit.
3. Digit motion takes `1.2s`, uses soft end deceleration, and has per-digit stagger.
4. Frame lines and corner points reproduce the measured reference timing.
5. Re-entering the viewport replays the animation after it has reset outside the center band.
6. Reduced-motion mode shows the complete final values without motion.
7. The block is visually coherent at desktop and mobile sizes.
8. Existing copy tests, full test suite, TypeScript build, and browser console remain clean.
9. On fine-pointer desktop, the rail matches the measured left/center/right width distributions and softly returns to equal columns on pointer leave.
10. Pointer interaction never runs on narrow or coarse-pointer layouts.
