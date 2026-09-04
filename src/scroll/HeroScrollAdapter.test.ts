import { describe, expect, it, vi } from 'vitest'
import { HeroScrollAdapter } from './HeroScrollAdapter'

const metrics = {
  travelEnd: 6840,
  settleEnd: 7155,
  corridorEnd: 7785,
}

describe('HeroScrollAdapter', () => {
  it('keeps the approved opening copy at the PRE_HERO boundary', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)

    expect(adapter.snapshot).toMatchObject({
      state: 'PRE_HERO',
      heroDelta: 0,
      travelProgress: 0,
      targetProgress: 0,
    })
    expect(adapter.ingest(0).travelProgress).toBe(0)
  })

  it('turns raw scroll into a target and publishes only smoothed visual deltas', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)

    expect(adapter.ingest(760, 0)).toMatchObject({
      heroDelta: 0,
      targetProgress: 1,
      travelProgress: 0,
    })

    adapter.advance(0)
    const frame = adapter.advance(16)

    expect(frame.travelProgress).toBeGreaterThan(0)
    expect(frame.travelProgress).toBeLessThan(1)
    expect(frame.heroDelta).toBeGreaterThan(0)
  })

  it('does not teleport to the terminal frame when raw scroll reaches the exit', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)

    const exiting = adapter.ingest(6840, 0)

    expect(exiting).toMatchObject({
      state: 'EXIT_ARMED',
      heroDelta: 0,
      targetProgress: 9,
      travelProgress: 0,
    })

    adapter.advance(0)
    expect(adapter.advance(16).travelProgress).toBeLessThan(0.2)
  })

  it('publishes snapshots and stops cleanly after unsubscribe', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)
    const listener = vi.fn()
    const unsubscribe = adapter.subscribe(listener)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'PRE_HERO' }))

    adapter.ingest(100, 0)
    unsubscribe()
    adapter.ingest(200, 16)

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'TRAVEL' }))
  })

  it('publishes an already reached terminal state to a late subscriber', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)
    adapter.ingest(metrics.settleEnd, 0)
    const listener = vi.fn()

    adapter.subscribe(listener)

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      state: 'EXIT_ARMED',
      scrollPosition: metrics.settleEnd,
      targetProgress: 9,
    }))
  })

  it('starts at restored progress without replaying earlier scenes', () => {
    const adapter = new HeroScrollAdapter(metrics, 1520)

    expect(adapter.snapshot).toMatchObject({
      state: 'TRAVEL',
      targetProgress: 2,
      travelProgress: 2,
    })
  })
})
