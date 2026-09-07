import type { NatalBody } from './natalData'

export type PolarPoint = Readonly<{ x: number; y: number }>

export type AspectLine = Readonly<{
  from: NatalBody['id']
  to: NatalBody['id']
  angle: 0 | 60 | 90 | 120 | 180
  orb: number
}>

const ASPECTS = [
  { angle: 0 as const, orb: 6 },
  { angle: 60 as const, orb: 4 },
  { angle: 90 as const, orb: 5 },
  { angle: 120 as const, orb: 5 },
  { angle: 180 as const, orb: 6 },
] as const

export const normalizeDegrees = (degrees: number) => ((degrees % 360) + 360) % 360

export function toPolarPoint(longitude: number, radius: number): PolarPoint {
  const radians = longitude * Math.PI / 180
  const clean = (value: number) => Math.abs(value) < 1e-12 ? 0 : value

  return {
    x: clean(Math.sin(radians) * radius),
    y: clean(Math.cos(radians) * radius),
  }
}

export function buildHouseCusps(ascendant: number): readonly number[] {
  return Array.from({ length: 12 }, (_, index) => normalizeDegrees(ascendant + index * 30))
}

export function selectMajorAspects(
  bodies: readonly NatalBody[],
  limit = 12,
): readonly AspectLine[] {
  const lines: AspectLine[] = []

  for (let from = 0; from < bodies.length; from += 1) {
    for (let to = from + 1; to < bodies.length; to += 1) {
      const raw = Math.abs(bodies[from].longitude - bodies[to].longitude)
      const separation = Math.min(raw, 360 - raw)

      for (const definition of ASPECTS) {
        const orb = Math.abs(separation - definition.angle)
        if (orb <= definition.orb) {
          lines.push({
            from: bodies[from].id,
            to: bodies[to].id,
            angle: definition.angle,
            orb,
          })
        }
      }
    }
  }

  return lines.sort((a, b) => a.orb - b.orb).slice(0, limit)
}
