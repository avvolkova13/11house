export type ScrollDirection = -1 | 1

export const getDirectedSnapTarget = (
  progress: number,
  direction: ScrollDirection,
) => direction > 0 ? Math.floor(progress) + 1 : Math.ceil(progress) - 1

export const easeOutCubic = (progress: number) => {
  const clamped = Math.min(1, Math.max(0, progress))
  return 1 - (1 - clamped) ** 3
}

export const getSettleDuration = (distance: number) => (
  220 + Math.min(80, Math.max(0, distance) * 90)
)

export const getStageTravelDirection = (stageIndex: number): ScrollDirection => (
  Math.abs(stageIndex) % 2 === 0 ? 1 : -1
)

export type IntroGlyphDepth = {
  translateZ: number
  scale: number
  blur: number
}

export const getIntroGlyphDepth = (
  stageOffset: number,
  stagger: number,
): IntroGlyphDepth => {
  const distance = Math.min(1, Math.abs(stageOffset))
  if (distance === 0) return { translateZ: 0, scale: 1, blur: 0 }

  const outgoing = stageOffset < 0
  const amount = easeOutCubic(distance)

  return {
    translateZ: (outgoing ? 1 : -1) * amount * (92 + stagger * 44),
    scale: outgoing
      ? 1 + amount * (0.18 + stagger * 0.06)
      : 1 - amount * (0.14 + stagger * 0.04),
    blur: amount * (0.35 + stagger * 1.15),
  }
}
