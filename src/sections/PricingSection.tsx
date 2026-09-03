import { pricingPlans } from './pricingData'

export function PricingSection() {
  return (
    <section className="pricing-section" id="pricing" aria-labelledby="pricing-title">
      <header className="pricing-section__heading">
        <span>07 · Тарифы</span>
        <h2 id="pricing-title">Начать бесплатно.<br />Расти без потолка.</h2>
        <p>Один и тот же кабинет на каждом этапе практики. Меняются лимиты, инструменты и комиссия с продаж.</p>
      </header>

      <div className="pricing-section__plans">
        {pricingPlans.map((plan, index) => (
          <article className="pricing-plan" data-featured={plan.key === 'pro' ? 'true' : 'false'} key={plan.key}>
            <header>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{plan.name}</h3>
              <p>{plan.audience}</p>
            </header>
            <div className="pricing-plan__price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
            <div className="pricing-plan__commission"><span>Комиссия с продаж</span><strong>{plan.commission}</strong></div>
            <section>
              <h4>Объём</h4>
              <ul>{plan.limits.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section>
              <h4>Возможности</h4>
              <ul>{plan.features.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <a href="https://app.elevenhouse.ai">Начать бесплатно <span aria-hidden="true">↗</span></a>
          </article>
        ))}
      </div>

      <p className="pricing-section__note">На «Старте» недоступны расширенные системы расчётов, конструктор продуктов, контент и подписки, видео-консультации, аналитика и отчёты.</p>
    </section>
  )
}
