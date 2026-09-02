import { describe, expect, it } from 'vitest'
import {
  PageScrollCoordinator,
  getHeroCorridorMetrics,
  type HeroCorridorMetrics,
} from './PageScrollCoordinator'

const metrics: HeroCorridorMetrics = {
  travelEnd: 4560,
  settleEnd: 4880,
  corridorEnd: 5480,
}

describe('getHeroCorridorMetrics', () => {
  it('derives the travel phase from the six approved 760px narrative transitions', () => {
    expect(getHeroCorridorMetrics(1440, 900, false)).toEqual({
      travelEnd: 4560,
      settleEnd: 4875,
      corridorEnd: 5505,
    })
  })

  it('uses a shorter handoff on mobile without changing the narrative timing', () => {
    expect(getHeroCorridorMetrics(390, 844, false)).toEqual({
      travelEnd: 4560,
      settleEnd: 4855,
      corridorEnd: 5277,
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
    expect(coordinator.update(4559).state).toBe('TRAVEL')
    expect(coordinator.update(4560).state).toBe('EXIT_ARMED')
    expect(coordinator.update(4561).state).toBe('EXITING')
    expect(coordinator.update(5480).state).toBe('BELOW_HERO')
  })

  it('keeps the terminal state armed until a meaningful downward delta', () => {
    const coordinator = new PageScrollCoordinator(metrics, 4559)

    expect(coordinator.update(4560).state).toBe('EXIT_ARMED')
    expect(coordinator.update(4560.5).state).toBe('EXIT_ARMED')
    expect(coordinator.update(4563).state).toBe('EXITING')
  })

  it('re-enters at the terminal visual state before restoring signed reverse travel', () => {
    const coordinator = new PageScrollCoordinator(metrics, 5480)

    expect(coordinator.snapshot.state).toBe('BELOW_HERO')
    expect(coordinator.update(5470).state).toBe('REENTERING')
    expect(coordinator.update(4700).state).toBe('REENTERING')

    const travel = coordinator.update(4550)
    expect(travel.state).toBe('TRAVEL')
    expect(travel.delta).toBe(-150)
    expect(travel.travelProgress).toBeCloseTo(4550 / 760)
  })

  it('initializes below the Hero directly in BELOW_HERO', () => {
    const coordinator = new PageScrollCoordinator(metrics, 6000)

    expect(coordinator.snapshot).toMatchObject({
      state: 'BELOW_HERO',
      delta: 0,
      travelProgress: 6,
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
