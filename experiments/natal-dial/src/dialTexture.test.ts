import { describe, expect, it } from 'vitest'
import { buildAccessibleSummary, getAtlasLabels, PLANET_MARKER_SIZE_RATIO } from './dialTexture'
import { PLANET_VECTOR_IDS } from './planetGlyphs'
import { ZODIAC_VECTOR_IDS } from './zodiacGlyphs'

describe('dial texture labels', () => {
  it('uses twelve custom vector zodiac marks instead of emoji glyphs', () => {
    const labels = getAtlasLabels()
    expect(ZODIAC_VECTOR_IDS).toEqual([
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ])
    expect(labels.zodiac).toEqual(ZODIAC_VECTOR_IDS)
    expect(labels.visibleZodiac).toEqual([])
    expect(labels.zodiac.join('')).not.toMatch(/[♈-♓]/u)
    expect(labels.houses).toHaveLength(12)
    expect(labels.bodies).toEqual(PLANET_VECTOR_IDS)
    expect(labels.bodies.join('')).not.toMatch(/[☉☽☿♀♂♃♄♅♆♇]/u)
  })

  it('builds a Russian accessible chart summary', () => {
    const summary = buildAccessibleSummary()
    expect(summary).toContain('7 сентября 2026, 12:00')
    expect(summary).toContain('Екатеринбург')
    expect(summary).toContain('Солнце')
    expect(summary).toContain('Плутон')
    expect(summary).not.toContain('60′')
  })

  it('keeps natal markers as restrained HUD geometry rather than oversized icons', () => {
    expect(PLANET_MARKER_SIZE_RATIO).toBeCloseTo(0.034, 8)
  })
})
