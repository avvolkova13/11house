import { describe, expect, it } from 'vitest'
import {
  easeOutCubic,
  getDirectedSnapTarget,
  getIntroGlyphDepth,
  getSettleDuration,
  getStageTravelDirection,
} from './copyMotion'

describe('getDirectedSnapTarget', () => {
  it('finishes a tiny forward gesture on the next heading', () => {
    expect(getDirectedSnapTarget(0.01, 1)).toBe(1)
  })

  it('finishes a tiny backward gesture on the previous heading', () => {
    expect(getDirectedSnapTarget(-0.01, -1)).toBe(-1)
  })

  it('uses the gesture direction from a partial transition', () => {
    expect(getDirectedSnapTarget(1.24, 1)).toBe(2)
    expect(getDirectedSnapTarget(1.24, -1)).toBe(1)
  })
})

describe('easeOutCubic', () => {
  it('clamps progress and lands exactly on both endpoints', () => {
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(2)).toBe(1)
  })

  it('moves quickly at first and slows near the target', () => {
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
  })
})

describe('getSettleDuration', () => {
  it('keeps heading completion fast for both short and long remaining distances', () => {
    expect(getSettleDuration(0)).toBe(220)
    expect(getSettleDuration(0.5)).toBe(265)
    expect(getSettleDuration(1)).toBe(300)
    expect(getSettleDuration(3)).toBe(300)
  })
})

describe('getStageTravelDirection', () => {
  it('alternates left-to-right and right-to-left for consecutive headings', () => {
    expect([0, 1, 2, 3].map(getStageTravelDirection)).toEqual([1, -1, 1, -1])
  })
})

describe('getIntroGlyphDepth', () => {
  it('pushes an outgoing heading toward the viewer', () => {
    const motion = getIntroGlyphDepth(-0.7, 0.5)

    expect(motion.translateZ).toBeGreaterThan(60)
    expect(motion.scale).toBeGreaterThan(1.1)
    expect(motion.blur).toBeGreaterThan(0)
  })

  it('keeps an incoming heading behind the focal plane', () => {
    const motion = getIntroGlyphDepth(0.7, 0.5)

    expect(motion.translateZ).toBeLessThan(-40)
    expect(motion.scale).toBeLessThan(1)
  })

  it('is perfectly sharp and neutral at the active stage', () => {
    expect(getIntroGlyphDepth(0, 0.5)).toEqual({
      translateZ: 0,
      scale: 1,
      blur: 0,
    })
  })
})
