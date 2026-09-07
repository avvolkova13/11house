import { describe, expect, it } from 'vitest'
import { CYCLE_MS, getMotionFrame, getRenderSize } from './motion'

describe('natal dial motion', () => {
  it('closes the twelve-second loop', () => {
    expect(getMotionFrame(0, false)).toEqual(getMotionFrame(CYCLE_MS, false))
  })

  it('follows the reference ellipse from top through right, bottom and left', () => {
    const start = getMotionFrame(0, false).prism
    expect(start.x).toBeCloseTo(0, 8)
    expect(start.y).toBeCloseTo(0.2, 8)

    const quarter = getMotionFrame(CYCLE_MS * 0.25, false).prism
    expect(quarter.x).toBeGreaterThan(0)
    expect(quarter.y).toBeCloseTo(-0.075, 8)

    const half = getMotionFrame(CYCLE_MS * 0.5, false).prism
    expect(half.x).toBeCloseTo(0, 8)
    expect(half.y).toBeLessThan(0)

    const threeQuarter = getMotionFrame(CYCLE_MS * 0.75, false).prism
    expect(threeQuarter.x).toBeLessThan(0)
    expect(threeQuarter.y).toBeCloseTo(0.075, 8)
  })

  it('uses a fixed reduced-motion frame', () => {
    expect(getMotionFrame(100, true)).toEqual(getMotionFrame(10_000, true))
  })

  it('keeps every sampled quaternion normalized', () => {
    for (let index = 0; index < 97; index += 1) {
      const quaternion = getMotionFrame(CYCLE_MS * index / 96, false).prism.quaternion
      const length = Math.hypot(...quaternion)
      expect(length).toBeCloseTo(1, 8)
    }
  })

  it('keeps tumbling through the half-cycle instead of freezing at its start pose', () => {
    const start = getMotionFrame(0, false).prism.quaternion
    const halfway = getMotionFrame(CYCLE_MS * 0.5, false).prism.quaternion

    expect(halfway).not.toEqual(start)
  })

  it('keeps the readable front face visible throughout the spatial tumble', () => {
    const start = getMotionFrame(0, false).prism.quaternion
    const quarter = getMotionFrame(CYCLE_MS * 0.25, false).prism.quaternion
    const halfway = getMotionFrame(CYCLE_MS * 0.5, false).prism.quaternion
    const dot = (a: readonly number[], b: readonly number[]) => (
      Math.abs(a.reduce((sum, value, index) => sum + value * b[index], 0))
    )

    const threeQuarter = getMotionFrame(CYCLE_MS * 0.75, false).prism.quaternion

    expect(dot(start, quarter)).toBeGreaterThan(0.9)
    expect(dot(start, halfway)).toBeGreaterThan(0.96)
    expect(dot(start, threeQuarter)).toBeGreaterThan(0.9)
    expect(quarter).not.toEqual(start)
    expect(threeQuarter).not.toEqual(start)
  })

  it('keeps the dial moderately tilted while its plane normal precesses', () => {
    const samples = Array.from({ length: 97 }, (_, index) => (
      getMotionFrame(CYCLE_MS * index / 96, false).dialRig
    ))
    const yawValues = samples.map((sample) => sample.yaw)
    const pitchValues = samples.map((sample) => sample.pitch)
    const rollValues = samples.map((sample) => sample.roll)

    expect(Math.min(...yawValues)).toBeGreaterThanOrEqual(0.26)
    expect(Math.max(...yawValues)).toBeLessThanOrEqual(0.42)
    expect(Math.max(...yawValues) - Math.min(...yawValues)).toBeGreaterThan(0.12)
    expect(Math.min(...pitchValues)).toBeLessThan(-0.1)
    expect(Math.max(...pitchValues)).toBeGreaterThan(0.1)
    expect(Math.max(...rollValues) - Math.min(...rollValues)).toBeGreaterThan(0.2)
  })

  it('keeps the outer spatial layer close to the main dial plane', () => {
    for (let index = 0; index <= 48; index += 1) {
      const rig = getMotionFrame(CYCLE_MS * index / 48, false).dialRig
      expect(rig.outerLayers).toHaveLength(3)
      expect(new Set(rig.outerLayers.map((layer) => `${layer.pitch}:${layer.yaw}:${layer.roll}`)).size).toBe(3)
      rig.outerLayers.forEach((layer) => {
        expect(Math.abs(layer.pitch)).toBeLessThanOrEqual(0.095)
        expect(Math.abs(layer.yaw)).toBeLessThanOrEqual(0.23)
        expect(Math.abs(layer.roll)).toBeLessThanOrEqual(0.14)
      })
    }

    const quarterLayers = getMotionFrame(CYCLE_MS * 0.25, false).dialRig.outerLayers
    const quarterYaw = quarterLayers.map((layer) => layer.yaw)
    expect(Math.max(...quarterYaw) - Math.min(...quarterYaw)).toBeGreaterThan(0.2)
  })

  it('caps desktop and mobile render sizes', () => {
    expect(getRenderSize(720, 3, false)).toBe(1440)
    expect(getRenderSize(720, 3, true)).toBe(1080)
  })
})
