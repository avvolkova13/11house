// Scene ranges are the original Hero ranges; interface chapters have their own timeline.
export type JourneyLayout = {
  viewport: number
  chapterStarts: number[]
  finaleTop: number
}

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const smooth = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / Math.max(1, to - from))
  return t * t * (3 - 2 * t)
}

export function sampleJourneyScene(scrollY: number, layout: JourneyLayout) {
  const y = Math.max(0, scrollY)
  const viewport = Math.max(1, layout.viewport)
  const first = layout.chapterStarts[0] ?? viewport * 1.8
  const intro = smooth(0, first, y)
  let flightPosition = intro * 760
  for (const start of layout.chapterStarts.slice(1)) {
    flightPosition += smooth(start - viewport * 0.6, start + viewport * 0.1, y) * 760
  }
  // Prepare the tunnel behind the opaque FAQ, before the finale enters at the
  // bottom of the viewport. The extra lead lets the scene inertia settle.
  const finale = smooth(layout.finaleTop - viewport * 2, layout.finaleTop - viewport * 1.15, y)
  flightPosition += finale * 1800
  return {
    sceneProgress: 2.4 * intro + 3.92 * finale,
    flightPosition,
  }
}

export function getChapterFrame(top: number, height: number, viewport: number, steps: number, stageHeight = viewport) {
  const corridor = Math.max(1, height - viewport)
  const readingEntry = Math.max(0, stageHeight - viewport)
  const progress = clamp01((-top - readingEntry) / Math.max(1, height - stageHeight))
  const step = Math.min(steps - 1, Math.floor(progress * steps))
  const arrival = 1 - smooth(0, viewport * 0.75, top)
  // Fade only while the sticky stage is leaving, after all states have been readable.
  const departure = 1 - smooth(corridor, corridor + viewport * 0.6, -top)
  return { progress, step, opacity: arrival * departure, entrance: 1 - arrival }
}

/** A complete viewport rises over the stationary end of FAQ, then settles. */
export function sampleFinaleCurtain(scrollY: number, finaleTop: number, viewport: number, reducedMotion = false) {
  const height = Math.max(1, viewport)
  const offset = finaleTop - scrollY
  if (reducedMotion || !Number.isFinite(offset) || offset > height || offset <= 0) {
    return { active: false, offset: 0, hold: 0 }
  }
  return { active: true, offset, hold: height - offset }
}
