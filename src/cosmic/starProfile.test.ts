import { describe, expect, it } from 'vitest'
import { STAR_PROFILE } from './starProfile'
import { starVertexShader } from './shaders/star'
import {
  terrainPointFragmentShader,
  terrainPointVertexShader,
  terrainVertexShader,
} from './shaders/nebula'

describe('STAR_PROFILE', () => {
  it('keeps rare accent stars restrained', () => {
    expect(STAR_PROFILE.accentChance).toBeLessThanOrEqual(0.012)
    expect(STAR_PROFILE.accentSizeMax).toBeLessThanOrEqual(3.2)
    expect(STAR_PROFILE.regularSizeMax).toBeLessThanOrEqual(1.8)
  })

  it('creates long scroll streaks while keeping their brightness restrained', () => {
    expect(STAR_PROFILE.maxPointSize).toBeLessThanOrEqual(42)
    expect(STAR_PROFILE.streakStretch).toBeGreaterThanOrEqual(5)
    expect(STAR_PROFILE.streakOpacityLoss).toBeGreaterThanOrEqual(0.3)
  })

  it('keeps the halo subordinate to the core', () => {
    expect(STAR_PROFILE.haloStrength).toBeLessThanOrEqual(0.3)
    expect(STAR_PROFILE.coreBrightnessBoost).toBeLessThanOrEqual(0.8)
  })

  it('moves stars and terrain at distinct depth rates', () => {
    expect(starVertexShader).toContain('uTravel * 1.35')
    expect(terrainVertexShader).toContain('uTravel * 1.08')
  })

  it('stretches terrain particles with the full intro energy', () => {
    expect(terrainPointVertexShader).toContain('abs(uIntroEnergy) * 4.2')
    expect(terrainPointFragmentShader).toContain('mix(1.0, 0.52, streakEnergy)')
  })
})
