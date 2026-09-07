import { describe, expect, it } from 'vitest'

import { samplePricingPlane, samplePricingTurn } from './pricingWebglMotion'

describe('pricing three-card turn sampler', () => {
  it('settles at the same orientation at both ends of a full turn', () => {
    const start = samplePricingTurn(0, 'forward')
    const end = samplePricingTurn(1, 'forward')

    expect(start).toMatchObject({ progress: 0, velocity: 0, travel: 0 })
    expect(start.rotationY).toBeCloseTo(0, 8)
    expect(end.progress).toBe(1)
    expect(end.rotationY).toBeCloseTo(-Math.PI * 2, 8)
    expect(end.velocity).toBe(0)
    expect(end.travel).toBeCloseTo(1, 8)
  })

  it('pulses the top and bottom trails when the card passes edge-on', () => {
    const hold = samplePricingTurn(0, 'forward')
    const firstEdge = samplePricingTurn(1 / 3, 'forward')
    const faceOn = samplePricingTurn(0.5, 'forward')
    const secondEdge = samplePricingTurn(2 / 3, 'forward')

    expect(hold.reflectionIntensity).toBe(0)
    expect(firstEdge.reflectionIntensity).toBeGreaterThan(0.95)
    expect(faceOn.reflectionIntensity).toBeLessThan(0.05)
    expect(secondEdge.reflectionIntensity).toBeGreaterThan(0.95)
  })

  it('has one continuous ease with maximum speed at 180 degrees', () => {
    const beforeMidpoint = samplePricingTurn(0.49, 'forward')
    const midpoint = samplePricingTurn(0.5, 'forward')
    const afterMidpoint = samplePricingTurn(0.51, 'forward')

    expect(beforeMidpoint.travel).toBeLessThan(midpoint.travel)
    expect(afterMidpoint.travel).toBeGreaterThan(midpoint.travel)
    expect(midpoint.velocity).toBeCloseTo(1, 8)
    expect(midpoint.rotationY).toBeCloseTo(-Math.PI, 8)
  })

  it('extends the final deceleration for a softer landing', () => {
    const eighty = samplePricingTurn(0.8, 'forward')
    const ninety = samplePricingTurn(0.9, 'forward')
    const ninetyFive = samplePricingTurn(0.95, 'forward')

    expect(ninety.travel).toBeGreaterThan(0.99)
    expect(ninety.velocity).toBeLessThan(eighty.velocity * 0.4)
    expect(ninetyFive.velocity).toBeLessThan(0.05)
  })

  it('moves the right card into center and the center card left during a forward turn', () => {
    const start = samplePricingTurn(0, 'forward')
    const end = samplePricingTurn(1, 'forward')
    const starts = [-1, 0, 1].map((slot) => samplePricingPlane(slot, start))
    const ends = [-1, 0, 1].map((slot) => samplePricingPlane(slot, end))

    expect(ends[2].x).toBeCloseTo(starts[1].x, 8)
    expect(ends[2].z).toBeCloseTo(starts[1].z, 8)
    expect(ends[2].scale).toBeCloseTo(starts[1].scale, 8)
    expect(ends[1].x).toBeCloseTo(starts[0].x, 8)
    expect(ends[1].z).toBeCloseTo(starts[0].z, 8)
    expect(ends[0].x).toBeCloseTo(starts[2].x, 8)
    expect(ends[0].z).toBeCloseTo(starts[2].z, 8)
  })

  it('moves the two foreground cards monotonically between screen positions', () => {
    const start = samplePricingTurn(0, 'forward')
    const quarter = samplePricingTurn(0.25, 'forward')
    const rightStart = samplePricingPlane(1, start)
    const rightQuarter = samplePricingPlane(1, quarter)
    const centerStart = samplePricingPlane(0, start)
    const centerQuarter = samplePricingPlane(0, quarter)

    expect(rightQuarter.x).toBeLessThan(rightStart.x)
    expect(rightQuarter.x).toBeGreaterThan(0)
    expect(centerQuarter.x).toBeLessThan(centerStart.x)
    expect(centerQuarter.x).toBeGreaterThan(samplePricingPlane(-1, start).x)
  })

  it('carries the wrapping card behind the carousel instead of teleporting it', () => {
    const start = samplePricingTurn(0, 'forward')
    const halfway = samplePricingTurn(0.5, 'forward')
    const side = samplePricingPlane(-1, start)
    const wrapped = samplePricingPlane(-1, halfway)

    expect(Math.abs(wrapped.x)).toBeLessThan(0.001)
    expect(wrapped.z).toBeLessThan(side.z)
    expect(wrapped.scale).toBeLessThan(side.scale)
    expect(wrapped.opacity).toBeLessThan(side.opacity)
  })

  it('mirrors both travel and rotation for a backward turn', () => {
    const forward = samplePricingPlane(1, samplePricingTurn(0.4, 'forward'))
    const backward = samplePricingPlane(1, samplePricingTurn(0.4, 'backward'))

    expect(backward.rotationY - backward.restingYaw).toBeCloseTo(
      -(forward.rotationY - forward.restingYaw),
      8,
    )
    const mirroredForward = samplePricingPlane(-1, samplePricingTurn(0.4, 'forward'))
    expect(backward.x).toBeCloseTo(-mirroredForward.x, 8)
    expect(backward.z).toBeCloseTo(mirroredForward.z, 8)
    expect(backward.scale).toBeCloseTo(mirroredForward.scale, 8)
    expect(backward.opacity).toBeCloseTo(mirroredForward.opacity, 8)
  })

  it('keeps the surfaces rigid while position, perspective, and spin animate', () => {
    const sample = samplePricingPlane(0, samplePricingTurn(0.4, 'forward'))

    expect(sample.rotationY - sample.restingYaw).not.toBe(0)
    expect(sample).not.toHaveProperty('texturePhase')
    expect(sample).not.toHaveProperty('fold')
    expect(sample).not.toHaveProperty('wave')
    expect(sample).not.toHaveProperty('pinch')
  })

  it('clamps malformed progress into the supported transition range', () => {
    expect(samplePricingTurn(-1, 'forward').progress).toBe(0)
    expect(samplePricingTurn(2, 'forward').progress).toBe(1)
  })
})
