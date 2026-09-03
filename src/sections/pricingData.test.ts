import { describe, expect, it } from 'vitest'
import { pricingPlans } from './pricingData'

describe('pricingPlans', () => {
  it('preserves the exact prices and commissions from the approved brief', () => {
    expect(pricingPlans.map(({ name, price, commission }) => ({ name, price, commission }))).toEqual([
      { name: 'Старт', price: '0 ₽', commission: '8%' },
      { name: 'Pro', price: '1 990 ₽', commission: '4%' },
      { name: 'Studio', price: '4 990 ₽', commission: '2%' },
    ])
  })

  it('preserves Start limits and the Studio team size', () => {
    expect(pricingPlans[0].limits).toEqual([
      '30 записей в месяц',
      '20 AI-действий в месяц',
      '1 воронка',
      '1 пользователь',
    ])
    expect(pricingPlans[2].limits).toContain('Команда до 5 астрологов')
  })
})
