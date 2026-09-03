import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { CosmicHero } from './components/CosmicHero'
import { OneClientStory } from './sections/OneClientStory'
import { HeroScrollAdapter } from './scroll/HeroScrollAdapter'
import { getHeroCorridorMetrics } from './scroll/PageScrollCoordinator'
import {
  beginHeroHandoff,
  completeHeroHandoff,
  getHeroRunwayEnd,
  type HeroHandoffPhase,
} from './scroll/heroHandoff'

export default function App() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'))
  const [metrics, setMetrics] = useState(() => (
    getHeroCorridorMetrics(window.innerWidth, window.innerHeight, reducedMotion)
  ))
  const [handoffPhase, setHandoffPhase] = useState<HeroHandoffPhase>('tunnel')
  const storyRef = useRef<HTMLElement>(null)
  const scrollAdapter = useMemo(() => (
    new HeroScrollAdapter(metrics, window.scrollY)
  ), [])

  useEffect(() => {
    const onScroll = () => scrollAdapter.ingest(window.scrollY)
    const onResize = () => {
      const nextMetrics = getHeroCorridorMetrics(
        window.innerWidth,
        window.innerHeight,
        reducedMotion,
      )
      setMetrics(nextMetrics)
      scrollAdapter.setMetrics(nextMetrics)
      scrollAdapter.ingest(window.scrollY)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [reducedMotion, scrollAdapter])

  useEffect(() => {
    if (handoffPhase !== 'covering') return
    if (reducedMotion) {
      setHandoffPhase(completeHeroHandoff)
      return
    }

    const timer = window.setTimeout(() => {
      setHandoffPhase(completeHeroHandoff)
    }, 200)

    return () => window.clearTimeout(timer)
  }, [handoffPhase, reducedMotion])

  useLayoutEffect(() => {
    if (handoffPhase !== 'story') return
    const story = storyRef.current
    if (!story) return

    const storyTop = story.offsetTop
    window.scrollTo(0, storyTop)
    scrollAdapter.ingest(storyTop)

    const focusFrame = window.requestAnimationFrame(() => {
      story.querySelector<HTMLElement>('#client-story-title')?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [handoffPhase, scrollAdapter])

  const enterStory = useCallback(() => {
    setHandoffPhase(beginHeroHandoff)
  }, [])

  const runwayEnd = getHeroRunwayEnd(metrics, handoffPhase)
  const runwayStyle = {
    '--hero-corridor-height': `${Math.ceil(window.innerHeight + runwayEnd)}px`,
  } as CSSProperties
  const storyEntered = handoffPhase === 'story'

  return (
    <>
      <CosmicHero
        handoffPhase={handoffPhase}
        onEnterStory={enterStory}
        scrollAdapter={scrollAdapter}
        runwayStyle={runwayStyle}
      />
      <div
        aria-hidden="true"
        className="hero-handoff-cover"
        data-motion={reducedMotion ? 'reduced' : 'full'}
        data-phase={handoffPhase}
      />
      <main
        aria-hidden={!storyEntered}
        className="landing-sections"
        data-entered={storyEntered}
        data-motion={reducedMotion ? 'reduced' : 'full'}
        hidden={!storyEntered}
        ref={storyRef}
      >
        <OneClientStory />
      </main>
    </>
  )
}
