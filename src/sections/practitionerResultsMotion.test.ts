import { describe, expect, it } from 'vitest'

import {
  REVIEW_WAVE_TICK_COUNT,
  getPractitionerEntranceState,
  getPractitionerRailState,
  getPractitionerResultsProgress,
  getPractitionerWaveTickState,
} from './practitionerResultsMotion'

describe('practitionerResultsMotion', () => {
  it('starts after the oversized sticky stage reaches its measured pin offset', () => {
    const viewportHeight = 720
    const stageHeight = viewportHeight * 1.23
    const sectionHeight = viewportHeight * 3.2
    const pinOffset = stageHeight - viewportHeight

    expect(getPractitionerResultsProgress(0, sectionHeight, stageHeight, viewportHeight)).toBe(0)
    expect(getPractitionerResultsProgress(-pinOffset, sectionHeight, stageHeight, viewportHeight)).toBe(0)
    expect(getPractitionerResultsProgress(
      -(pinOffset + sectionHeight - stageHeight),
      sectionHeight,
      stageHeight,
      viewportHeight,
    )).toBe(1)
  })

  it('clamps progress outside the sticky runway', () => {
    expect(getPractitionerResultsProgress(500, 2304, 886, 720)).toBe(0)
    expect(getPractitionerResultsProgress(-4000, 2304, 886, 720)).toBe(1)
  })

  it('starts at the measured horizontal offset and aligns the last card at the end', () => {
    const start = getPractitionerRailState(0, 1280, 720, 1151.2, 70.4)
    const end = getPractitionerRailState(1, 1280, 720, 1151.2, 70.4)

    expect(start.x).toBe(298.24)
    expect(end.x).toBe(-12)
    expect(start.cardStepY).toBe(72)
    expect(end.cardStepY).toBe(0)
  })

  it('softly flattens the card cascade while the rail moves left', () => {
    const start = getPractitionerRailState(0, 1280, 720, 1151.2, 70.4)
    const middle = getPractitionerRailState(0.5, 1280, 720, 1151.2, 70.4)
    const end = getPractitionerRailState(1, 1280, 720, 1151.2, 70.4)

    expect(middle.x).toBeLessThan(start.x)
    expect(middle.x).toBeGreaterThan(end.x)
    expect(middle.cardStepY).toBeLessThan(start.cardStepY)
    expect(middle.cardStepY).toBeGreaterThan(0)
  })

  it('settles the header link from the Produx blur and rotation', () => {
    expect(getPractitionerEntranceState(720, 720)).toEqual({
      opacity: 0,
      y: 16.848,
      blur: 8,
      rotate: -2,
    })

    expect(getPractitionerEntranceState(0, 720)).toEqual({
      opacity: 1,
      y: 0,
      blur: 0,
      rotate: 0,
    })
  })

  it('moves a narrow bright wave peak across 250 quiet ticks', () => {
    expect(REVIEW_WAVE_TICK_COUNT).toBe(250)

    const quiet = getPractitionerWaveTickState(0.5, 0)
    const peak = getPractitionerWaveTickState(0.5, 125)
    const endPeak = getPractitionerWaveTickState(1, REVIEW_WAVE_TICK_COUNT - 1)

    expect(quiet).toEqual({ height: 7, opacity: 0.05 })
    expect(peak.height).toBeGreaterThan(19)
    expect(peak.opacity).toBeGreaterThan(0.97)
    expect(endPeak.height).toBe(19.4)
    expect(endPeak.opacity).toBe(0.984)
  })
})
