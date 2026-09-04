import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { CosmicScene } from '../cosmic/CosmicScene'
import { ProductTilePanel } from './ProductTilePanel'
import { LandingHeader } from './LandingHeader'
import type { HeroScrollAdapter } from '../scroll/HeroScrollAdapter'
import type { HeroHandoffPhase } from '../scroll/heroHandoff'
import { getIntroGlyphDepth, getStageTravelDirection } from '../cosmic/copyMotion'
import {
  HERO_LAST_STAGE_INDEX,
  HERO_LAST_VISUAL_INDEX,
  HERO_NARRATIVE_STAGES,
  clampHeroProgress,
  getFinaleStageOpacity,
  getLinearStageOffset,
  getProductStageMotion,
  getTunnelCtaReveal,
  getTunnelMix,
} from '../hero/heroNarrative'

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
  const depth = getIntroGlyphDepth(stageOffset, stagger)
  const blur = Math.max(spread * (0.25 + stagger * 1.15), depth.blur)
  const scale = (1 - spread * 0.055) * depth.scale

  return {
    opacity,
    filter: `blur(${blur}px)`,
    transform: `translate3d(${driftX * spread}px, ${driftY * spread}px, ${depth.translateZ}px) rotate(${rotation * spread}deg) scale(${scale})`,
  }
}

type CosmicHeroProps = {
  handoffPhase: HeroHandoffPhase
  onEnterStory: () => void
  scrollAdapter: HeroScrollAdapter
  runwayStyle: CSSProperties
}

export function CosmicHero({
  handoffPhase,
  onEnterStory,
  scrollAdapter,
  runwayStyle,
}: CosmicHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'))
  const [copyProgress, setCopyProgress] = useState(() => (
    reducedMotion ? 0 : clampHeroProgress(scrollAdapter.snapshot.travelProgress)
  ))
  const [visualProgress, setVisualProgress] = useState(() => (
    reducedMotion ? HERO_LAST_VISUAL_INDEX : scrollAdapter.snapshot.travelProgress
  ))

  useEffect(() => {
    if (reducedMotion) return

    let progress = scrollAdapter.snapshot.travelProgress
    let renderFrame = 0
    const renderProgress = () => {
      window.cancelAnimationFrame(renderFrame)
      renderFrame = window.requestAnimationFrame(() => {
        setCopyProgress(clampHeroProgress(progress))
        setVisualProgress(progress)
      })
    }
    setCopyProgress(clampHeroProgress(progress))
    setVisualProgress(progress)

    const unsubscribe = scrollAdapter.subscribe((snapshot) => {
      progress = snapshot.travelProgress
      renderProgress()
    })

    return () => {
      unsubscribe()
      window.cancelAnimationFrame(renderFrame)
    }
  }, [reducedMotion, scrollAdapter])

  const tunnelMix = getTunnelMix(copyProgress)
  const ctaReveal = getTunnelCtaReveal(
    reducedMotion ? HERO_LAST_VISUAL_INDEX : visualProgress,
    handoffPhase === 'tunnel',
  )
  const ctaInteractive = ctaReveal >= 0.999 && handoffPhase === 'tunnel'
  const copyStyle = {
    '--hero-progress': copyProgress,
    '--hero-tunnel-mix': tunnelMix,
  } as CSSProperties

  const handleHeaderNavigation = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    event.preventDefault()
    onEnterStory()
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 280)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: CosmicScene | undefined

    try {
      scene = new CosmicScene(canvas, {
        reducedMotion,
        onFallback: () => setFallback(true),
        scrollAdapter,
      })
      scene.start()
    } catch {
      setFallback(true)
    }

    return () => {
      scene?.dispose()
    }
  }, [reducedMotion, scrollAdapter])

  return (
    <section
      className="cosmic-runway"
      data-motion={reducedMotion ? 'reduced' : 'full'}
      style={runwayStyle}
    >
      <section id="top" className={`cosmic-hero${fallback ? ' cosmic-hero--fallback' : ''}`}>
        <LandingHeader onNavigate={handleHeaderNavigation} />
        <canvas ref={canvasRef} className="cosmic-canvas" />
        <div className="hero-copy" aria-live="polite" style={copyStyle}>
          <div className="hero-copy__stages" aria-label="ElevenHouse">
            {HERO_NARRATIVE_STAGES.map((stage, index) => {
              const stageOffset = reducedMotion
                ? 0
                : getLinearStageOffset(copyProgress, index)
              const stageIsCurrent = reducedMotion || Math.abs(stageOffset) < 0.55
              if (stage.mode === 'product') {
                const motion = getProductStageMotion(stageOffset, index > 3)
                const sceneStyle = {
                  '--product-opacity': motion.opacity,
                  '--product-scale': motion.scale,
                  '--product-y': `${motion.translateY}svh`,
                  '--product-rotate-x': `${motion.rotateX}deg`,
                  '--product-rotate-y': `${motion.rotateY}deg`,
                } as CSSProperties

                return (
                  <article
                    aria-label={stage.title}
                    aria-hidden={!stageIsCurrent}
                    className={`hero-product-scene hero-product-scene--${index}`}
                    key={stage.title}
                    style={sceneStyle}
                  >
                    <p aria-hidden="true" className="hero-product-scene__title hero-product-scene__title--back">
                      {stage.title}
                    </p>
                    <ProductTilePanel
                      active={reducedMotion || Math.abs(stageOffset) < 0.95}
                      reducedMotion={reducedMotion}
                      screenshot={stage.screenshot!}
                      stageOffset={stageOffset}
                    />
                    <p aria-hidden="true" className="hero-product-scene__title hero-product-scene__title--front">
                      {stage.title}
                    </p>
                  </article>
                )
              }

              if (stage.mode === 'finale') {
                const finaleOpacity = getFinaleStageOpacity(stageOffset)
                return (
                  <p
                    aria-hidden={!stageIsCurrent}
                    className="hero-finale"
                    key={stage.title}
                    style={{ opacity: reducedMotion ? 1 : finaleOpacity }}
                  >
                    {stage.title}
                  </p>
                )
              }

              const copy = stage.title
              return (
                <p
                  aria-label={copy}
                  aria-hidden={!stageIsCurrent}
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
          <p className="hero-copy__progress" aria-hidden="true">
            {String(Math.min(Math.round(copyProgress) + 1, HERO_LAST_STAGE_INDEX + 1)).padStart(2, '0')}
            <span> / {String(HERO_LAST_STAGE_INDEX + 1).padStart(2, '0')}</span>
          </p>
        </div>
        <div
          aria-hidden={!ctaInteractive}
          className="hero-tunnel-action"
          data-interactive={ctaInteractive}
          style={{ '--hero-cta-reveal': ctaReveal } as CSSProperties}
        >
          <button
            disabled
            type="button"
            tabIndex={-1}
          >
            Создать кабинет бесплатно
          </button>
          <span>Без банковской карты.</span>
        </div>
      </section>
    </section>
  )
}
