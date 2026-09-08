export const REVIEW_WAVE_TICK_COUNT = 250
export const REVIEW_SCRUB_MS = 1500
export const REVIEW_TOUCH_HOLD_MS = 200

export type PractitionerRailState = { x: number; cardStepY: number }
export type PractitionerWaveTickState = { height: number; opacity: number }

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const round = (value: number) => Number(value.toFixed(4))

/** Measured from PRODUX Reviews on 2026-09-08; these are section-local units. */
export function getPractitionerLayout(viewportWidth: number) {
  const width = Math.max(1, viewportWidth)
  const mobile = width <= 640
  const tablet = width <= 1024
  const padding = width * (mobile ? 0.0597 : tablet ? 0.041 : 0.055)
  const tickWidth = width * (mobile ? 0.0057 : tablet ? 3 / 1024 : 0.0014)
  const tickGap = width * (mobile ? 0.0075 : tablet ? 0.004 : 0)
  return {
    padding,
    cardWidth: width * (mobile ? 0.729 : tablet ? 0.401 : 0.285),
    gap: width * 0.0222,
    tickWidth,
    tickCount: Math.min(REVIEW_WAVE_TICK_COUNT, Math.max(50,
      Math.floor((width - padding * 2 + tickGap) / (tickWidth + tickGap)),
    )),
    tickMaxHeight: width * (mobile ? 0.038 : tablet ? 20 / 1024 : 0.0153),
  }
}

export function getPractitionerResultsProgress(
  sectionTop: number,
  sectionHeight: number,
  _stageHeight: number,
  viewportHeight: number,
) {
  // Reference ScrollTrigger: start "top -35%", end "bottom 95%".
  return clamp01((-sectionTop - viewportHeight * 0.35) / Math.max(1, sectionHeight - viewportHeight * 1.3))
}

export function getPractitionerRailState(
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
  railWidth: number,
  horizontalPadding: number,
): PractitionerRailState {
  const travel = 1 - (1 - clamp01(progress)) ** 2
  const startX = viewportWidth * (viewportWidth <= 640 ? 0.11 : 0.233)
  const endX = viewportWidth - horizontalPadding * 2 - railWidth
  return {
    x: round(startX + (endX - startX) * travel),
    cardStepY: round(viewportHeight * (viewportWidth <= 1024 ? 0.07 : 0.1) * (1 - travel)),
  }
}

/** Finite retargetable scrub: identical at 60/120 Hz, and no idle RAF after settling. */
export function samplePractitionerScrub(from: number, to: number, elapsedMs: number) {
  if (elapsedMs <= 0) return from
  if (elapsedMs >= REVIEW_SCRUB_MS) return to
  return from + (to - from) * (1 - 2 ** (-10 * elapsedMs / REVIEW_SCRUB_MS))
}

export function getPractitionerWaveTickState(
  progress: number,
  tickIndex: number,
  tickCount = REVIEW_WAVE_TICK_COUNT,
  viewportWidth = 1280,
): PractitionerWaveTickState {
  const peak = 3 + clamp01(progress) * Math.max(0, tickCount - 7)
  const distance = Math.abs(tickIndex - peak)
  const active = distance < 3.5
  let height: number
  if (viewportWidth <= 640) {
    height = viewportWidth * (distance < 0.5 ? 0.038 : distance < 1.5 ? 0.031 : active ? 0.0268 : 0.023)
  } else if (viewportWidth <= 1024) {
    height = viewportWidth / 1024 * (distance < 0.5 ? 20 : distance < 1.5 ? 16 : active ? 14 : 12)
  } else {
    height = viewportWidth * (active ? 0.0153 - 0.0098 * distance / 3.5 : 0.0055)
  }
  return { height: round(height), opacity: round(active ? 1 - 0.95 * distance / 3.5 : 0.05) }
}

export function samplePractitionerHeadingMotion(elapsedMs: number, wordIndex: number) {
  const elapsed = elapsedMs - Math.max(0, wordIndex) * 70
  const revealProgress = clamp01(elapsed / 1750)
  const settleProgress = clamp01(elapsed / 1400)
  // Solve the measured natureSway curve: cubic-bezier(.08, .494, .14, 1).
  let lower = 0
  let upper = 1
  let parameter = settleProgress
  for (let iteration = 0; iteration < 18 && settleProgress > 0 && settleProgress < 1; iteration++) {
    const inverse = 1 - parameter
    const x = 3 * inverse * inverse * parameter * 0.08 + 3 * inverse * parameter * parameter * 0.14 + parameter ** 3
    if (x < settleProgress) lower = parameter
    else upper = parameter
    parameter = (lower + upper) * 0.5
  }
  const inverse = 1 - parameter
  return {
    reveal: revealProgress === 1 ? 1 : Math.sin(revealProgress * Math.PI / 2),
    settle: 3 * inverse * inverse * parameter * 0.494 + 3 * inverse * parameter * parameter + parameter ** 3,
  }
}
