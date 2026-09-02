import { describe, expect, it } from 'vitest'
import {
  HERO_LAST_STAGE_INDEX,
  HERO_NARRATIVE_STAGES,
  getLinearStageOffset,
  getProductStageMotion,
  getTunnelMix,
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
