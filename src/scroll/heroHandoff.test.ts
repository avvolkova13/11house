import { describe, expect, it } from 'vitest'
import type { HeroCorridorMetrics } from './PageScrollCoordinator'
import {
  beginHeroHandoff,
  completeHeroHandoff,
  getHeroRunwayEnd,
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
})
