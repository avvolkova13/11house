export const CYCLE_MS = 12_000
const TAU = Math.PI * 2
const REDUCED_PHASE = 0.28

export type MotionFrame = Readonly<{
  phase: number
  prism: Readonly<{
    x: number
    y: number
    scale: number
    quaternion: readonly [number, number, number, number]
  }>
  rings: Readonly<{
    zodiac: number
    houses: number
    outerA: number
    outerB: number
  }>
  dialRig: Readonly<{
    pitch: number
    yaw: number
    roll: number
    outerLayers: readonly [
      Readonly<{ pitch: number; yaw: number; roll: number }>,
      Readonly<{ pitch: number; yaw: number; roll: number }>,
      Readonly<{ pitch: number; yaw: number; roll: number }>,
    ]
  }>
  optics: Readonly<{
    dispersion: number
    caustic: number
  }>
}>

const round = (value: number) => Math.round(value * 1e9) / 1e9
const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
)

function normalizedPhase(elapsedMs: number): number {
  return ((elapsedMs % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS
}

function quaternionFromEuler(x: number, y: number, z: number): readonly [number, number, number, number] {
  const cx = Math.cos(x / 2)
  const sx = Math.sin(x / 2)
  const cy = Math.cos(y / 2)
  const sy = Math.sin(y / 2)
  const cz = Math.cos(z / 2)
  const sz = Math.sin(z / 2)

  let qx = sx * cy * cz + cx * sy * sz
  let qy = cx * sy * cz - sx * cy * sz
  let qz = cx * cy * sz + sx * sy * cz
  let qw = cx * cy * cz - sx * sy * sz
  const length = Math.hypot(qx, qy, qz, qw)

  qx /= length
  qy /= length
  qz /= length
  qw /= length

  if (qw < 0) {
    qx *= -1
    qy *= -1
    qz *= -1
    qw *= -1
  }

  return [round(qx), round(qy), round(qz), round(qw)]
}

function circularDistance(a: number, b: number): number {
  const raw = Math.abs(a - b)
  return Math.min(raw, 1 - raw)
}

function pulse(phase: number, center: number, radius: number): number {
  const unit = clamp(1 - circularDistance(phase, center) / radius, 0, 1)
  return unit * unit * (3 - 2 * unit)
}

export function getMotionFrame(elapsedMs: number, reducedMotion: boolean): MotionFrame {
  const phase = reducedMotion ? REDUCED_PHASE : normalizedPhase(elapsedMs)
  const orbitAngle = TAU * phase
  const doubleOrbitAngle = orbitAngle * 2
  const quaternion = quaternionFromEuler(
    0.2 + 0.22 * Math.sin(orbitAngle) + 0.06 * Math.sin(doubleOrbitAngle + 0.4),
    0.13 + 0.3 * Math.sin(orbitAngle - 0.2) + 0.07 * Math.sin(doubleOrbitAngle + 1.2),
    -0.06 + 0.14 * Math.sin(orbitAngle + 0.25) + 0.05 * Math.sin(doubleOrbitAngle - 0.5),
  )

  return {
    phase: round(phase),
    prism: {
      x: round(Math.sin(orbitAngle) * 0.16),
      y: round(Math.cos(orbitAngle) * 0.2 - Math.sin(orbitAngle) * 0.075),
      scale: round(1 + 0.028 * (1 - Math.cos(TAU * phase))),
      quaternion,
    },
    rings: {
      zodiac: round(-TAU * phase),
      houses: round(TAU * phase * 0.5),
      outerA: round(TAU * phase),
      outerB: round(-TAU * phase * 1.5),
    },
    dialRig: {
      pitch: round(0.16 * Math.sin(TAU * phase)),
      yaw: round(0.34 + 0.07 * Math.sin(TAU * phase + 0.3)),
      roll: round(-0.04 + 0.13 * Math.sin(TAU * phase + 0.6)),
      outerLayers: [
        {
          pitch: round(0.0525 * Math.sin(TAU * phase + 0.2)),
          yaw: round(0.135 * Math.sin(TAU * phase * 2 + 0.4)),
          roll: round(0.0825 * Math.sin(TAU * phase + 1.1)),
        },
        {
          pitch: round(0.075 * Math.sin(TAU * phase + 2.1)),
          yaw: round(0.195 * Math.sin(TAU * phase + 1.4)),
          roll: round(0.1125 * Math.sin(TAU * phase * 2 + 0.2)),
        },
        {
          pitch: round(0.09 * Math.sin(TAU * phase * 2 + 1.7)),
          yaw: round(0.225 * Math.sin(TAU * phase + 0.7)),
          roll: round(0.135 * Math.sin(TAU * phase + 2.3)),
        },
      ],
    },
    optics: {
      dispersion: round(0.45 + 0.55 * Math.abs(Math.sin(TAU * phase * 2 + 0.35))),
      caustic: round(clamp(pulse(phase, 0.23, 0.095) + pulse(phase, 0.71, 0.08), 0, 1)),
    },
  }
}

export function getRenderSize(
  cssSize: number,
  devicePixelRatio: number,
  mobile: boolean,
): number {
  const cap = mobile ? 1.5 : 2
  return Math.max(1, Math.round(cssSize * Math.min(Math.max(devicePixelRatio, 1), cap)))
}
