import { describe, expect, it } from 'vitest'

import {
  getPricingRenderMode,
  shouldRunPricingFrame,
} from './pricingWebglLifecycle'

describe('pricing WebGL lifecycle', () => {
  it('renders transitions but rests the GPU while the card and its reflection are still', () => {
    expect(shouldRunPricingFrame({
      phase: 'transitioning',
      inView: true,
      documentVisible: true,
      reducedMotion: false,
      fallback: false,
    })).toBe(true)
    expect(shouldRunPricingFrame({
      phase: 'holding',
      inView: true,
      documentVisible: true,
      reducedMotion: false,
      fallback: false,
    })).toBe(false)
    expect(shouldRunPricingFrame({
      phase: 'transitioning',
      inView: false,
      documentVisible: true,
      reducedMotion: false,
      fallback: false,
    })).toBe(false)
    expect(shouldRunPricingFrame({
      phase: 'transitioning',
      inView: true,
      documentVisible: false,
      reducedMotion: false,
      fallback: false,
    })).toBe(false)
    expect(shouldRunPricingFrame({
      phase: 'transitioning',
      inView: true,
      documentVisible: true,
      reducedMotion: true,
      fallback: false,
    })).toBe(false)
  })

  it('uses HTML fallback after context loss or renderer failure', () => {
    expect(getPricingRenderMode({ initialized: true, contextLost: false })).toBe('webgl')
    expect(getPricingRenderMode({ initialized: false, contextLost: false })).toBe('pending')
    expect(getPricingRenderMode({ initialized: false, contextLost: true })).toBe('fallback')
    expect(getPricingRenderMode({ initialized: true, contextLost: true })).toBe('fallback')
    expect(getPricingRenderMode({ initialized: true, contextLost: false, fallback: true })).toBe('fallback')
  })

  it('keeps the development frame override from starting RAF', () => {
    expect(shouldRunPricingFrame({
      phase: 'transitioning',
      inView: true,
      documentVisible: true,
      reducedMotion: false,
      fallback: false,
      frameOverride: { direction: 'forward', progress: 0.5 },
    })).toBe(false)
  })
})
