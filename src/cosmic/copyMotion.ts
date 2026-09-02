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
