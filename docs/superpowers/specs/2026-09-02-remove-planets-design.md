# Remove Planets — Design

## Goal

Remove every celestial body from the rendered Eleven House background while preserving the approved terrain, star field, pointer-driven terrain deformation, infinite signed scroll, camera motion, bloom, and reduced-motion behavior.

## Implementation

- Remove `CelestialBodies` from `CosmicScene` imports, construction, scene registration, frame updates, and disposal.
- Keep `src/cosmic/CelestialBodies.ts` and its assets unchanged so the removal remains reversible.
- Do not alter terrain shaders, pointer trail parameters, star density, camera behavior, post-processing, or CSS.

## Verification

- Run the complete test suite and production build.
- Open the live page at desktop 1440×900 and confirm no planets or rings remain.
- Confirm the terrain, stars, pointer deformation, scrolling, and bloom still render.
- Check the browser console and horizontal overflow.

