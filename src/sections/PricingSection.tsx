import { useEffect, useRef, useState } from 'react'

import { PricingOrbit } from './PricingOrbit'
import { DEFAULT_PRICING_PLAN_KEY } from './pricingMotion'
import { pricingPlans } from './pricingData'

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [selectedPlanKey, setSelectedPlanKey] = useState(DEFAULT_PRICING_PLAN_KEY)
  const [isInView, setIsInView] = useState(false)
  const selectedPlan = pricingPlans.find((plan) => plan.key === selectedPlanKey) ?? pricingPlans[1]

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    if (!('IntersectionObserver' in window)) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '18% 0px', threshold: 0.05 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="pricing-section" id="pricing" aria-labelledby="pricing-title" ref={sectionRef}>
      <header className="pricing-section__heading">
        <span>08 · Тарифы</span>
        <h2 id="pricing-title">Начните бесплатно.<br />Расширяйте возможности по мере роста.</h2>
        <p>Выберите объём инструментов под текущую практику. Pro остаётся основным тарифом для регулярной работы.</p>
      </header>

      <PricingOrbit
        plans={pricingPlans}
        selectedKey={selectedPlanKey}
        inView={isInView}
        onSelect={setSelectedPlanKey}
      />

      <div className="pricing-plan-switcher" aria-label="Выбор тарифа">
        {pricingPlans.map((plan) => (
          <button
            type="button"
            aria-pressed={selectedPlanKey === plan.key}
            onClick={() => setSelectedPlanKey(plan.key)}
            key={plan.key}
          >
            {plan.name}
          </button>
        ))}
      </div>

      <article className="pricing-details" id="pricing-details" data-selected="true">
        <header className="pricing-details__summary">
          <span>{selectedPlan.name}</span>
          <h3>{selectedPlan.price}</h3>
          <p>{selectedPlan.period}</p>
          <p>{selectedPlan.audience}</p>
          <div>
            <span>Комиссия с продаж</span>
            <strong>{selectedPlan.commission}</strong>
          </div>
        </header>

        <div className="pricing-details__lists">
          <section>
            <h4>Объём</h4>
            <ul>{selectedPlan.limits.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h4>Возможности</h4>
            <ul>{selectedPlan.features.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>

        <a href="https://app.elevenhouse.ai">Выбрать тариф <span aria-hidden="true">↗</span></a>
      </article>

      <p className="pricing-section__note">На «Старте» недоступны расширенные системы расчётов, конструктор продуктов, контент и подписки, видео-консультации, аналитика и отчёты.</p>
    </section>
  )
}
