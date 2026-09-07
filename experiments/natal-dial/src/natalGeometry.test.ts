import { describe, expect, it } from 'vitest'
import { NATAL_CHART } from './natalData'
import { buildHouseCusps, selectMajorAspects, toPolarPoint } from './natalGeometry'

describe('natal geometry', () => {
  it('keeps the documented chart inputs and ten bodies', () => {
    expect(NATAL_CHART.utcIso).toBe('2026-09-07T07:00:00.000Z')
    expect(NATAL_CHART.location).toEqual({ latitude: 56.8389, longitude: 60.6057 })
    expect(NATAL_CHART.ascendant).toBeCloseTo(220.333, 3)
    expect(NATAL_CHART.bodies).toHaveLength(10)
  })

  it('maps zero degrees to the top and ninety degrees to the right', () => {
    expect(toPolarPoint(0, 1)).toEqual({ x: 0, y: 1 })
    expect(toPolarPoint(90, 1).x).toBeCloseTo(1, 8)
    expect(toPolarPoint(90, 1).y).toBeCloseTo(0, 8)
  })

  it('builds twelve equal houses from the ascendant', () => {
    const cusps = buildHouseCusps(NATAL_CHART.ascendant)
    expect(cusps).toHaveLength(12)
    expect(cusps[0]).toBeCloseTo(220.333, 3)
    expect(cusps[11]).toBeCloseTo(190.333, 3)
  })

  it('returns at most twelve aspects ordered by orb', () => {
    const aspects = selectMajorAspects(NATAL_CHART.bodies, 12)
    expect(aspects.length).toBeLessThanOrEqual(12)
    expect(
      aspects.every((aspect, index) => index === 0 || aspects[index - 1].orb <= aspect.orb),
    ).toBe(true)
  })
})
