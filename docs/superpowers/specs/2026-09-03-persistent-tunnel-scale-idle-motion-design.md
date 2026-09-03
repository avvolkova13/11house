# Persistent Tunnel Scale and Idle Motion Design

## Objective

Доработать только сформированный тоннель после утверждённого перехода: он должен всё время окружать камеру, сохранять крупный проекционный масштаб и ощутимо двигаться даже при остановленном скролле.

## Source of truth

- Geometry and motion: live reference `https://mesh3d.gallery/the-state-of-the-gallery` and the user-provided `15.33.44` frame.
- Palette and visual material: current ElevenHouse implementation.
- Existing terrain-to-tunnel transition is locked for this change.

## Diagnosed mismatch

1. The current final funnel shrinks its radius (`0.52 -> 0.46`).
2. The rendered surface recedes from `z=-118` to `z=-173` while camera flight also changes depth, increasing projected distance.
3. Existing tests explicitly require the opening to tighten and the funnel to compact.
4. Idle motion mostly advances background stars. Tunnel rotation is an oscillation of at most `0.012rad` with a very long period, so the shell appears stationary.

## Approved approach

Keep the current single-surface morph and transition. Once presentation begins:

- stop dive-dependent radius shrink;
- keep camera-to-surface projected distance stable;
- apply a small presentation-only scale compensation so near ribs remain beyond viewport edges;
- preserve the offset throat and curved camera path;
- add continuous autonomous orbit/flow to the tunnel shell and tunnel particles;
- let scroll velocity accelerate the existing flow instead of being its only visible driver.

## Motion contract

- At presentation start and at full dive, the projected mouth scale must not decrease.
- The near mouth must remain outside the viewport on desktop and mobile.
- At zero scroll velocity, a 3–6 second observation must show visible contour rotation and particle migration.
- Motion must remain slow enough for overlaid copy to stay readable.
- `prefers-reduced-motion` removes orbit, flow acceleration, roll, and camera drift while preserving the static large tunnel.
- The earlier terrain and formation phases remain numerically unchanged.

## QA

- Unit tests cover persistent projection, idle state, reduced motion, and unchanged pre-presentation geometry.
- Desktop visual checks at tunnel start, middle, end, and two no-scroll frames.
- Mobile visual checks at the same stages.
- Full tests and production build must pass.

