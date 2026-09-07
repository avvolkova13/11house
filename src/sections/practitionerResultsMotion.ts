export const REVIEW_WAVE_TICK_COUNT = 250

export type PractitionerRailState = {
  x: number
  cardStepY: number
}

export type PractitionerEntranceState = {
  opacity: number
  y: number
  blur: number
  rotate: number
}

export type PractitionerWaveTickState = {
  height: number
  opacity: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const mix = (from: number, to: number, progress: number) => from + ((to - from) * progress)
const round = (value: number) => Number(value.toFixed(4))

const smootherstep = (start: number, end: number, value: number) => {
  const denominator = Math.max(0.0001, end - start)
  const progress = clamp01((value - start) / denominator)

  return progress ** 3 * (progress * (progress * 6 - 15) + 10)
}

export function getPractitionerResultsProgress(
  sectionTop: number,
  sectionHeight: number,
  stageHeight: number,
  viewportHeight: number,
) {
  const pinOffset = Math.max(0, stageHeight - viewportHeight)
  const runway = Math.max(1, sectionHeight - stageHeight)

  return round(clamp01((-sectionTop - pinOffset) / runway))
}

export function getPractitionerRailState(
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
  railWidth: number,
  horizontalPadding: number,
): PractitionerRailState {
  const clampedProgress = clamp01(progress)
  const travelProgress = smootherstep(0, 1, clampedProgress)
  const flattenProgress = smootherstep(0.05, 0.88, clampedProgress)
  const startX = viewportWidth * 0.233
  const endX = viewportWidth - (horizontalPadding * 2) - railWidth

  return {
    x: round(mix(startX, endX, travelProgress)),
    cardStepY: round(viewportHeight * 0.1 * (1 - flattenProgress)),
  }
}

export function getPractitionerEntranceState(
  sectionTop: number,
  viewportHeight: number,
): PractitionerEntranceState {
  const safeViewportHeight = Math.max(1, viewportHeight)
  const rawProgress = (safeViewportHeight - sectionTop) / (safeViewportHeight * 0.72)
  const progress = smootherstep(0, 1, rawProgress)

  return {
    opacity: round(progress),
    y: round(safeViewportHeight * 0.0234 * (1 - progress)),
    blur: round(8 * (1 - progress)),
    rotate: round(-2 * (1 - progress)),
  }
}

export function getPractitionerWaveTickState(
  progress: number,
  tickIndex: number,
  tickCount = REVIEW_WAVE_TICK_COUNT,
): PractitionerWaveTickState {
  const safeTickCount = Math.max(1, Math.trunc(tickCount))
  const safeTickIndex = Math.min(safeTickCount - 1, Math.max(0, Math.trunc(tickIndex)))
  const peakIndex = Math.round(clamp01(progress) * (safeTickCount - 1))
  const distance = Math.abs(safeTickIndex - peakIndex)
  const amplitude = Math.exp(-(distance ** 2) / (2 * 2.35 ** 2))

  return {
    height: round(7 + (12.4 * amplitude)),
    opacity: round(0.05 + (0.934 * amplitude)),
  }
}
