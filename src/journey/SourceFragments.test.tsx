import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AccessFragment } from './AccessFragment'
import { featureChoices, SourceFragment } from './SourceFragments'

describe('source interface fragments', () => {
  it('starts with exactly the two empty contact fields', () => {
    const html = renderToStaticMarkup(<AccessFragment reducedMotion={false} onEnter={() => {}} />)
    expect(html.match(/<input/g)).toHaveLength(2)
    expect(html.match(/value=""/g)).toHaveLength(2)
    expect(html).toContain('Ваше имя')
    expect(html).toContain('Электронная почта')
    expect(html).toContain('Получить код для входа')
    expect(html).not.toMatch(/<aside|<iframe|<img|демонстра|демо/i)
  })
  it('renders each chosen fragment without an app shell or placeholder labels', () => {
    for (const feature of featureChoices) for (let step = 0; step < feature.tabs.length; step++) {
      const html = renderToStaticMarkup(<SourceFragment feature={feature.id} step={step} setStep={() => {}} />)
      expect(html, `${feature.id}/${step}`).toContain(`data-source-feature="${feature.id}"`)
      expect(html).not.toMatch(/демонстра|\bдемо\b|\bdemo\b|<aside|<iframe|<img|<form[^>]+action=/i)
      expect(html).not.toContain('undefined')
      expect(html).not.toContain('NaN')
    }
  })
  it('keeps source SVG charts responsive and labelled', () => {
    for (const step of [0, 2, 3]) {
      const html = renderToStaticMarkup(<SourceFragment feature="reading" step={step} setStep={() => {}} />)
      expect(html).toContain('role="img"')
      expect(html).toContain('viewBox=')
      expect(html).toContain('aria-label=')
    }
  })
})
