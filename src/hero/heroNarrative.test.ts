import { describe, expect, it } from 'vitest'
import {
  HERO_LAST_STAGE_INDEX,
  HERO_LAST_VISUAL_INDEX,
  HERO_NARRATIVE_STAGES,
  getLinearStageOffset,
  getProductStageMotion,
  getTunnelMix,
  getTunnelCtaReveal,
  getTunnelDive,
  getTunnelPresentation,
} from './heroNarrative'

describe('HERO_NARRATIVE_STAGES', () => {
  it('keeps the approved opening title order exactly once', () => {
    expect(HERO_NARRATIVE_STAGES.slice(0, 3).map((stage) => stage.title)).toEqual([
      'Вся ваша практика',
      'В одном пространстве',
      'ElevenHouse',
    ])
    expect(new Set(HERO_NARRATIVE_STAGES.map((stage) => stage.title)).size)
      .toBe(HERO_NARRATIVE_STAGES.length)
  })

  it('maps every product scene to an existing ElevenHouse screenshot', () => {
    expect(HERO_NARRATIVE_STAGES.slice(3, 6)).toMatchObject([
      { title: 'Хотя подождите.', screenshot: '/assets/product-screenshots/eh-p05-products.png' },
      { title: 'У вас ведь уже есть система.', screenshot: '/assets/product-screenshots/eh-p01-calendar.png' },
      { title: 'Вот она.', screenshot: '/assets/product-screenshots/eh-p04-funnel.png' },
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

  it('reveals the tunnel CTA only at the end of the extended flight', () => {
    expect(getTunnelCtaReveal(8.44)).toBe(0)
    expect(getTunnelCtaReveal(8.45)).toBe(0)
    expect(getTunnelCtaReveal(8.675)).toBeCloseTo(0.5)
    expect(getTunnelCtaReveal(8.9)).toBe(1)
    expect(getTunnelCtaReveal(9)).toBe(1)
    expect(getTunnelCtaReveal(9, false)).toBe(0)
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

  it('forms the tunnel only as the Вот она scene arrives', () => {
    expect(getTunnelMix(4)).toBe(0)
    expect(getTunnelMix(5)).toBeGreaterThan(0)
    expect(getTunnelMix(HERO_LAST_STAGE_INDEX)).toBe(1)
  })
})
