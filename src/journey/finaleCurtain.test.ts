import { describe, expect, it } from 'vitest'
import { sampleFinaleCurtain } from './journeyMotion'

describe('finale curtain', () => {
  it('keeps the opening and CRM background unchanged before the finale', () => {
    expect(sampleFinaleCurtain(0, 12000, 800).active).toBe(false)
    expect(sampleFinaleCurtain(11199, 12000, 800).active).toBe(false)
  })

  it('moves the whole background with the entering stage and holds FAQ behind it', () => {
    for (const viewport of [600, 800, 1100]) {
      for (const progress of [0, .25, .5, .75]) {
        const y = 12000 - viewport + viewport * progress
        const frame = sampleFinaleCurtain(y, 12000, viewport)
        expect(frame.active).toBe(true)
        expect(frame.offset).toBeCloseTo(12000 - y)
        expect(frame.hold).toBeCloseTo(y - (12000 - viewport))
        // The uncovered FAQ ends exactly where the complete incoming panel begins.
        expect(viewport - frame.hold).toBeCloseTo(frame.offset)
      }
    }
  })

  it('settles without an offset and reverses deterministically on upward scrolling', () => {
    expect(sampleFinaleCurtain(12000, 12000, 800)).toEqual({ active: false, offset: 0, hold: 0 })
    expect(sampleFinaleCurtain(15000, 12000, 800).active).toBe(false)
    const middle = sampleFinaleCurtain(11600, 12000, 800)
    sampleFinaleCurtain(13000, 12000, 800)
    expect(sampleFinaleCurtain(11600, 12000, 800)).toEqual(middle)
  })

  it('disables curtain travel for reduced motion and unmeasured layout', () => {
    expect(sampleFinaleCurtain(11600, 12000, 800, true)).toEqual({ active: false, offset: 0, hold: 0 })
    expect(sampleFinaleCurtain(0, Infinity, 800).active).toBe(false)
  })
})
