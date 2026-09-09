import { describe, expect, it } from 'vitest'
import { JourneySceneAdapter } from './JourneySceneAdapter'

describe('JourneySceneAdapter', () => {
  it('restores a scene without producing a synthetic flight', () => {
    const adapter = new JourneySceneAdapter()
    adapter.restore({ sceneProgress: 6.32, flightPosition: 6000 })
    expect(adapter.snapshot.travelProgress).toBe(6.32)
    expect(adapter.snapshot.heroDelta).toBe(0)
    adapter.advance(0)
    adapter.advance(16)
    expect(adapter.snapshot.heroDelta).toBe(0)
  })

  it('smooths transition speed, settles, and permits reverse travel', () => {
    const adapter = new JourneySceneAdapter()
    adapter.restore({ sceneProgress: 2.4, flightPosition: 760 })
    adapter.setTarget({ sceneProgress: 2.4, flightPosition: 1520 })
    adapter.advance(0)
    adapter.advance(16)
    expect(adapter.snapshot.heroDelta).toBeGreaterThan(0)
    expect(adapter.snapshot.heroDelta).toBeLessThan(760)
    for (let t = 32; t <= 2000; t += 16) adapter.advance(t)
    expect(adapter.snapshot.heroDelta).toBe(0)
    adapter.setTarget({ sceneProgress: 2.4, flightPosition: 760 })
    adapter.advance(2016)
    expect(adapter.snapshot.heroDelta).toBeLessThan(0)
  })

  it('unsubscribes listeners without leaking into subsequent frames', () => {
    const adapter = new JourneySceneAdapter()
    let count = 0
    const stop = adapter.subscribe(() => count++)
    expect(count).toBe(1)
    stop()
    adapter.restore({ sceneProgress: 2.4, flightPosition: 760 })
    expect(count).toBe(1)
  })
})
