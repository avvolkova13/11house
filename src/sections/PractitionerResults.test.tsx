import { describe, expect, it } from 'vitest'

const source = Object.values(import.meta.glob('./PractitionerResults.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}))[0] as string

describe('PractitionerResults', () => {
  it('keeps exactly three semantic practitioner stories', () => {
    expect(source.match(/<article/g)).toHaveLength(1)
    expect(source).toContain('practitionerStories.map')
    expect(source.match(/monogram:/g)).toHaveLength(3)
    expect(source).toContain('<blockquote>')
  })

  it('uses the approved two-line results heading', () => {
    expect(source).toContain('Реальные результаты')
    expect(source).toContain('практиков.')
    expect(source).toContain('id="practitioner-results-title"')
  })

  it('builds the 250-tick decorative progress ruler from the shared constant', () => {
    expect(source).toContain('REVIEW_WAVE_TICK_COUNT')
    expect(source).toContain('Array.from({ length: REVIEW_WAVE_TICK_COUNT }')
    expect(source).toContain('aria-hidden="true"')
  })

  it('coordinates scroll motion through one animation frame and cleans it up', () => {
    expect(source).toContain('requestAnimationFrame')
    expect(source).toContain('cancelAnimationFrame')
    expect(source).toContain("addEventListener('scroll'")
    expect(source).toContain("removeEventListener('scroll'")
    expect(source).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(source).not.toContain('setInterval')
  })

  it('supports pointer drag by scrolling the same runway', () => {
    expect(source).toContain('onPointerDown')
    expect(source).toContain('onPointerMove')
    expect(source).toContain('onPointerUp')
    expect(source).toContain('setPointerCapture')
    expect(source).toContain('window.scrollTo')
  })

})
