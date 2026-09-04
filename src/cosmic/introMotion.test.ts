import { describe, expect, it } from 'vitest'
import { getIntroScrollMotion, getIntroVelocityAfterDelta } from './introMotion'

const input = {
  progress: 1.4,
  velocity: 8,
  viewportWidth: 1440,
  reducedMotion: false,
}

describe('intro scroll motion', () => {
  it('accumulates a bounded intro-only velocity from scroll delta', () => {
    expect(getIntroVelocityAfterDelta(0, 720, 1.4)).toBe(18)
    expect(getIntroVelocityAfterDelta(0, -720, 1.4)).toBe(-18)
    expect(getIntroVelocityAfterDelta(7, 720, 3.15)).toBe(7)
  })

  it('maps a full desktop impulse to a deep camera flight and long particle streak', () => {
    const forward = getIntroScrollMotion({
      progress: 1.4,
      velocity: 18,
      viewportWidth: 1440,
      reducedMotion: false,
    })

    expect(forward.cameraZ).toBeCloseTo(-14.5)
    expect(forward.travelBoost).toBeCloseTo(28)
    expect(forward.pointStretch).toBeCloseTo(5.2)
    expect(forward.streak).toBe(1)
  })

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

    expect(Math.abs(tablet.cameraZ / desktop.cameraZ)).toBeCloseTo(0.85)
    expect(Math.abs(mobile.cameraZ / desktop.cameraZ)).toBeCloseTo(0.7)
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
