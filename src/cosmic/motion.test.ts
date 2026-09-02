import { describe, expect, it } from 'vitest'
import { clamp, damp, decayVelocity, getTravelSpeed, wrapDepth, wrapDepthLoop } from './motion'

describe('motion helpers', () => {
  it('damps toward a target without overshooting', () => {
    const next = damp(0, 10, 6, 1 / 60)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(10)
  })

  it('decays signed velocity while preserving direction', () => {
    const next = decayVelocity(-8, 4, 1 / 60)
    expect(next).toBeLessThan(0)
    expect(Math.abs(next)).toBeLessThan(8)
  })

  it('clamps and wraps depth deterministically', () => {
    expect(clamp(12, -2, 5)).toBe(5)
    expect(wrapDepth(3, 2, -20)).toBe(-20)
    expect(wrapDepth(-21, 2, -20)).toBe(2)
  })

  it('wraps arbitrarily large travel distances without leaving the depth corridor', () => {
    expect(wrapDepthLoop(25, 20, -100)).toBe(-95)
    expect(wrapDepthLoop(265, 20, -100)).toBe(-95)
    expect(wrapDepthLoop(-105, 20, -100)).toBe(15)
    expect(wrapDepthLoop(-345, 20, -100)).toBe(15)
  })

  it('maps signed scroll velocity to forward and backward travel', () => {
    expect(getTravelSpeed(5, false)).toBeGreaterThan(getTravelSpeed(0, false))
    expect(getTravelSpeed(-5, false)).toBeLessThan(0)
  })

  it('ignores scroll impulses when reduced motion is active', () => {
    expect(getTravelSpeed(8, true)).toBeCloseTo(0.16)
    expect(getTravelSpeed(-8, true)).toBeCloseTo(0.16)
  })
})
