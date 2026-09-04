import type { PricingPlan } from './pricingData'

export const PRICING_ORBIT_DURATION_MS = 9087
export const PRICING_ORBIT_PHASE_MS = PRICING_ORBIT_DURATION_MS / 3
export const DEFAULT_PRICING_PLAN_KEY: PricingPlan['key'] = 'pro'

export function getPricingOrbitDelay(index: number) {
  return index === 0 ? 0 : -index * PRICING_ORBIT_PHASE_MS
}
