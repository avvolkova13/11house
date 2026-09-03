import { describe, expect, it } from 'vitest'
import { getIntroScrollMotion } from './introMotion'

const input = {
  progress: 1.4,
  velocity: 8,
  viewportWidth: 1440,
  reducedMotion: false,
}

describe('intro scroll motion', () => {
  it('creates a clear signed forward and reverse camera impulse', () => {
    const forward = getIntroScrollMotion(input)
    const reverse = getIntroScrollMotion({ ...input, velocity: -8 })

    expect(forward.cameraZ).toBeLessThan(-4)
    expect(reverse.cameraZ).toBeGreaterThan(4)
    expect(reverse.cameraZ).toBeCloseTo(-forward.cameraZ)
    expect(reverse.horizonY).toBeCloseTo(-forward.horizonY)
  })

  it('fades out before product scenes', () => {
    expect(getIntroScrollMotion({ ...input, progress: 2.8 }).influence).toBeGreaterThan(0)
    expect(getIntroScrollMotion({ ...input, progress: 3.15 })).toMatchObject({
      influence: 0,
      signedEnergy: 0,
      cameraZ: 0,
      horizonY: 0,
      travelBoost: 0,
      pointStretch: 1,
    })
  })

  it('reduces amplitude on tablet and mobile', () => {
    const desktop = getIntroScrollMotion(input)
    const tablet = getIntroScrollMotion({ ...input, viewportWidth: 900 })
    const mobile = getIntroScrollMotion({ ...input, viewportWidth: 390 })

    expect(Math.abs(tablet.cameraZ / desktop.cameraZ)).toBeCloseTo(0.8)
    expect(Math.abs(mobile.cameraZ / desktop.cameraZ)).toBeCloseTo(0.6)
  })

  it('removes the new response for reduced motion', () => {
    expect(getIntroScrollMotion({ ...input, reducedMotion: true })).toMatchObject({
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
    })
  })
})
