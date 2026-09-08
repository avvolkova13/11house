import { describe, expect, it } from 'vitest'
import { getProductChapterOpacity } from './productChapterTransition'

describe('product chapter handoff', () => {
  it('never exposes both chapters at the same scroll position', () => {
    for (let sample = 0; sample <= 2000; sample++) {
      const state = getProductChapterOpacity(sample / 2000)
      expect(state.onboarding * state.process).toBe(0)
    }
  })

  it('fades the outgoing chapter before revealing the incoming chapter', () => {
    expect(getProductChapterOpacity(0.4)).toEqual({ onboarding: 1, process: 0 })
    expect(getProductChapterOpacity(0.40875).onboarding).toBeCloseTo(0.5)
    expect(getProductChapterOpacity(0.4175)).toEqual({ onboarding: 0, process: 0 })
    expect(getProductChapterOpacity(0.42625).process).toBeCloseTo(0.5)
    expect(getProductChapterOpacity(0.44)).toEqual({ onboarding: 0, process: 1 })
  })

  it('preserves the section boundaries and rewinds through the same transition', () => {
    expect(getProductChapterOpacity(-1)).toEqual({ onboarding: 1, process: 0 })
    expect(getProductChapterOpacity(1)).toEqual({ onboarding: 0, process: 1 })
    const positions = [0.4, 0.40875, 0.4175, 0.42625, 0.44]
    const forward = positions.map(getProductChapterOpacity)
    const backward = [...positions].reverse().map(getProductChapterOpacity).reverse()
    expect(backward).toEqual(forward)
  })
})
