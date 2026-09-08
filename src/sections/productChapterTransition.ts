const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const FADE_START = 0.4
const HANDOFF = 0.4175
const FADE_END = 0.435

/** Sequential fades within the existing handoff interval, reversible on scroll. */
export function getProductChapterOpacity(progress: number) {
  return {
    onboarding: 1 - clamp01((progress - FADE_START) / (HANDOFF - FADE_START)),
    process: clamp01((progress - HANDOFF) / (FADE_END - HANDOFF)),
  }
}
