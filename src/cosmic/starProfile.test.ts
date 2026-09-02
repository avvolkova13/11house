import { describe, expect, it } from 'vitest'
import { STAR_PROFILE } from './starProfile'

describe('STAR_PROFILE', () => {
  it('keeps rare accent stars restrained', () => {
    expect(STAR_PROFILE.accentChance).toBeLessThanOrEqual(0.012)
    expect(STAR_PROFILE.accentSizeMax).toBeLessThanOrEqual(3.2)
    expect(STAR_PROFILE.regularSizeMax).toBeLessThanOrEqual(1.8)
  })

  it('caps scroll streaks before they become bright discs', () => {
    expect(STAR_PROFILE.maxPointSize).toBeLessThanOrEqual(28)
    expect(STAR_PROFILE.streakStretch).toBeLessThanOrEqual(2.7)
    expect(STAR_PROFILE.streakOpacityLoss).toBeGreaterThanOrEqual(0.18)
  })

  it('keeps the halo subordinate to the core', () => {
    expect(STAR_PROFILE.haloStrength).toBeLessThanOrEqual(0.3)
    expect(STAR_PROFILE.coreBrightnessBoost).toBeLessThanOrEqual(0.8)
  })
})
