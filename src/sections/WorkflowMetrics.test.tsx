// @ts-expect-error Vitest runs in Node, while the app tsconfig intentionally omits Node types.
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { WorkflowMetrics } from './WorkflowMetrics'

const readRaw = (source: Record<string, unknown>) => Object.values(source)[0] as string
const stylesSource = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
const componentSource = readRaw(
  import.meta.glob('./WorkflowMetrics.tsx', { eager: true, query: '?raw', import: 'default' }),
)

const stats = [
  { value: '−12 ч', label: 'рутины в неделю' },
  { value: '×3', label: 'быстрее готов разбор' },
  { value: '+34%', label: 'повторных продаж' },
]

describe('WorkflowMetrics', () => {
  it('renders exactly three accessible metric cells and one reel per numeric digit', () => {
    const html = renderToStaticMarkup(
      <WorkflowMetrics
        note="Медианные показатели активных практиков после двух месяцев на платформе."
        stats={stats}
      />,
    )

    expect(html.match(/<article/g)).toHaveLength(3)
    expect(html.match(/data-workflow-digit=/g)).toHaveLength(5)
    expect(html.match(/workflow-metrics__glyph/g)).toHaveLength(150)
    expect(html).toContain('aria-label="−12 ч — рутины в неделю"')
    expect(html).toContain('aria-label="×3 — быстрее готов разбор"')
    expect(html).toContain('aria-label="+34% — повторных продаж"')
  })

  it('renders the reference frame anatomy around every metric', () => {
    const html = renderToStaticMarkup(<WorkflowMetrics note="Примечание" stats={stats} />)

    expect(html.match(/workflow-metrics__line--top/g)).toHaveLength(3)
    expect(html.match(/workflow-metrics__line--right/g)).toHaveLength(3)
    expect(html.match(/workflow-metrics__line--bottom/g)).toHaveLength(3)
    expect(html.match(/workflow-metrics__point--/g)).toHaveLength(12)
    expect(html).toContain('data-entered="false"')
  })

  it('replays only when the metric grid reaches the visible center band', () => {
    expect(componentSource).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(componentSource).toContain("has('reduced-motion')")
    expect(componentSource).toContain("'IntersectionObserver' in window")
    expect(componentSource).toContain('setEntered(true)')
    expect(componentSource).toContain("rootMargin: '0px 0px 18% 0px'")
    expect(componentSource).toContain('threshold: 0.05')
    expect(componentSource).toContain('window.requestAnimationFrame(() => observer.observe(root))')
    expect(componentSource).toContain('window.cancelAnimationFrame(startFrame)')
    expect(componentSource.match(/observer\.disconnect\(\)/g)).toHaveLength(1)
    expect(componentSource).toMatch(/return \(\) => \{[\s\S]*observer\.disconnect\(\)[\s\S]*\}/)
  })

  it('matches the measured reference timing and remains scoped', () => {
    expect(stylesSource).toContain('.workflow-metrics__roller')
    expect(stylesSource).toMatch(/transition:\s*transform 1\.2s cubic-bezier\(0\.22, 1, 0\.36, 1\)/)
    expect(stylesSource).toContain('transition-delay: var(--workflow-metric-delay)')
    expect(stylesSource).toMatch(/\.workflow-metrics__line--top[\s\S]*transition:\s*transform 0\.8s ease 0\.12s/)
    expect(stylesSource).toMatch(/\.workflow-metrics__line--right[\s\S]*transition:\s*transform 0\.8s ease 0\.35s/)
    expect(stylesSource).toMatch(/\.workflow-metrics__line--bottom[\s\S]*transition:\s*transform 0\.8s ease 0\.58s/)
    expect(stylesSource).toMatch(/\.workflow-metrics__point[\s\S]*width:\s*8px[\s\S]*height:\s*8px/)
    expect(stylesSource).toContain('width: calc(100vw - 48px)')
    expect(stylesSource).toContain('margin-left: calc(50% - 50vw + 24px)')
    expect(stylesSource).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.workflow-metrics__roller/)
  })

  it('continuously redistributes the rail width on fine-pointer hover', () => {
    expect(componentSource).toContain('getWorkflowMetricColumns')
    expect(componentSource).toContain("window.matchMedia('(hover: hover) and (pointer: fine)')")
    expect(componentSource).toContain("window.matchMedia('(max-width: 700px)')")
    expect(componentSource).toContain("grid.addEventListener('pointermove', handlePointerMove")
    expect(componentSource).toContain("grid.addEventListener('pointerleave', handlePointerLeave)")
    expect(componentSource).toContain("grid.addEventListener('pointercancel', handlePointerLeave)")
    expect(componentSource).toContain('window.requestAnimationFrame(renderHoverFrame)')
    expect(componentSource).toContain('window.cancelAnimationFrame(hoverFrame)')
    expect(componentSource).toContain("grid.style.setProperty('--workflow-column-1'")
    expect(componentSource).toContain("grid.style.removeProperty('--workflow-column-1')")
    expect(stylesSource).toMatch(/\.workflow-metrics__grid\s*\{[\s\S]*?--workflow-column-1:\s*33\.333%[\s\S]*?display:\s*flex/)
    expect(stylesSource).toMatch(/\.workflow-metrics__item:nth-child\(1\)[\s\S]*?flex-basis:\s*var\(--workflow-column-1\)/)
    expect(stylesSource).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.workflow-metrics__grid\s*\{[\s\S]*?display:\s*grid/)
  })
})
