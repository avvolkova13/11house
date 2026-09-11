import { describe, expect, it } from 'vitest'
import { getPricingDomOpacity, projectPricingDomCard } from './pricingDomProjection'
import { samplePricingPlane, samplePricingTurn } from './pricingWebglMotion'

describe('native pricing text projection', () => {
  it('hides rear-arc copy while preserving settled side-card copy', () => {
    expect(getPricingDomOpacity(samplePricingPlane(-1, samplePricingTurn(.5, 'forward')))).toBe(0)
    for (const slot of [-1, 0, 1]) {
      const sample = samplePricingPlane(slot, samplePricingTurn(0, 'forward'))
      expect(getPricingDomOpacity(sample)).toBeCloseTo(sample.opacity)
    }
  })
  it('matches perspective projection at all four card corners throughout a full turn', () => {
    const width = 1280, height = 950, cameraZ = 17, cardWidth = 4.8, cardHeight = 8.4375, domWidth = 440
    const focal = height / (2 * Math.tan(36 * Math.PI / 360))
    for (const progress of [0, .15, .25, .5, .75, .9, 1]) for (const slot of [-1, 0, 1]) {
      const sample = samplePricingPlane(slot, samplePricingTurn(progress, 'forward'))
      const m = projectPricingDomCard(sample, width, height, cameraZ, cardWidth, cardHeight, domWidth)
      const facing = Math.cos(sample.rotationY) < 0 ? -1 : 1
      for (const x of [0, domWidth]) for (const y of [0, domWidth * cardHeight / cardWidth]) {
        const lx = (x / domWidth - .5) * cardWidth * sample.scale * facing
        const ly = (.5 - y / (domWidth * cardHeight / cardWidth)) * cardHeight * sample.scale
        const z = sample.z - lx * Math.sin(sample.rotationY)
        expect((m[0] * x + m[12]) / (m[3] * x + 1)).toBeCloseTo(width / 2 + focal * (sample.x + lx * Math.cos(sample.rotationY)) / (cameraZ - z), 6)
        expect((m[1] * x + m[5] * y + m[13]) / (m[3] * x + 1)).toBeCloseTo(height / 2 - focal * ly / (cameraZ - z), 6)
      }
    }
  })
})
