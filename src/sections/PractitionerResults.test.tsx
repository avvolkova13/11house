import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PractitionerResults } from './PractitionerResults'

const source = Object.values(import.meta.glob('./PractitionerResults.tsx', {
  query: '?raw', import: 'default', eager: true,
}))[0] as string
const html = renderToStaticMarkup(createElement(PractitionerResults))

describe('PractitionerResults', () => {
  it('preserves the three original stories as semantic keyboard-reachable articles', () => {
    expect(html.match(/<article/g)).toHaveLength(3)
    expect(html.match(/<blockquote>/g)).toHaveLength(3)
    expect(html.match(/tabindex="0"/g)).toHaveLength(3)
    for (const name of ['Марина К.', 'Дарья Л.', 'Виктор М.']) {
      expect(html).toContain(`aria-label="Отзыв: ${name}"`)
    }
  })

  it('retains readable heading text beneath the decorative pixel canvas', () => {
    expect(html).toContain('id="practitioner-results-title"')
    expect(html).toContain('Реальные')
    expect(html).toContain('результаты')
    expect(html).toContain('практиков')
    expect(html).toContain('class="practitioner-results__heading-canvas" aria-hidden="true"')
    expect(html.match(/data-review-word=/g)).toHaveLength(3)
  })

  it('keeps the wave decorative and leaves its responsive density to the measured layout', () => {
    expect(html).toContain('class="practitioner-results__wave" aria-hidden="true"')
    expect(html.match(/class="practitioner-results__tick"/g)).toHaveLength(250)
    expect(source).toContain('layout.tickCount')
  })

  it('owns the scrub, touch delay, visibility and resize cleanup', () => {
    expect(source).toContain('cancelAnimationFrame')
    expect(source).toContain("removeEventListener('scroll'")
    expect(source).toContain('resizeObserver.disconnect()')
    expect(source).toContain('observer.disconnect()')
    expect(source).toContain('clearTouch()')
    expect(source).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(source).not.toContain('setInterval')
  })

  it('does not intercept pointer dragging to move the document', () => {
    expect(source).not.toContain('setPointerCapture')
    expect(source).not.toContain('inertiaFrame')
    expect(source).toContain("event.pointerType === 'touch'")
    expect(source).toContain('REVIEW_TOUCH_HOLD_MS')
    expect(source).toContain("matches(':focus-visible')")
  })
})
