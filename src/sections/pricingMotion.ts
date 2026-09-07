import type { PricingPlan } from './pricingData'

export const PRICING_HOLD_MS = 4500
export const PRICING_TRANSITION_MS = 1350
export const PRICING_CYCLE_MS = PRICING_HOLD_MS + PRICING_TRANSITION_MS
export const DEFAULT_PRICING_PLAN_KEY: PricingPlan['key'] = 'pro'

export type PricingMotionPhase = 'holding' | 'transitioning'
export type PricingMotionDirection = 'forward' | 'backward'
export type PricingCardRole = 'active' | 'previous' | 'next'

export type PricingMotionState = {
  activeKey: PricingPlan['key']
  targetKey: PricingPlan['key'] | null
  phase: PricingMotionPhase
  direction: PricingMotionDirection
  sequence: number
}

export function createPricingMotionState(
  activeKey: PricingPlan['key'] = DEFAULT_PRICING_PLAN_KEY,
): PricingMotionState {
  return {
    activeKey,
    targetKey: null,
    phase: 'holding',
    direction: 'forward',
    sequence: 0,
  }
}

export function beginPricingTransition(
  state: PricingMotionState,
  planKeys: readonly PricingPlan['key'][],
  requestedKey?: PricingPlan['key'],
): PricingMotionState {
  if (state.phase === 'transitioning' || planKeys.length < 2) return state

  const activeIndex = planKeys.indexOf(state.activeKey)
  if (activeIndex < 0) return state

  const targetIndex = requestedKey === undefined
    ? (activeIndex - 1 + planKeys.length) % planKeys.length
    : planKeys.indexOf(requestedKey)

  if (targetIndex < 0 || targetIndex === activeIndex) return state

  const forwardDistance = (targetIndex - activeIndex + planKeys.length) % planKeys.length
  const direction: PricingMotionDirection = requestedKey === undefined || forwardDistance > planKeys.length / 2
    ? 'forward'
    : 'backward'

  return {
    ...state,
    targetKey: planKeys[targetIndex],
    phase: 'transitioning',
    direction,
    sequence: state.sequence + 1,
  }
}

export function completePricingTransition(state: PricingMotionState): PricingMotionState {
  if (state.phase !== 'transitioning' || state.targetKey === null) return state

  return {
    ...state,
    activeKey: state.targetKey,
    targetKey: null,
    phase: 'holding',
  }
}

export function getPricingCardRole(
  planKey: PricingPlan['key'],
  state: PricingMotionState,
  planKeys: readonly PricingPlan['key'][],
): PricingCardRole {
  const centeredKey = state.targetKey ?? state.activeKey
  if (planKey === centeredKey) return 'active'

  const activeIndex = planKeys.indexOf(centeredKey)
  const planIndex = planKeys.indexOf(planKey)
  if (activeIndex < 0 || planIndex < 0) return 'next'

  const previousIndex = (activeIndex - 1 + planKeys.length) % planKeys.length
  return planIndex === previousIndex ? 'previous' : 'next'
}
