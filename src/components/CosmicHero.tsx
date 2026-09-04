import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { CosmicScene } from '../cosmic/CosmicScene'
import { ProductTilePanel } from './ProductTilePanel'
import { LandingHeader } from './LandingHeader'
import type { HeroScrollAdapter } from '../scroll/HeroScrollAdapter'
import type { HeroHandoffPhase } from '../scroll/heroHandoff'
import {
  HERO_ENTRY_DURATION_MS,
  getHeroEntryPhaseAfterMount,
  getHeroEntryPhaseAfterPageShow,
  getInitialHeroEntryPhase,
  shouldSettleHeroEntry,
  type HeroEntryPhase,
} from '../cosmic/heroEntryMotion'
import {
  HERO_NARRATIVE_STAGES,
  clampHeroProgress,
  getFinaleStageOpacity,
  getLinearStageOffset,
  getProductStageMotion,
  getTunnelMix,
} from '../hero/heroNarrative'
import {
  getHeroTitleLetterDelay,
  shouldRevealHeroTitle,
} from '../hero/heroTitleMotion'

type HeroTitleGlyphsProps = {
  copy: string
}

function HeroTitleGlyphs({ copy }: HeroTitleGlyphsProps) {
  let wordGlyphIndex = -1

  return Array.from(copy).map((glyph, glyphIndex) => {
    if (glyph === ' ') {
      wordGlyphIndex = -1
      return (
        <span
          aria-hidden="true"
          className="hero-title-space"
          key={`${copy}-${glyphIndex}`}
        />
      )
    }

    wordGlyphIndex += 1
    const delay = getHeroTitleLetterDelay(wordGlyphIndex)
    return (
      <span
        aria-hidden="true"
        className="hero-title-letter"
        key={`${copy}-${glyphIndex}`}
      >
        <span
          className="hero-title-letter__inner"
          style={{ '--hero-letter-delay': `${delay}ms` } as CSSProperties}
        >
          {glyph}
        </span>
      </span>
    )
  })
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
  const [entryPhase, setEntryPhase] = useState<HeroEntryPhase>(() => (
    getInitialHeroEntryPhase(reducedMotion, window.scrollY)
  ))
  const [copyProgress, setCopyProgress] = useState(() => (
    reducedMotion ? 0 : clampHeroProgress(scrollAdapter.snapshot.travelProgress)
  ))

  useEffect(() => {
    if (entryPhase !== 'preparing') return

    let firstFrame = 0
    let secondFrame = 0

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setEntryPhase(getHeroEntryPhaseAfterMount(reducedMotion, window.scrollY))
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [entryPhase, reducedMotion])

  useEffect(() => {
    if (entryPhase === 'settled') return

    const startScrollY = window.scrollY
    const settle = () => setEntryPhase('settled')
    const onScroll = () => {
      if (shouldSettleHeroEntry(entryPhase, startScrollY, window.scrollY)) settle()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      setEntryPhase((phase) => getHeroEntryPhaseAfterPageShow(phase, event.persisted))
    }
    const settleTimer = entryPhase === 'entering'
      ? window.setTimeout(settle, HERO_ENTRY_DURATION_MS)
      : 0

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [entryPhase])

  useEffect(() => {
    if (reducedMotion) return

    setCopyProgress(clampHeroProgress(scrollAdapter.snapshot.travelProgress))

    const unsubscribe = scrollAdapter.subscribe((snapshot) => {
      setCopyProgress(clampHeroProgress(snapshot.travelProgress))
    })

    return unsubscribe
  }, [reducedMotion, scrollAdapter])

  const tunnelMix = getTunnelMix(copyProgress)
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
      data-intro={entryPhase}
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
              const titleVisible = shouldRevealHeroTitle(stageOffset, reducedMotion)
                && (index !== 0 || entryPhase !== 'preparing')
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
                    <ProductTilePanel
                      active={reducedMotion || Math.abs(stageOffset) < 0.95}
                      reducedMotion={reducedMotion}
                      screenshot={stage.screenshot!}
                      stageOffset={stageOffset}
                    />
                    <p
                      aria-hidden="true"
                      className="hero-product-scene__title"
                      data-visible={titleVisible}
                      style={{ mixBlendMode: 'difference' }}
                    >
                      <HeroTitleGlyphs copy={stage.title} />
                    </p>
                  </article>
                )
              }

              if (stage.mode === 'finale') {
                const finaleOpacity = getFinaleStageOpacity(stageOffset)
                const finaleInteractive = titleVisible
                  && Math.abs(stageOffset) < 0.12
                  && handoffPhase === 'tunnel'
                return (
                  <article
                    aria-hidden={!stageIsCurrent}
                    className="hero-finale"
                    key={stage.title}
                    style={{ opacity: reducedMotion ? 1 : finaleOpacity }}
                  >
                    <span
                      className="hero-finale__part hero-finale__part--start"
                      data-visible={titleVisible}
                    >
                      <span className="hero-finale__part-inner">
                        Меньше времени на рутину
                      </span>
                    </span>
                    <span
                      className="hero-finale__part hero-finale__part--end"
                      data-visible={titleVisible}
                    >
                      <span className="hero-finale__part-inner">
                        больше<br />
                        на консультацию
                      </span>
                    </span>
                    <div
                      className="hero-finale__action"
                      data-interactive={finaleInteractive}
                      data-visible={titleVisible}
                    >
                      <a
                        href="https://app.elevenhouse.ai"
                        tabIndex={finaleInteractive ? 0 : -1}
                      >
                        Создать кабинет
                      </a>
                      <span>Бесплатно без банковской карты</span>
                    </div>
                  </article>
                )
              }

              const copy = stage.title
              return (
                <p
                  aria-label={copy}
                  aria-hidden={!stageIsCurrent}
                  className="hero-copy__stage"
                  data-visible={titleVisible}
                  key={copy}
                >
                  <HeroTitleGlyphs copy={copy} />
                </p>
              )
            })}
          </div>
        </div>
      </section>
    </section>
  )
}
