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
    expect(states.map((state) => state.zIndex)).toEqual([1, 2, 3, 4, 5])
  })

  it('sends cards upward one at a time after the complete stack hold', () => {
    const firstExit = getProductCardState(0.72, 4, 5, false)
    const nextExit = getProductCardState(0.72, 3, 5, false)
    const oldest = getProductCardState(0.72, 0, 5, false)

    expect(firstExit.y).toBeLessThan(-700)
    expect(nextExit.y).toBeLessThan(-80)
    expect(oldest.y).toBeGreaterThan(-40)
  })

  it('clamps progress and compresses off-screen travel on compact viewports', () => {
    expect(getProductCardState(-1, 0, 5, true)).toMatchObject({ x: 300, y: -230, opacity: 0 })
    expect(getProductCardState(2, 0, 5, true)).toMatchObject({ y: -600, opacity: 1, blur: 0 })
  })
})
