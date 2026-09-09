import { describe, expect, it } from 'vitest'
import { getChapterFrame, sampleJourneyScene } from './journeyMotion'

describe('journey scroll separation', () => {
  const layout = { viewport: 800, chapterStarts: [1400, 4000, 6600], finaleTop: 12000 }

  it('keeps the stars in their existing opening state at page entry', () => {
    expect(sampleJourneyScene(0, layout)).toEqual({ sceneProgress: 0, flightPosition: 0 })
  })

  it('does not start another flight while working inside one interface', () => {
    const first = sampleJourneyScene(1800, layout)
    const second = sampleJourneyScene(2900, layout)
    expect(second.flightPosition).toBe(first.flightPosition)
    expect(first.sceneProgress).toBeLessThan(4.72)
    expect(second.sceneProgress).toBe(first.sceneProgress)
  })

  it('moves during chapter changes and reverses on upward scroll', () => {
    const a = sampleJourneyScene(3700, layout)
    const b = sampleJourneyScene(3950, layout)
    expect(b.flightPosition - a.flightPosition).toBeGreaterThan(0)
    expect(a.flightPosition - b.flightPosition).toBeLessThan(0)
  })

  it('keeps the tunnel out of CRM and commercial content', () => {
    for (const y of [1400, 4000, 6600, 9000, 11000]) {
      expect(sampleJourneyScene(y, layout).sceneProgress).toBeLessThan(4.72)
    }
    expect(sampleJourneyScene(12800, layout).sceneProgress).toBeCloseTo(6.32)
    expect(sampleJourneyScene(30000, layout).sceneProgress).toBeCloseTo(6.32)
  })

  it('reveals all steps in order and gives the final step a reading interval', () => {
    const steps = [0, 400, 800, 1200, 1600].map((scroll) => getChapterFrame(-scroll, 2400, 800, 4).step)
    expect(steps).toEqual([0, 1, 2, 3, 3])
    expect(getChapterFrame(-1500, 2400, 800, 4).opacity).toBeGreaterThan(0)
  })

  it('handles short sections and clamps restored positions', () => {
    expect(getChapterFrame(400, 600, 800, 3).step).toBe(0)
    expect(getChapterFrame(-4000, 600, 800, 3).step).toBe(2)
    expect(sampleJourneyScene(-100, layout).sceneProgress).toBe(0)
  })

  it('lets a tall mobile panel scroll fully into view before advancing its states', () => {
    // 1200px panel in an 800px viewport, followed by three 260px reading bands.
    expect(getChapterFrame(-400, 1980, 800, 3, 1200).step).toBe(0)
    expect(getChapterFrame(-650, 1980, 800, 3, 1200).step).toBe(0)
    expect(getChapterFrame(-670, 1980, 800, 3, 1200).step).toBe(1)
    expect(getChapterFrame(-930, 1980, 800, 3, 1200).step).toBe(2)
  })
})
