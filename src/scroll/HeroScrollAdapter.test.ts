import { describe, expect, it, vi } from 'vitest'
import { HeroScrollAdapter } from './HeroScrollAdapter'

const metrics = {
  travelEnd: 4560,
  settleEnd: 4880,
  corridorEnd: 5480,
}

describe('HeroScrollAdapter', () => {
  it('keeps the approved opening copy at the PRE_HERO boundary', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)

    expect(adapter.snapshot).toMatchObject({
      state: 'PRE_HERO',
      heroDelta: 0,
      travelProgress: 0,
    })
    expect(adapter.ingest(0).travelProgress).toBe(0)
  })

  it('forwards signed deltas only while Hero owns TRAVEL', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)

    expect(adapter.ingest(240).heroDelta).toBe(240)
    expect(adapter.ingest(120).heroDelta).toBe(-120)
    expect(adapter.ingest(4560).heroDelta).toBe(0)
    expect(adapter.ingest(4640).heroDelta).toBe(0)
  })

  it('freezes the terminal visual progress through exit and re-entry', () => {
    const adapter = new HeroScrollAdapter(metrics, 5480)

    expect(adapter.snapshot).toMatchObject({
      state: 'BELOW_HERO',
      heroDelta: 0,
      travelProgress: 6,
    })
    expect(adapter.ingest(5200)).toMatchObject({
      state: 'REENTERING',
      heroDelta: 0,
      travelProgress: 6,
    })
    expect(adapter.ingest(4550)).toMatchObject({
      state: 'TRAVEL',
      heroDelta: -650,
    })
  })

  it('publishes snapshots and stops cleanly after unsubscribe', () => {
    const adapter = new HeroScrollAdapter(metrics, 0)
    const listener = vi.fn()
    const unsubscribe = adapter.subscribe(listener)

    adapter.ingest(100)
    unsubscribe()
    adapter.ingest(200)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ state: 'TRAVEL' }))
  })
})
