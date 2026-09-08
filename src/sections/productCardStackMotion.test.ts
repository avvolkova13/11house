import { describe, expect, it } from 'vitest'

import { getProductCardState } from './productCardStackMotion'

describe('getProductCardState', () => {
  it('starts cards above the viewport on alternating horizontal sides', () => {
    const first = getProductCardState(0, 0, 5, false)
    const second = getProductCardState(0, 1, 5, false)

    expect(first).toMatchObject({ x: 360, y: -260, rotation: 9, scale: 1.1, opacity: 0, blur: 5 })
    expect(second).toMatchObject({ x: -360, y: -260, rotation: -9, scale: 1.1, opacity: 0, blur: 5 })
  })

  it('stages entries so the first card lands before the last card begins', () => {
    const first = getProductCardState(0.22, 0, 5, false)
    const last = getProductCardState(0.22, 4, 5, false)

    expect(first.opacity).toBe(1)
    expect(Math.abs(first.x)).toBeLessThan(40)
    expect(last.opacity).toBe(0)
    expect(last.x).toBe(360)
  })

  it('settles all cards into a compact alternating fan', () => {
    const states = Array.from({ length: 5 }, (_, index) => getProductCardState(0.48, index, 5, false))

    expect(states.every((state) => state.opacity === 1 && state.blur === 0)).toBe(true)
    expect(states.map((state) => state.rotation)).toEqual([-3.2, 3.7, -1.6, 2.2, 0])
    expect(states.map((state) => state.x)).toEqual([-12, 12, -7, 8, 0])
    expect(states.map((state) => state.zIndex)).toEqual([5, 4, 3, 2, 1])
  })

  it('sends cards upward in reading order 01 through 05 after the complete stack hold', () => {
    const firstExit = getProductCardState(0.72, 0, 5, false)
    const nextExit = getProductCardState(0.72, 1, 5, false)
    const oldest = getProductCardState(0.72, 4, 5, false)

    expect(firstExit.y).toBeLessThan(-700)
    expect(nextExit.y).toBeLessThan(-80)
    expect(oldest.y).toBeGreaterThan(-40)
  })

  it('never makes a visible card translucent over the other slides', () => {
    for (let sample = 0; sample <= 1000; sample++) {
      for (let index = 0; index < 5; index++) {
        expect([0, 1]).toContain(getProductCardState(sample / 1000, index, 5, false).opacity)
      }
    }
  })

  it.each([false, true])('keeps the final card readable until the section scrolls away (compact: %s)', (compact) => {
    const heldCard = getProductCardState(0.48, 4, 5, compact)

    for (const progress of [0.84, 0.9, 0.98, 1, 2, 0.98, 0.9]) {
      expect(getProductCardState(progress, 4, 5, compact)).toEqual(heldCard)
    }
    for (let index = 0; index < 4; index++) {
      expect(getProductCardState(1, index, 5, compact).y).toBe(compact ? -600 : -730)
    }
  })

  it('clamps progress and compresses off-screen travel on compact viewports', () => {
    expect(getProductCardState(-1, 0, 5, true)).toMatchObject({ x: 300, y: -230, opacity: 0 })
    expect(getProductCardState(2, 0, 5, true)).toMatchObject({ y: -600, opacity: 1, blur: 0 })
  })
})
