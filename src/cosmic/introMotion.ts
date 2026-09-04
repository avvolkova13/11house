export type IntroScrollMotionInput = {
  progress: number
  velocity: number
  viewportWidth: number
  reducedMotion: boolean
}

export type IntroScrollMotionState = {
  influence: number
  signedEnergy: number
  cameraZ: number
  cameraY: number
  horizonY: number
  pitch: number
  roll: number
  travelBoost: number
  streak: number
  pointStretch: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start), 0, 1)
  return t * t * (3 - 2 * t)
}

const ZERO_MOTION: IntroScrollMotionState = {
  influence: 0,
  signedEnergy: 0,
  cameraZ: 0,
  cameraY: 0,
  horizonY: 0,
  pitch: 0,
  roll: 0,
  travelBoost: 0,
  streak: 0,
  pointStretch: 1,
}

export const getIntroVelocityAfterDelta = (
  currentVelocity: number,
  scrollDelta: number,
  progress: number,
) => {
  const introWeight = clamp((3.15 - progress) / 0.5, 0, 1)
  return clamp(currentVelocity + scrollDelta * 0.026 * introWeight, -18, 18)
}

export const getIntroScrollMotion = ({
  progress,
  velocity,
  viewportWidth,
  reducedMotion,
}: IntroScrollMotionInput): IntroScrollMotionState => {
  if (reducedMotion) return ZERO_MOTION

  const influence = 1 - smoothstep(2.65, 3.15, progress)
  if (influence === 0) return ZERO_MOTION

  const viewportScale = viewportWidth < 700 ? 0.7 : viewportWidth < 1100 ? 0.85 : 1
  const signedEnergy = clamp(velocity / 18, -1, 1) * influence * viewportScale
  const magnitude = Math.abs(signedEnergy)

  return {
    influence,
    signedEnergy,
    cameraZ: signedEnergy * -14.5,
    cameraY: signedEnergy * 1.45,
    horizonY: signedEnergy * -1.35,
    pitch: signedEnergy * -0.034,
    roll: signedEnergy * 0.007,
    travelBoost: signedEnergy * 28,
    streak: smoothstep(0.03, 0.7, magnitude),
    pointStretch: 1 + magnitude * 4.2,
  }
}
