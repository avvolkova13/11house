import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CosmicScene } from '../cosmic/CosmicScene'
import {
  easeOutCubic,
  getDirectedSnapTarget,
  getSettleDuration,
  getStageTravelDirection,
  type ScrollDirection,
} from '../cosmic/copyMotion'

const copyStages = ['ElevenHouse', 'Вся ваша практика', 'В одном пространстве']

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const progress = clamp01((value - edge0) / (edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

const randomUnit = (stageIndex: number, glyphIndex: number, fragmentIndex: number, salt: number) => {
  const value = Math.sin(
    stageIndex * 91.73 + glyphIndex * 37.17 + fragmentIndex * 17.41 + salt * 53.29,
  ) * 43758.5453
  return value - Math.floor(value)
}

const getStageOffset = (progress: number, index: number) => {
  let offset = index - progress
  const half = copyStages.length / 2
  if (offset > half) offset -= copyStages.length
  if (offset < -half) offset += copyStages.length
  return offset
}

const getFragmentStyle = (
  stageOffset: number,
  stageIndex: number,
  glyphIndex: number,
  glyphCount: number,
  fragmentIndex: number,
): CSSProperties => {
  const distance = Math.abs(stageOffset)
  const travelDirection = getStageTravelDirection(stageIndex)
  const direction = stageOffset < 0 ? travelDirection : -travelDirection
  const stagger = randomUnit(stageIndex, glyphIndex, fragmentIndex, 1)
  const spread = smoothstep(0.03 + stagger * 0.06, 0.74, distance)
  const isIncoming = stageOffset > 0
  const fadeStart = (isIncoming ? 0.08 : 0.1) + stagger * 0.05
  const fadeEnd = (isIncoming ? 0.41 : 0.48) + stagger * 0.07
  const opacity = 1 - smoothstep(fadeStart, fadeEnd, distance)
  const glyphPosition = glyphCount > 1 ? glyphIndex / (glyphCount - 1) - 0.5 : 0
  const driftX = direction * (90 + randomUnit(stageIndex, glyphIndex, fragmentIndex, 2) * 220)
    + glyphPosition * (45 + randomUnit(stageIndex, glyphIndex, fragmentIndex, 3) * 55)
  const driftY = direction * (10 + randomUnit(stageIndex, glyphIndex, fragmentIndex, 4) * 76)
    + (fragmentIndex - 1) * (24 + randomUnit(stageIndex, glyphIndex, fragmentIndex, 5) * 34)
  const rotation = (randomUnit(stageIndex, glyphIndex, fragmentIndex, 6) - 0.5) * 6

  return {
    opacity,
    filter: `blur(${spread * (0.25 + stagger * 1.15)}px)`,
    transform: `translate3d(${driftX * spread}px, ${driftY * spread}px, 0) rotate(${rotation * spread}deg) scale(${1 - spread * 0.055})`,
  }
}

export function CosmicHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)
  const [copyProgress, setCopyProgress] = useState(0)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'))

  useEffect(() => {
    if (reducedMotion) return

    let lastScrollY = window.scrollY
    let progress = 0
    let renderFrame = 0
    let settleFrame = 0
    let scrollEndTimer = 0
    let initializing = true
    const normalizeProgress = (value: number) => (
      (value % copyStages.length + copyStages.length) % copyStages.length
    )
    const renderProgress = () => {
      window.cancelAnimationFrame(renderFrame)
      renderFrame = window.requestAnimationFrame(() => {
        setCopyProgress(normalizeProgress(progress))
      })
    }
    const settleToHeading = (target: number) => {
      const start = progress
      const distance = Math.abs(target - start)
      if (distance < 0.0001) return

      const startedAt = performance.now()
      const duration = getSettleDuration(distance)
      const tick = (now: number) => {
        const elapsed = (now - startedAt) / duration
        progress = start + (target - start) * easeOutCubic(elapsed)
        setCopyProgress(normalizeProgress(progress))

        if (elapsed < 1) {
          settleFrame = window.requestAnimationFrame(tick)
          return
        }

        progress = normalizeProgress(target)
        setCopyProgress(progress)
        settleFrame = 0
      }

      settleFrame = window.requestAnimationFrame(tick)
    }
    const initializationTimer = window.setTimeout(() => {
      lastScrollY = window.scrollY
      progress = 0
      setCopyProgress(0)
      initializing = false
    }, 420)

    const onScroll = () => {
      const nextScrollY = window.scrollY
      const delta = nextScrollY - lastScrollY
      lastScrollY = nextScrollY
      if (initializing || Math.abs(delta) > 10_000) return

      window.cancelAnimationFrame(settleFrame)
      window.clearTimeout(scrollEndTimer)
      settleFrame = 0

      progress += delta / 760
      const direction: ScrollDirection = delta > 0 ? 1 : -1
      const target = getDirectedSnapTarget(progress, direction)
      renderProgress()
      scrollEndTimer = window.setTimeout(() => settleToHeading(target), 70)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(renderFrame)
      window.cancelAnimationFrame(settleFrame)
      window.clearTimeout(scrollEndTimer)
      window.clearTimeout(initializationTimer)
    }
  }, [reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: CosmicScene | undefined

    try {
      scene = new CosmicScene(canvas, {
        reducedMotion,
        onFallback: () => setFallback(true),
      })
      scene.start()
    } catch {
      setFallback(true)
    }

    return () => {
      scene?.dispose()
    }
  }, [])

  return (
    <section className="cosmic-runway">
      <section className={`cosmic-hero${fallback ? ' cosmic-hero--fallback' : ''}`}>
        <canvas ref={canvasRef} className="cosmic-canvas" />
        <div className="hero-copy" aria-live="polite">
          <div className="hero-copy__stages" aria-label="ElevenHouse">
            {copyStages.map((copy, index) => {
              const stageOffset = reducedMotion
                ? (index === 0 ? 0 : copyStages.length)
                : getStageOffset(copyProgress, index)
              return (
                <p
                  aria-label={copy}
                  className="hero-copy__stage"
                  key={copy}
                >
                  {Array.from(copy).map((glyph, glyphIndex) => (
                    glyph === ' '
                      ? <span aria-hidden="true" className="hero-copy__space" key={`${copy}-${glyphIndex}`} />
                      : (
                        <span aria-hidden="true" className="hero-copy__glyph" key={`${copy}-${glyphIndex}`}>
                          <span className="hero-copy__glyph-measure">{glyph}</span>
                          {[0, 1, 2].map((fragmentIndex) => (
                            <span
                              className={`hero-copy__fragment hero-copy__fragment--${fragmentIndex + 1}`}
                              key={fragmentIndex}
                              style={getFragmentStyle(
                                stageOffset,
                                index,
                                glyphIndex,
                                copy.length,
                                fragmentIndex,
                              )}
                            >
                              {glyph}
                            </span>
                          ))}
                        </span>
                      )
                  ))}
                </p>
              )
            })}
          </div>
          <p className="hero-copy__description">
            Клиенты, записи, продукты, оплаты, воронки и профессиональные инструменты — от натальной карты до Матрицы судьбы.<br />
            ElevenHouse собирает всё, на чём держится работа астролога, в единую систему.
          </p>
        </div>
      </section>
    </section>
  )
}
