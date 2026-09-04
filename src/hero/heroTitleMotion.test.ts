import { describe, expect, it } from 'vitest'
import {
  HERO_TITLE_REVEAL_DURATION_MS,
  HERO_TITLE_STAGGER_MS,
  getHeroTitleLetterDelay,
  shouldRevealHeroTitle,
} from './heroTitleMotion'

describe('Mesh-inspired Hero title reveal', () => {
  it('uses the measured 700ms reveal with a 35ms letter stagger', () => {
    expect(HERO_TITLE_REVEAL_DURATION_MS).toBe(700)
    expect(HERO_TITLE_STAGGER_MS).toBe(35)
    expect(getHeroTitleLetterDelay(0)).toBe(0)
    expect(getHeroTitleLetterDelay(4)).toBe(140)
  })

  it('reveals only a title that has reached its focal point', () => {
    expect(shouldRevealHeroTitle(0, false)).toBe(true)
    expect(shouldRevealHeroTitle(0.16, false)).toBe(true)
    expect(shouldRevealHeroTitle(0.28, false)).toBe(false)
    expect(shouldRevealHeroTitle(-0.28, false)).toBe(false)
  })

  it('keeps titles visible when reduced motion is requested', () => {
    expect(shouldRevealHeroTitle(1, true)).toBe(true)
  })
})
