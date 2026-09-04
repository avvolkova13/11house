import { describe, expect, it } from 'vitest'
import {
  HERO_LAST_STAGE_INDEX,
  HERO_LAST_VISUAL_INDEX,
  HERO_NARRATIVE_STAGES,
  getLinearStageOffset,
  getFinaleStageOpacity,
  getProductStageMotion,
  getTunnelMix,
  getTunnelDive,
  getTunnelPresentation,
} from './heroNarrative'

describe('HERO_NARRATIVE_STAGES', () => {
  it('keeps the approved opening title order exactly once', () => {
    expect(HERO_NARRATIVE_STAGES.slice(0, 3).map((stage) => stage.title)).toEqual([
      'Вся практика астролога',
      'в одном кабинете',
      'ElevenHouse',
    ])
    expect(HERO_NARRATIVE_STAGES.slice(0, 3).map((stage) => stage.title).join(' ')).toBe(
      'Вся практика астролога в одном кабинете ElevenHouse',
    )
    expect(new Set(HERO_NARRATIVE_STAGES.map((stage) => stage.title)).size)
      .toBe(HERO_NARRATIVE_STAGES.length)
  })

  it('maps every product scene to an existing ElevenHouse screenshot', () => {
    expect(HERO_NARRATIVE_STAGES.slice(3, 6)).toMatchObject([
      { title: 'Карты и клиенты', screenshot: '/assets/product-screenshots/eh-products-tiles.png' },
      { title: 'Запись и оплаты', screenshot: '/assets/product-screenshots/eh-calendar-tiles.png' },
      { title: 'AI-помощник', screenshot: '/assets/product-screenshots/eh-numerology-tiles.png' },
    ])
  })

  it('adds three visual-only stages without adding temporary copy', () => {
    expect(HERO_LAST_STAGE_INDEX).toBe(6)
    expect(HERO_LAST_VISUAL_INDEX).toBe(9)
    expect(HERO_NARRATIVE_STAGES).toHaveLength(7)
  })
})

describe('tunnel visual progress', () => {
  it('keeps formation timing and starts the final presentation near its end', () => {
    expect(getTunnelMix(4.72)).toBe(0)
    expect(getTunnelMix(6)).toBe(1)
    expect(getTunnelPresentation(5.92)).toBe(0)
    expect(getTunnelPresentation(6.12)).toBeGreaterThan(0)
    expect(getTunnelPresentation(6.32)).toBe(1)
  })

  it('maps three visual stages to a slower full reversible dive', () => {
    expect(getTunnelDive(5.99)).toBe(0)
    expect(getTunnelDive(7.5)).toBeCloseTo(0.5)
    expect(getTunnelDive(9)).toBe(1)
  })

})

describe('linear Hero travel', () => {
  it('never wraps a completed stage back into view', () => {
    expect(getLinearStageOffset(0, 0)).toBe(0)
    expect(getLinearStageOffset(3, 0)).toBe(-3)
    expect(getLinearStageOffset(HERO_LAST_STAGE_INDEX, 0)).toBe(-HERO_LAST_STAGE_INDEX)
  })

  it('brings the product plane through the focal point and back into depth', () => {
    expect(getProductStageMotion(0)).toMatchObject({ opacity: 1, scale: 1 })
    expect(getProductStageMotion(0.65).opacity).toBeLessThan(1)
    expect(getProductStageMotion(-0.65).opacity).toBeLessThan(1)
    expect(getProductStageMotion(1.2).opacity).toBe(0)
  })

  it('holds the next product scene in depth until the outgoing tile tail clears', () => {
    expect(getProductStageMotion(0.32, true).opacity).toBeLessThan(0.15)
    expect(getProductStageMotion(0.12, true).opacity).toBeGreaterThan(0.65)
    expect(getProductStageMotion(0.32).opacity).toBeGreaterThan(0.75)
  })

  it('keeps adjacent product scenes from visibly overlapping during handoff', () => {
    const visibilitySamples = Array.from({ length: 101 }, (_, index) => {
      const travel = index / 100
      const outgoing = getProductStageMotion(-travel).opacity
      const incoming = getProductStageMotion(1 - travel, true).opacity
      return { incoming, outgoing }
    })

    expect(Math.max(...visibilitySamples.map(({ incoming, outgoing }) => incoming * outgoing)))
      .toBeLessThan(0.03)
    expect(Math.max(...visibilitySamples.map(({ incoming, outgoing }) => Math.min(incoming, outgoing))))
      .toBeLessThan(0.05)
  })

  it('holds the finale until the final product panel has cleared the camera', () => {
    const visibilitySamples = Array.from({ length: 101 }, (_, index) => {
      const travel = index / 100
      return {
        outgoing: getProductStageMotion(-travel).opacity,
        incoming: getFinaleStageOpacity(1 - travel),
      }
    })

    expect(getFinaleStageOpacity(0)).toBe(1)
    expect(getFinaleStageOpacity(0.2)).toBe(0)
    expect(getFinaleStageOpacity(0.12)).toBeGreaterThan(0.65)
    expect(Math.max(...visibilitySamples.map(({ incoming, outgoing }) => Math.min(incoming, outgoing))))
      .toBeLessThan(0.05)
  })

  it('forms the tunnel only as the AI-помощник scene arrives', () => {
    expect(getTunnelMix(4)).toBe(0)
    expect(getTunnelMix(5)).toBeGreaterThan(0)
    expect(getTunnelMix(HERO_LAST_STAGE_INDEX)).toBe(1)
  })
})
