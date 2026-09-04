import { describe, expect, it } from 'vitest'
import type { HeroCorridorMetrics } from './PageScrollCoordinator'
import {
  beginHeroHandoff,
  completeHeroHandoff,
  getHeroRunwayEnd,
  shouldBeginHeroHandoff,
} from './heroHandoff'

const metrics: HeroCorridorMetrics = {
  travelEnd: 6840,
  settleEnd: 7155,
  corridorEnd: 7785,
}

describe('hero handoff', () => {
  it('begins only once from the tunnel phase', () => {
    expect(beginHeroHandoff('tunnel')).toBe('covering')
    expect(beginHeroHandoff('covering')).toBe('covering')
    expect(beginHeroHandoff('story')).toBe('story')
  })

  it('completes only an active covering phase', () => {
    expect(completeHeroHandoff('tunnel')).toBe('tunnel')
    expect(completeHeroHandoff('covering')).toBe('story')
    expect(completeHeroHandoff('story')).toBe('story')
  })

  it('keeps a settle buffer scrollable before the story is opened', () => {
    expect(getHeroRunwayEnd(metrics, 'tunnel')).toBe(metrics.settleEnd)
    expect(getHeroRunwayEnd(metrics, 'covering')).toBe(metrics.corridorEnd)
    expect(getHeroRunwayEnd(metrics, 'story')).toBe(metrics.corridorEnd)
  })

  it('waits for the smoothed terminal frame before opening the story', () => {
    expect(shouldBeginHeroHandoff({
      state: 'EXITING',
      scrollPosition: 6840,
      travelProgress: 6,
    }, metrics)).toBe(false)
    expect(shouldBeginHeroHandoff({
      state: 'EXITING',
      scrollPosition: 6840,
      travelProgress: 9,
    }, metrics)).toBe(true)
    expect(shouldBeginHeroHandoff({
      state: 'EXIT_ARMED',
      scrollPosition: 7155,
      travelProgress: 8.8,
    }, metrics)).toBe(false)
    expect(shouldBeginHeroHandoff({
      state: 'EXIT_ARMED',
      scrollPosition: 7155,
      travelProgress: 9,
    }, metrics)).toBe(true)
  })

  it('does not delay the reduced-motion handoff', () => {
    const reducedMetrics = { travelEnd: 1, settleEnd: 1, corridorEnd: 451 }

    expect(shouldBeginHeroHandoff({
      state: 'EXITING',
      scrollPosition: 1,
      travelProgress: 0,
    }, reducedMetrics)).toBe(true)
  })
})
