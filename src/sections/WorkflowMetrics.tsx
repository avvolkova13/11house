import { useEffect, useRef, useState, type CSSProperties } from 'react'

import {
  buildWorkflowReel,
  getWorkflowMetricColumns,
  parseWorkflowMetric,
} from './workflowMetricModel'

type WorkflowMetricStat = {
  value: string
  label: string
}

type WorkflowMetricsProps = {
  stats: readonly WorkflowMetricStat[]
  note: string
}

type ReelStyle = CSSProperties & {
  '--workflow-metric-delay': string
  '--workflow-metric-stop': string
}

const FRAME_POINTS = ['tl', 'tr', 'bl', 'br'] as const

export function WorkflowMetrics({ stats, note }: WorkflowMetricsProps) {
  const rootRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'))
    if (reducedMotion || !('IntersectionObserver' in window)) {
      setEntered(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setEntered(true)
        observer.unobserve(root)
      },
      {
        // Start the reel just before the metrics reach the viewport so the
        // numbers are already animating while the user arrives at the block.
        rootMargin: '0px 0px 18% 0px',
        threshold: 0.05,
      },
    )

    setEntered(false)
    const startFrame = window.requestAnimationFrame(() => observer.observe(root))
    return () => {
      window.cancelAnimationFrame(startFrame)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const narrowLayout = window.matchMedia('(max-width: 700px)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || narrowLayout.matches || reducedMotion.matches) return

    let targetPosition = 0
    let currentPosition = 0
    let previousTime = performance.now()
    let hoverFrame = 0

    const applyColumns = (position: number) => {
      const columns = getWorkflowMetricColumns(position)
      grid.style.setProperty('--workflow-column-1', `${columns[0]}%`)
      grid.style.setProperty('--workflow-column-2', `${columns[1]}%`)
      grid.style.setProperty('--workflow-column-3', `${columns[2]}%`)
    }

    const renderHoverFrame = (time: number) => {
      hoverFrame = 0
      const elapsed = Math.min(Math.max(time - previousTime, 0), 32)
      const response = 1 - Math.exp(-elapsed / 68)
      currentPosition += (targetPosition - currentPosition) * response

      if (Math.abs(targetPosition - currentPosition) < 0.001) {
        currentPosition = targetPosition
      }

      applyColumns(currentPosition)
      previousTime = time

      if (currentPosition !== targetPosition) {
        hoverFrame = window.requestAnimationFrame(renderHoverFrame)
      }
    }

    const requestHoverFrame = () => {
      if (hoverFrame) return
      previousTime = performance.now()
      hoverFrame = window.requestAnimationFrame(renderHoverFrame)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = grid.getBoundingClientRect()
      const progress = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0.5
      targetPosition = Math.max(-1, Math.min(1, progress * 2 - 1))
      requestHoverFrame()
    }

    const handlePointerLeave = () => {
      targetPosition = 0
      requestHoverFrame()
    }

    grid.addEventListener('pointermove', handlePointerMove, { passive: true })
    grid.addEventListener('pointerleave', handlePointerLeave)
    grid.addEventListener('pointercancel', handlePointerLeave)

    return () => {
      grid.removeEventListener('pointermove', handlePointerMove)
      grid.removeEventListener('pointerleave', handlePointerLeave)
      grid.removeEventListener('pointercancel', handlePointerLeave)
      window.cancelAnimationFrame(hoverFrame)
      grid.style.removeProperty('--workflow-column-1')
      grid.style.removeProperty('--workflow-column-2')
      grid.style.removeProperty('--workflow-column-3')
    }
  }, [])

  let reelIndex = 0

  return (
    <section
      aria-label="Результаты автоматизации практики"
      className="workflow-metrics"
      data-entered={entered}
      ref={rootRef}
    >
      <div className="workflow-metrics__grid" ref={gridRef}>
        {stats.map((stat) => {
          const parts = parseWorkflowMetric(stat.value)

          return (
            <article
              aria-label={`${stat.value} — ${stat.label}`}
              className="workflow-metrics__item"
              key={stat.label}
            >
              <span aria-hidden="true" className="workflow-metrics__frame">
                <span className="workflow-metrics__line workflow-metrics__line--top" />
                <span className="workflow-metrics__line workflow-metrics__line--right" />
                <span className="workflow-metrics__line workflow-metrics__line--bottom" />
                {FRAME_POINTS.map((point) => (
                  <span
                    className={`workflow-metrics__point workflow-metrics__point--${point}`}
                    key={point}
                  />
                ))}
              </span>

              <span aria-hidden="true" className="workflow-metrics__value-row">
                {parts.prefix && (
                  <span className="workflow-metrics__prefix">{parts.prefix}</span>
                )}
                <span className="workflow-metrics__number">
                  {parts.digits.map((digit, digitIndex) => {
                    const reel = buildWorkflowReel(digit)
                    const index = reelIndex++
                    const style: ReelStyle = {
                      '--workflow-metric-delay': `${200 + index * 50}ms`,
                      '--workflow-metric-stop': reel.stopEm,
                    }

                    return (
                      <span
                        className="workflow-metrics__mask"
                        data-workflow-digit={digit}
                        key={`${stat.label}-${digitIndex}`}
                      >
                        <span className="workflow-metrics__roller" style={style}>
                          {reel.digits.map((glyph, glyphIndex) => (
                            <span className="workflow-metrics__glyph" key={glyphIndex}>
                              {glyph}
                            </span>
                          ))}
                        </span>
                      </span>
                    )
                  })}
                </span>
                {parts.suffix && (
                  <span className="workflow-metrics__suffix">{parts.suffix}</span>
                )}
              </span>

              <p>{stat.label}</p>
            </article>
          )
        })}
      </div>

      <p className="workflow-metrics__note">{note}</p>
    </section>
  )
}
