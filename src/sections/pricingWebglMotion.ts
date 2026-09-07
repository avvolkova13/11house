import type { PricingMotionDirection } from './pricingMotion'

export type PricingTurnSample = {
  progress: number
  travel: number
  rotationY: number
  velocity: number
  reflectionIntensity: number
  directionSign: 1 | -1
}

export type PricingPlaneSample = {
  slot: number
  orbitPosition: number
  x: number
  z: number
  restingYaw: number
  rotationY: number
  opacity: number
  scale: number
  reflectionIntensity: number
}

const TAU = Math.PI * 2
const SIDE_X = 5.65

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** One uninterrupted quintic ease with a long, zero-jerk final landing. */
const sampleTurnProgress = (progress: number) => (
  progress * progress * progress * (progress * (progress * 6 - 15) + 10)
)

export function samplePricingTurn(
  progress: number,
  direction: PricingMotionDirection,
): PricingTurnSample {
  const p = clamp01(progress)
  const directionSign: 1 | -1 = direction === 'forward' ? -1 : 1
  const turnProgress = sampleTurnProgress(p)
  const rotationY = turnProgress * TAU * directionSign
  const velocity = p === 0 || p === 1
    ? 0
    : 16 * p * p * (1 - p) * (1 - p)
  const reflectionIntensity = Math.pow(Math.abs(Math.sin(rotationY)), 1.35)

  return {
    progress: p,
    travel: turnProgress,
    rotationY,
    velocity,
    reflectionIntensity,
    directionSign,
  }
}

export function samplePricingPlane(
  slot: number,
  turn: PricingTurnSample,
): PricingPlaneSample {
  const normalizedSlot = Math.min(1, Math.max(-1, Math.trunc(slot)))
  const rawOrbitPosition = normalizedSlot + turn.travel * turn.directionSign
  const orbitPosition = wrapOrbitPosition(rawOrbitPosition)
  const absolutePosition = Math.abs(orbitPosition)
  const isRearArc = absolutePosition > 1
  const rearProgress = isRearArc ? (absolutePosition - 1) * 2 : 0
  const sideSign = Math.sign(orbitPosition)
  const x = isRearArc
    ? sideSign * SIDE_X * (1 - rearProgress)
    : orbitPosition * SIDE_X
  const z = isRearArc
    ? mix(-1.05, -2.15, rearProgress)
    : mix(1.6, -1.05, absolutePosition)
  const scale = isRearArc
    ? mix(0.72, 0.54, rearProgress)
    : mix(1, 0.72, absolutePosition)
  const opacity = isRearArc
    ? mix(0.76, 0.38, rearProgress)
    : mix(1, 0.76, absolutePosition)
  const restingYaw = -(x / SIDE_X) * 0.14

  return {
    slot: normalizedSlot,
    orbitPosition,
    x,
    z,
    restingYaw,
    rotationY: restingYaw + turn.rotationY,
    opacity,
    scale,
    reflectionIntensity: turn.reflectionIntensity,
  }
}

function wrapOrbitPosition(position: number): number {
  return ((position + 1.5) % 3 + 3) % 3 - 1.5
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}
