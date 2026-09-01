# Eleven House Cosmic Hero — Design Specification

## Objective

Build a standalone desktop-first hero prototype for Eleven House. The hero must reinterpret the motion language of `mesh3d.gallery/the-state-of-the-gallery` as an astrological journey through deep space: a continuously moving GPU-rendered environment that reacts to pointer movement and turns scrolling into camera travel through stars, nebulae, and rare celestial bodies.

The reference is used for interaction principles, spatial rhythm, and perceived depth only. Its branding, assets, green palette, and exact visual composition are not copied.

## Experience Direction

The scene represents the Eleventh House in astrology: collective consciousness, friendship, networks, hopes, and the future. The art direction is an editorial astronomical observatory rather than a conventional science-fiction interface.

The initial desktop frame must already feel finished and valuable without interaction. Ambient movement then reveals additional depth:

- a near-black field with midnight blue, indigo, ultraviolet, pale celestial blue, and restrained antique-gold light;
- layered star populations with meaningful differences in scale, color temperature, focus, and velocity;
- volumetric-looking nebular structures with organic deformation;
- infrequent planets or celestial silhouettes positioned across different depth planes;
- a relatively quiet center for future hero copy, with denser movement around the edges and lower third;
- subtle grain, vignette, chromatic separation, atmospheric haze, and controlled bloom.

## Scope

This iteration contains one standalone desktop hero block only:

- full viewport canvas, minimum `100svh`;
- a restrained semantic UI overlay for Eleven House branding and minimal navigation markers;
- no full product navigation, forms, cards, content sections, authentication, or backend;
- enough vertical scroll range inside the demo to demonstrate forward and backward flight while the hero remains visually dominant.

## Technical Architecture

Use React, Vite, TypeScript, Three.js, and custom GLSL shader materials.

The scene is divided into focused modules:

1. `CosmicScene` owns the renderer, camera, lifecycle, resize handling, animation loop, and cleanup.
2. `StarField` uses `BufferGeometry` and a custom shader to render several thousand GPU particles with depth-aware size, opacity, twinkling, and velocity-dependent streaking.
3. `NebulaField` uses layered shader-driven surfaces or point volumes with fractal Brownian motion and domain warping to create slow organic gas flows.
4. `CelestialBodies` creates two to four restrained procedural spheres or silhouettes with atmospheric rim lighting and optional ring geometry.
5. `CameraController` transforms normalized pointer coordinates and scroll velocity into damped yaw, pitch, lateral drift, camera dolly, and depth-layer parallax.
6. `PostProcessing` applies selective bloom, restrained chromatic aberration, vignette, and film grain. If full post-processing harms performance, equivalent effects may be implemented in lightweight shader or CSS overlays.
7. `HeroOverlay` contains the accessible HTML layer and does not participate in the render loop.

React state must not update per frame. Mutable animation values remain inside the scene controller and are advanced using delta time.

## Motion Model

### Ambient motion

When idle, the camera drifts slowly and the star field advances at a low baseline speed. Nebula layers deform at independent frequencies. Stars twinkle asynchronously; there is no synchronized pulsing.

### Pointer response

Pointer coordinates are normalized to `[-1, 1]`. Target camera yaw, pitch, and lateral offset are calculated nonlinearly and approached using delta-time damping. Near, middle, and far layers use different response amplitudes. The scene continues briefly after pointer movement and settles without snapping.

### Scroll response

Wheel and document scrolling produce a signed velocity impulse. The impulse controls:

- forward or backward camera dolly;
- star-field Z velocity;
- apparent particle elongation;
- parallax separation between depth layers;
- short-lived bloom and atmospheric intensity accents.

The impulse decays exponentially when scrolling stops. Stars that pass the camera are recycled into the opposite depth range without visible popping. Direction reversal must also be continuous.

### Reduced motion

When `prefers-reduced-motion` is active, pointer and scroll flight are disabled or heavily reduced. A very slow ambient drift remains, with no aggressive streaking or camera acceleration.

## Visual Composition

The hero uses a calm central void with an offset brand lockup. A small constellation-like interface frame may sit near the perimeter, but must not compete with the scene. Typography is refined and editorial, avoiding generic technology styling.

Planets remain rare and partially obscured. One large body may enter at a frame edge, one distant body may sit near the horizon, and one ring or eclipse silhouette may appear only through movement. This preserves scale and mystery.

## Performance and Resilience

- cap renderer pixel ratio, normally at `2` and lower on constrained devices;
- choose particle count from viewport size and device capability;
- reuse typed arrays and GPU buffers;
- avoid allocations inside the render loop;
- pause rendering when the document is hidden;
- dispose geometry, materials, render targets, and listeners on unmount;
- provide a static CSS fallback if WebGL initialization fails;
- preserve readable overlay contrast independently of canvas output.

## Verification

The prototype is accepted when:

- the production build completes without TypeScript or bundler errors;
- the hero fills a desktop viewport without overflow defects;
- the scene remains visually convincing in a static screenshot;
- pointer movement produces smooth, inertial depth rather than direct cursor following;
- scrolling clearly reads as travel through 3D space rather than a flat scale transform;
- no obvious particle reset, camera jump, or planet popping is visible;
- reduced-motion behavior is present;
- browser console contains no runtime errors;
- the implementation remains responsive at a normal desktop viewport.

## Non-Goals

- photorealistic astronomical simulation;
- copying reference source code or protected assets;
- mobile art-direction refinement in this iteration;
- a complete Eleven House website;
- external image or video assets required for the primary visual effect.
