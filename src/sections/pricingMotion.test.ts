import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PRICING_PLAN_KEY,
  PRICING_CYCLE_MS,
  PRICING_HOLD_MS,
  PRICING_TRANSITION_MS,
  beginPricingTransition,
  completePricingTransition,
  createPricingMotionState,
  getPricingCardRole,
} from './pricingMotion'

const planKeys = ['start', 'pro', 'studio'] as const

describe('pricing motion state machine', () => {
  it('keeps the approved hold and uses the measured Obscura transition window', () => {
    expect(PRICING_HOLD_MS).toBe(4500)
    expect(PRICING_TRANSITION_MS).toBe(1350)
    expect(PRICING_CYCLE_MS).toBe(5850)
  })

  it('opens Pro in a stable holding phase', () => {
    expect(DEFAULT_PRICING_PLAN_KEY).toBe('pro')
    expect(createPricingMotionState()).toEqual({
      activeKey: 'pro',
      targetKey: null,
      phase: 'holding',
      direction: 'forward',
      sequence: 0,
    })
  })

  it('advances automatically from the right card into center', () => {
    const fromPro = beginPricingTransition(createPricingMotionState(), planKeys)

    expect(fromPro).toMatchObject({
      activeKey: 'pro',
      targetKey: 'start',
      phase: 'transitioning',
      direction: 'forward',
      sequence: 1,
    })

    const onStart = completePricingTransition(fromPro)
    expect(onStart).toMatchObject({ activeKey: 'start', targetKey: null, phase: 'holding' })

    const fromStart = beginPricingTransition(onStart, planKeys)
    expect(fromStart).toMatchObject({ targetKey: 'studio', direction: 'forward' })
  })

  it('chooses the shortest direction for manual selection', () => {
    const forward = beginPricingTransition(createPricingMotionState(), planKeys, 'start')
    expect(forward).toMatchObject({ targetKey: 'start', direction: 'forward' })

    const backward = beginPricingTransition(createPricingMotionState(), planKeys, 'studio')
    expect(backward).toMatchObject({ targetKey: 'studio', direction: 'backward' })
  })

  it('does not restart for the active plan or interrupt a running transition', () => {
    const holding = createPricingMotionState()
    expect(beginPricingTransition(holding, planKeys, 'pro')).toBe(holding)

    const transitioning = beginPricingTransition(holding, planKeys, 'studio')
    expect(beginPricingTransition(transitioning, planKeys, 'start')).toBe(transitioning)
  })

  it('keeps exactly three stable card roles while the centered plan changes', () => {
    const holding = createPricingMotionState()
    expect(planKeys.map((key) => getPricingCardRole(key, holding, planKeys))).toEqual([
      'previous',
      'active',
      'next',
    ])

    const forward = beginPricingTransition(holding, planKeys, 'studio')
    expect(planKeys.map((key) => getPricingCardRole(key, forward, planKeys))).toEqual([
      'next',
      'previous',
      'active',
    ])

    const backward = beginPricingTransition(holding, planKeys, 'start')
    expect(planKeys.map((key) => getPricingCardRole(key, backward, planKeys))).toEqual([
      'active',
      'next',
      'previous',
    ])
  })
})
