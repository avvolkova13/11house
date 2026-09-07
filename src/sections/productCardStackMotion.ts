export type ProductCardState = {
  x: number
  y: number
  rotation: number
  scale: number
  opacity: number
  blur: number
  zIndex: number
}

const ENTRY_START = 0.04
const ENTRY_STAGGER = 0.055
const ENTRY_DURATION = 0.16
const EXIT_START = 0.56
const EXIT_STAGGER = 0.07
const EXIT_DURATION = 0.14

const FAN_X = [-12, 12, -7, 8, 0]
const FAN_Y = [3, 0, -4, -7, -10]
const FAN_ROTATION = [-3.2, 3.7, -1.6, 2.2, 0]
const FAN_SCALE = [0.997, 1, 1.003, 1.007, 1.01]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const easeOutCubic = (value: number) => 1 - ((1 - clamp01(value)) ** 3)
const easeInCubic = (value: number) => clamp01(value) ** 3
const mix = (from: number, to: number, amount: number) => from + ((to - from) * amount)

export const getProductCardState = (
  progress: number,
  index: number,
  count: number,
  compact: boolean,
): ProductCardState => {
  const safeCount = Math.max(1, count)
  const safeIndex = Math.min(safeCount - 1, Math.max(0, index))
  const clampedProgress = clamp01(progress)
  const direction = safeIndex % 2 === 0 ? 1 : -1
  const entryX = (compact ? 300 : 360) * direction
  const entryY = compact ? -230 : -260
  const entryRotation = direction * 9
  const fanSlot = safeIndex % FAN_X.length
  const targetX = FAN_X[fanSlot] * (compact ? 0.7 : 1)
  const targetY = FAN_Y[fanSlot] * (compact ? 0.75 : 1)
  const targetRotation = FAN_ROTATION[fanSlot]
  const targetScale = FAN_SCALE[fanSlot]
  const entryStart = ENTRY_START + (safeIndex * ENTRY_STAGGER)
  const entryProgress = easeOutCubic((clampedProgress - entryStart) / ENTRY_DURATION)

  let x = entryProgress === 1 ? targetX : mix(entryX, targetX, entryProgress)
  let y = entryProgress === 1 ? targetY : mix(entryY, targetY, entryProgress)
  let rotation = entryProgress === 1 ? targetRotation : mix(entryRotation, targetRotation, entryProgress)
  let scale = entryProgress === 1 ? targetScale : mix(1.1, targetScale, entryProgress)
  const opacity = clamp01((clampedProgress - entryStart) / (ENTRY_DURATION * 0.58))
  const blur = entryProgress >= 0.94 ? 0 : mix(5, 0, entryProgress)

  const reverseIndex = safeCount - 1 - safeIndex
  const exitStart = EXIT_START + (reverseIndex * EXIT_STAGGER)
  const exitProgress = easeInCubic((clampedProgress - exitStart) / EXIT_DURATION)
  if (exitProgress > 0) {
    const exitY = compact ? -600 : -730
    x = mix(x, 0, exitProgress)
    y = mix(y, exitY, exitProgress)
    rotation = mix(rotation, 0, exitProgress)
    scale = mix(scale, 1, exitProgress)
  }

  return {
    x,
    y,
    rotation,
    scale,
    opacity,
    blur,
    zIndex: safeIndex + 1,
  }
}
