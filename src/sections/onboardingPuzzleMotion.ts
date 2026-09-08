export const PUZZLE_COLUMNS = 7
export const PUZZLE_ROWS = 4
export const PUZZLE_FRAGMENT_COUNT = PUZZLE_COLUMNS * PUZZLE_ROWS

type PuzzleSeed = {
  x: number
  y: number
  z: number
  order: number
}

export type OnboardingFragmentState = {
  x: number
  y: number
  z: number
  scale: number
  opacity: number
  blur: number
  rotateX: number
  rotateY: number
}

export type OnboardingCopyState = {
  opacity: number
  blur: number
  y: number
}

const PUZZLE_SEEDS: readonly PuzzleSeed[] = [
  { x: -520, y: 440, z: -1200, order: 18 },
  { x: 430, y: 70, z: -800, order: 10 },
  { x: 280, y: 310, z: -110, order: 0 },
  { x: -560, y: -20, z: -1300, order: 23 },
  { x: -250, y: -170, z: -1200, order: 4 },
  { x: 230, y: 100, z: -360, order: 2 },
  { x: 240, y: -40, z: -950, order: 14 },
  { x: -430, y: 380, z: -1400, order: 17 },
  { x: -210, y: -320, z: -780, order: 12 },
  { x: -330, y: -70, z: -1600, order: 20 },
  { x: -510, y: -30, z: -1000, order: 25 },
  { x: 340, y: 300, z: -1300, order: 9 },
  { x: -90, y: -430, z: -2100, order: 22 },
  { x: -10, y: -320, z: -950, order: 15 },
  { x: 80, y: -70, z: 430, order: 6 },
  { x: 120, y: -12, z: 250, order: 1 },
  { x: 20, y: -310, z: -700, order: 11 },
  { x: 320, y: -70, z: -850, order: 7 },
  { x: -390, y: 220, z: -1100, order: 16 },
  { x: 165, y: -300, z: -2260, order: 5 },
  { x: -820, y: -200, z: -270, order: 3 },
  { x: 470, y: -500, z: -1800, order: 21 },
  { x: -190, y: -240, z: -1200, order: 13 },
  { x: 10, y: -60, z: -100, order: 8 },
  { x: -10, y: -410, z: -1000, order: 19 },
  { x: -300, y: 340, z: -1450, order: 24 },
  { x: -245, y: -50, z: -600, order: 26 },
  { x: -65, y: -450, z: -1000, order: 27 },
]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const mix = (from: number, to: number, progress: number) => from + ((to - from) * progress)
const round = (value: number) => Number(value.toFixed(4))

const smootherstep = (start: number, end: number, value: number) => {
  const progress = clamp01((value - start) / (end - start))
  return progress ** 3 * (progress * (progress * 6 - 15) + 10)
}

const getSafeFragmentIndex = (fragmentIndex: number) => (
  Math.min(PUZZLE_FRAGMENT_COUNT - 1, Math.max(0, Math.trunc(fragmentIndex)))
)

export function getOnboardingPuzzlePosition(progress: number, stepCount: number) {
  const safeCount = Math.max(1, Math.trunc(stepCount))
  const clampedProgress = clamp01(progress)

  if (clampedProgress === 1) {
    return { stepIndex: safeCount - 1, local: 1 }
  }

  const scaled = clampedProgress * safeCount
  const stepIndex = Math.min(safeCount - 1, Math.floor(scaled))

  return {
    stepIndex,
    local: round(scaled - stepIndex),
  }
}

export function getPuzzleBackgroundPosition(fragmentIndex: number) {
  const safeIndex = getSafeFragmentIndex(fragmentIndex)
  const column = safeIndex % PUZZLE_COLUMNS
  const row = Math.floor(safeIndex / PUZZLE_COLUMNS)

  return {
    x: round((column / (PUZZLE_COLUMNS - 1)) * 100),
    y: round((row / (PUZZLE_ROWS - 1)) * 100),
  }
}

/** Six depth anchors arrive first; the remaining pieces resolve in their wake. */
export function getOnboardingFragmentState(
  localProgress: number,
  fragmentIndex: number,
  _stepIndex = 0,
): OnboardingFragmentState {
  const local = clamp01(localProgress)
  const seed = PUZZLE_SEEDS[getSafeFragmentIndex(fragmentIndex)]
  const lead = seed.order < 6
  const approach = 1 - (1 - clamp01(local / 0.12)) ** 4
  const assemblyProgress = clamp01((local - (lead ? 0.12 : 0.18 + seed.order * 0.004)) / (lead ? 0.28 : 0.18))
  const assembly = lead
    ? assemblyProgress < 0.5 ? 8 * assemblyProgress ** 4 : 1 - (-2 * assemblyProgress + 2) ** 4 / 2
    : 1 - (1 - assemblyProgress) ** 4
  const depthBlur = Math.abs(seed.z) > 900 ? 12 : 0
  const x = lead ? mix(seed.x * 2, seed.x, approach) : seed.x
  const y = lead ? mix(seed.y * 3, seed.y, approach) : seed.y
  const z = lead ? mix(seed.z - 1500, seed.z, approach) : -1000
  return {
    x: round(x * (1 - assembly)),
    y: round(y * (1 - assembly)),
    z: round(z * (1 - assembly)),
    scale: round(mix(lead ? mix(0.2, 1, approach) : 0.2, 1, assembly)),
    opacity: round(lead ? mix(0.8 * approach, 1, assembly) : assembly),
    blur: round((lead ? mix(depthBlur + 20, depthBlur, approach) : 40) * (1 - assembly)),
    rotateX: 0,
    rotateY: 0,
  }
}

export function getOnboardingSurfaceState(localProgress: number) {
  const local = clamp01(localProgress)
  const entry = smootherstep(0, 0.025, local)
  const exit = smootherstep(0.86, 1, local)
  return {
    opacity: round(entry * (1 - exit)),
    scale: round(1 + 0.055 * exit),
    assembled: round(smootherstep(0.47, 0.51, local)),
  }
}

export function getOnboardingCopyState(localProgress: number): OnboardingCopyState {
  const entry = smootherstep(0.1, 0.24, clamp01(localProgress))
  const exit = smootherstep(0.84, 0.98, clamp01(localProgress))
  return {
    opacity: round(entry * (1 - exit)),
    blur: round(6 * Math.max(1 - entry, exit)),
    y: round(14 * (1 - entry) - 10 * exit),
  }
}

/** PRODUX-style finite 1.5s scrub; no perpetual interpolation loop. */
export function sampleOnboardingScrub(from: number, to: number, elapsedMs: number) {
  if (elapsedMs <= 0) return from
  if (elapsedMs >= 1500) return to
  return from + (to - from) * (1 - 2 ** (-10 * elapsedMs / 1500))
}
