export const getSectionProgress = (
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number,
) => {
  const travel = sectionHeight - viewportHeight
  if (travel <= 0) return sectionTop < 0 ? 1 : 0
  return Math.min(1, Math.max(0, -sectionTop / travel))
}

export const getFragmentPosition = (x: number, y: number, compact: boolean) => (
  compact ? { x: x * 0.32, y: y * 0.5 } : { x, y }
)

export const getStoryPosition = (progress: number, sceneCount: number) => {
  const clamped = Math.min(1, Math.max(0, progress))
  if (clamped === 1) return { index: Math.max(0, sceneCount - 1), local: 1 }
  const scaled = clamped * sceneCount
  return {
    index: Math.min(Math.max(0, sceneCount - 1), Math.floor(scaled)),
    local: scaled - Math.floor(scaled),
  }
}

export const getScenePosition = (progress: number, sceneCount: number) => {
  if (sceneCount <= 0) return { index: 0, local: 0 }
  return getStoryPosition(progress, sceneCount)
}
