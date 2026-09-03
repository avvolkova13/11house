import { describe, expect, it } from 'vitest'
import {
  PageScrollCoordinator,
  getHeroCorridorMetrics,
  type HeroCorridorMetrics,
} from './PageScrollCoordinator'

const metrics: HeroCorridorMetrics = {
  travelEnd: 6840,
  settleEnd: 7155,
  corridorEnd: 7785,
}

describe('getHeroCorridorMetrics', () => {
  it('adds three visual-only 760px tunnel-flight transitions', () => {
    expect(getHeroCorridorMetrics(1440, 900, false)).toEqual({
      travelEnd: 6840,
      settleEnd: 7155,
      corridorEnd: 7785,
    })
  })

  it('uses a shorter handoff on mobile without changing the narrative timing', () => {
    expect(getHeroCorridorMetrics(390, 844, false)).toEqual({
      travelEnd: 6840,
      settleEnd: 7135,
      corridorEnd: 7557,
    })
  })

  it('collapses animated travel for reduced motion', () => {
    expect(getHeroCorridorMetrics(1440, 900, true)).toEqual({
      travelEnd: 1,
      settleEnd: 1,
      corridorEnd: 451,
    })
  })
})

describe('PageScrollCoordinator', () => {
  it('moves through the forward ownership states without teleporting', () => {
    const coordinator = new PageScrollCoordinator(metrics, 0)

    expect(coordinator.snapshot.state).toBe('PRE_HERO')
    expect(coordinator.update(1).state).toBe('TRAVEL')
    expect(coordinator.update(6839).state).toBe('TRAVEL')
    expect(coordinator.update(6840).state).toBe('EXIT_ARMED')
    expect(coordinator.update(6841).state).toBe('EXITING')
    expect(coordinator.update(7785).state).toBe('BELOW_HERO')
  })

  it('keeps the terminal state armed until a meaningful downward delta', () => {
    const coordinator = new PageScrollCoordinator(metrics, 6839)

    expect(coordinator.update(6840).state).toBe('EXIT_ARMED')
    expect(coordinator.update(6840.5).state).toBe('EXIT_ARMED')
    expect(coordinator.update(6843).state).toBe('EXITING')
  })

  it('re-enters at the terminal visual state before restoring signed reverse travel', () => {
    const coordinator = new PageScrollCoordinator(metrics, 7785)

    expect(coordinator.snapshot.state).toBe('BELOW_HERO')
    expect(coordinator.update(7775).state).toBe('REENTERING')
    expect(coordinator.update(7000).state).toBe('REENTERING')

    const travel = coordinator.update(6830)
    expect(travel.state).toBe('TRAVEL')
    expect(travel.delta).toBe(-170)
    expect(travel.travelProgress).toBeCloseTo(6830 / 760)
  })

  it('initializes below the Hero directly in BELOW_HERO', () => {
    const coordinator = new PageScrollCoordinator(metrics, 8000)

    expect(coordinator.snapshot).toMatchObject({
      state: 'BELOW_HERO',
      delta: 0,
      travelProgress: 9,
    })
  })

  it('initializes inside travel without changing the restored scroll position', () => {
    const coordinator = new PageScrollCoordinator(metrics, 760)

    expect(coordinator.snapshot).toMatchObject({
      state: 'TRAVEL',
      delta: 0,
      scrollPosition: 760,
      travelProgress: 1,
    })
  })
})
