import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CosmicHero } from './components/CosmicHero'
import { OneClientStory } from './sections/OneClientStory'
import { HeroScrollAdapter } from './scroll/HeroScrollAdapter'
import { getHeroCorridorMetrics } from './scroll/PageScrollCoordinator'

export default function App() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'))
  const [metrics, setMetrics] = useState(() => (
    getHeroCorridorMetrics(window.innerWidth, window.innerHeight, reducedMotion)
  ))
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

  const runwayStyle = {
    '--hero-corridor-height': `${Math.ceil(window.innerHeight + metrics.corridorEnd)}px`,
  } as CSSProperties

  return (
    <>
      <CosmicHero scrollAdapter={scrollAdapter} runwayStyle={runwayStyle} />
      <main className="landing-sections">
        <OneClientStory />
      </main>
    </>
  )
}
