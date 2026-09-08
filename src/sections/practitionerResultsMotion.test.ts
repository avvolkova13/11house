import { describe, expect, it } from 'vitest'
import {
  getPractitionerLayout,
  getPractitionerRailState,
  getPractitionerResultsProgress,
  getPractitionerWaveTickState,
  samplePractitionerScrub,
} from './practitionerResultsMotion'

describe('Produx review motion', () => {
  it('uses the reference scroll boundaries independently of the measured sticky height', () => {
    expect(getPractitionerResultsProgress(-252, 2304, 886, 720)).toBeCloseTo(0, 10)
    expect(getPractitionerResultsProgress(-936, 2304, 886, 720)).toBe(0.5)
    expect(getPractitionerResultsProgress(-1620, 2304, 886, 720)).toBe(1)
    expect(getPractitionerResultsProgress(100, 2304, 500, 720)).toBeCloseTo(0, 10)
    expect(getPractitionerResultsProgress(-4000, 2304, 500, 720)).toBe(1)
  })

  it('moves and flattens with the same quadratic ease instead of two smoothersteps', () => {
    const start = getPractitionerRailState(0, 1280, 720, 1151.2, 70.4)
    const quarter = getPractitionerRailState(0.25, 1280, 720, 1151.2, 70.4)
    const end = getPractitionerRailState(1, 1280, 720, 1151.2, 70.4)
    expect(start).toEqual({ x: 298.24, cardStepY: 72 })
    expect(end).toEqual({ x: -12, cardStepY: 0 })
    expect(quarter.cardStepY).toBe(40.5)
    expect((start.x - quarter.x) / (start.x - end.x)).toBeCloseTo(0.4375)
  })

  it('keeps the mobile scroll choreography and uses measured responsive tick density', () => {
    expect(getPractitionerLayout(1280).tickCount).toBe(250)
    expect(getPractitionerLayout(1024).tickCount).toBe(133)
    expect(getPractitionerLayout(390).tickCount).toBe(67)
    const layout = getPractitionerLayout(390)
    expect(layout.cardWidth).toBeCloseTo(284.31)
    expect(layout.padding).toBeCloseTo(23.283)
    const start = getPractitionerRailState(0, 390, 844, 870.246, layout.padding)
    const end = getPractitionerRailState(1, 390, 844, 870.246, layout.padding)
    expect(start.x).toBe(42.9)
    expect(start.cardStepY).toBe(59.08)
    expect(end.x + 870.246 + layout.padding).toBeCloseTo(390 - layout.padding)
  })

  it('lets scroll motion settle in 1.5 seconds without depending on frame rate', () => {
    expect(samplePractitionerScrub(0, 1, 0)).toBeCloseTo(0, 10)
    expect(samplePractitionerScrub(0, 1, 750)).toBeCloseTo(0.96875)
    expect(samplePractitionerScrub(0, 1, 1500)).toBe(1)
    expect(samplePractitionerScrub(0.8, 0.1, 1500)).toBe(0.1)
    expect(samplePractitionerScrub(0.5, 0.5, 100)).toBe(0.5)
  })

  it('keeps the wave peak inside the ruler at both ends and uses a seven-tick crest', () => {
    expect(getPractitionerWaveTickState(0, 3, 250, 1280).opacity).toBe(1)
    expect(getPractitionerWaveTickState(1, 246, 250, 1280).opacity).toBe(1)
    expect(getPractitionerWaveTickState(0, 7, 250, 1280)).toEqual({ height: 7.04, opacity: 0.05 })
    expect(getPractitionerWaveTickState(0, 3, 67, 390).height).toBe(14.82)
    expect(getPractitionerWaveTickState(0, 3, 132, 1024).height).toBe(20)
  })
})

it('reveals heading words at the reference cadence and finishes without residual motion', async () => {
  const motion = await import('./practitionerResultsMotion')
  const sample = motion.samplePractitionerHeadingMotion
  expect(sample).toBeTypeOf('function')
  expect(sample(35, 1)).toEqual({ reveal: 0, settle: 0 })
  expect(sample(875, 0).reveal).toBeCloseTo(Math.SQRT1_2)
  expect(sample(700, 0).settle).toBeGreaterThan(0.9)
  expect(sample(700, 0).settle).toBeLessThan(0.93)
  expect(sample(1890, 2)).toEqual({ reveal: 1, settle: 1 })
})
