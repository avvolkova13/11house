import { describe, expect, it } from 'vitest'

import {
  DEFAULT_PRICING_PLAN_KEY,
  PRICING_ORBIT_DURATION_MS,
  PRICING_ORBIT_PHASE_MS,
  getPricingOrbitDelay,
} from './pricingMotion'

describe('pricing orbit motion contract', () => {
  it('keeps the three cards equally phased at the reference cadence', () => {
    expect(PRICING_ORBIT_DURATION_MS).toBe(9087)
    expect(PRICING_ORBIT_PHASE_MS).toBe(3029)
    expect([0, 1, 2].map(getPricingOrbitDelay)).toEqual([0, -3029, -6058])
  })

  it('opens Pro details by default', () => {
    expect(DEFAULT_PRICING_PLAN_KEY).toBe('pro')
  })
})
