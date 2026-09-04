import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PricingSection } from './PricingSection'

describe('PricingSection', () => {
  it('renders the cinematic orbit and defaults stable details to Pro', () => {
    const html = renderToStaticMarkup(<PricingSection />)

    expect(html).toContain('pricing-orbit__reflection--top')
    expect(html).toContain('pricing-orbit__reflection--bottom')
    expect(html).toContain('data-selected="true"')
    expect(html).toContain('Pro')
    expect(html).toContain('Все системы расчётов')
  })

  it('keeps all plans available as explicit controls', () => {
    const html = renderToStaticMarkup(<PricingSection />)

    expect(html.match(/aria-pressed=/g)).toHaveLength(6)
    expect(html).toContain('Подробнее о тарифе Старт')
    expect(html).toContain('Подробнее о тарифе Studio')
  })
})
