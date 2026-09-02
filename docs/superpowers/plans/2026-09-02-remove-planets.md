# Remove Planets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every planet and ring from the rendered background without changing any other visual or motion system.

**Architecture:** Detach the existing `CelestialBodies` subsystem at the `CosmicScene` composition boundary. Keep its implementation and assets intact so the change is reversible and isolated.

**Tech Stack:** TypeScript, React, Three.js, Vite, Vitest

## Global Constraints

- Preserve terrain, stars, pointer deformation, infinite signed scroll, camera motion, bloom, and reduced-motion behavior.
- Do not delete `src/cosmic/CelestialBodies.ts` or its assets.
- Do not commit or push without a separate user command.

---

### Task 1: Detach celestial bodies from the scene

**Files:**
- Modify: `src/cosmic/CosmicScene.ts`

**Interfaces:**
- Consumes: the existing `StarField`, `NebulaField`, and `PostProcessing` scene systems.
- Produces: a `CosmicScene` whose `world` contains only terrain and stars.

- [ ] **Step 1: Remove the import and field**

Delete the `CelestialBodies` import and the `private readonly bodies` field.

- [ ] **Step 2: Remove lifecycle calls**

Delete `CelestialBodies` construction, omit it from `world.add`, and remove its `update` and `dispose` calls.

- [ ] **Step 3: Run automated verification**

Run `npm test -- --run` and expect 9 passing tests. Run `npm run build` and expect exit code 0.

- [ ] **Step 4: Verify the live scene**

At `http://127.0.0.1:5185/` on 1440×900, verify that no planets or rings remain while terrain, stars, pointer deformation, scrolling, and bloom still render. Confirm zero console errors and zero horizontal overflow.

