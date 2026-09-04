import type { CSSProperties } from 'react'

import {
  getPricingOrbitDelay,
  PRICING_ORBIT_DURATION_MS,
  PRICING_ORBIT_PHASE_MS,
} from './pricingMotion'
import type { PricingPlan } from './pricingData'

type PricingOrbitProps = {
  plans: PricingPlan[]
  selectedKey: PricingPlan['key']
  inView: boolean
  onSelect: (key: PricingPlan['key']) => void
}

export function PricingOrbit({ plans, selectedKey, inView, onSelect }: PricingOrbitProps) {
  const sceneStyle = {
    '--pricing-orbit-duration': `${PRICING_ORBIT_DURATION_MS}ms`,
    '--pricing-reflection-duration': `${PRICING_ORBIT_DURATION_MS / 2}ms`,
    '--pricing-reflection-delay': `${-PRICING_ORBIT_PHASE_MS}ms`,
  } as CSSProperties

  return (
    <div className="pricing-orbit" data-in-view={inView ? 'true' : 'false'} style={sceneStyle}>
      <div className="pricing-orbit__reflection pricing-orbit__reflection--top" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="pricing-orbit__reflection pricing-orbit__reflection--bottom" aria-hidden="true">
        <i />
        <i />
      </div>

      <div className="pricing-orbit__track">
        {plans.map((plan, index) => {
          const cardStyle = {
            '--orbit-delay': `${getPricingOrbitDelay(index)}ms`,
          } as CSSProperties

          return (
            <button
              className={`pricing-orbit-card pricing-orbit-card--${plan.key}`}
              data-selected={selectedKey === plan.key ? 'true' : 'false'}
              style={cardStyle}
              type="button"
              aria-label={`Подробнее о тарифе ${plan.name}`}
              aria-pressed={selectedKey === plan.key}
              onClick={() => onSelect(plan.key)}
              key={plan.key}
            >
              <span className="pricing-orbit-card__art" aria-hidden="true">
                <i />
              </span>
              <span className="pricing-orbit-card__content">
                <span className="pricing-orbit-card__brand">ElevenHouse</span>
                <span className="pricing-orbit-card__name">{plan.name}</span>
                <span className="pricing-orbit-card__price">
                  <strong>{plan.price}</strong>
                  <small>{plan.period}</small>
                </span>
                <span className="pricing-orbit-card__audience">{plan.audience}</span>
                <span className="pricing-orbit-card__commission">
                  <small>Комиссия</small>
                  <strong>{plan.commission}</strong>
                </span>
                <span className="pricing-orbit-card__action">Подробнее</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
