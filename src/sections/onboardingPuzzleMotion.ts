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

export type OnboardingHandoffState = {
  opacity: number
  scale: number
  blur: number
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

export function getOnboardingFragmentState(
  localProgress: number,
  fragmentIndex: number,
  stepIndex = 0,
): OnboardingFragmentState {
  const local = clamp01(localProgress)
  const safeIndex = getSafeFragmentIndex(fragmentIndex)
  const seed = PUZZLE_SEEDS[safeIndex]
  const column = safeIndex % PUZZLE_COLUMNS
  const row = Math.floor(safeIndex / PUZZLE_COLUMNS)
  const focusX = (3 - column) * 100
  const focusY = (1.5 - row) * 100
  const focusZ = -520

  const isFirstAssembly = stepIndex <= 0
  const entryStart = isFirstAssembly ? 0.04 + seed.order * 0.012 : seed.order * 0.0028
  const entryDuration = isFirstAssembly ? 0.3 : 0.22
  const assembly = smootherstep(entryStart, entryStart + entryDuration, local)
  const entryOpacity = isFirstAssembly
    ? smootherstep(entryStart, entryStart + 0.14, local)
    : assembly
  const startX = isFirstAssembly ? seed.x : focusX
  const startY = isFirstAssembly ? seed.y : focusY
  const startZ = isFirstAssembly ? seed.z : focusZ
  const startScale = isFirstAssembly
    ? (Math.abs(seed.z) > 900 ? 0.2 : 0.82)
    : 0.52
  const startOpacity = isFirstAssembly ? 0 : 0.28
  const startBlur = isFirstAssembly ? 40 : 22
  const entryOvershoot = isFirstAssembly
    ? 0
    : Math.max(0,
      smootherstep(entryStart + 0.04, entryStart + 0.12, local)
      - smootherstep(entryStart + 0.12, entryStart + 0.22, local))

  const lift = smootherstep(0.76, 0.855, local)
  const collapse = smootherstep(0.855, 1, local)
  const liftedZ = mix(0, 96, lift)
  const liftedScale = mix(1, 1.035, lift)
  const liftedBlur = mix(0, 0.8, lift)
  const radialX = column - 3
  const radialY = row - 1.5

  const enteredX = mix(startX, 0, assembly)
  const enteredY = mix(startY, 0, assembly)
  const enteredZ = mix(startZ, 0, assembly) + entryOvershoot * 78
  const enteredScale = mix(startScale, 1, assembly) + entryOvershoot * 0.025
  const enteredOpacity = mix(startOpacity, 1, entryOpacity)
  const enteredBlur = mix(startBlur, 0, assembly)
  const enteredRotateX = mix(isFirstAssembly ? 0 : radialY * -5.5, 0, assembly)
  const enteredRotateY = mix(isFirstAssembly ? 0 : radialX * 5.5, 0, assembly)

  return {
    x: round(mix(enteredX, focusX, collapse)),
    y: round(mix(enteredY, focusY, collapse)),
    z: round(mix(enteredZ + liftedZ, focusZ, collapse)),
    scale: round(mix(enteredScale * liftedScale, 0.52, collapse)),
    opacity: round(mix(enteredOpacity, 0.28, collapse)),
    blur: round(mix(Math.max(enteredBlur, liftedBlur), 22, collapse)),
    rotateX: round(mix(enteredRotateX, radialY * -5.5, collapse)),
    rotateY: round(mix(enteredRotateY, radialX * 5.5, collapse)),
  }
}

export function getOnboardingHandoffState(
  localProgress: number,
  stepIndex = 0,
): OnboardingHandoffState {
  const local = clamp01(localProgress)

  if (stepIndex > 0 && local < 0.24) {
    const settle = smootherstep(0, 0.24, local)

    return {
      opacity: round(mix(0.34, 0, settle)),
      scale: round(mix(0.58, 0.82, settle)),
      blur: round(mix(28, 18, settle)),
    }
  }

  if (local < 0.74) {
    return { opacity: 0, scale: 0.82, blur: 18 }
  }

  const lift = smootherstep(0.74, 0.88, local)
  const collapse = smootherstep(0.88, 1, local)

  return {
    opacity: round(mix(mix(0, 0.72, lift), 0.34, collapse)),
    scale: round(mix(mix(0.82, 1.18, lift), 0.58, collapse)),
    blur: round(mix(mix(18, 26, lift), 28, collapse)),
  }
}

export function getOnboardingCopyState(localProgress: number): OnboardingCopyState {
  const local = clamp01(localProgress)
  const entry = smootherstep(0, 0.14, local)
  const exit = smootherstep(0.82, 0.97, local)

  return {
    opacity: round(entry * (1 - exit)),
    blur: round(Math.max(18 * (1 - entry), 18 * exit)),
    y: round(mix(24, 0, entry) + mix(0, -30, exit)),
  }
}
