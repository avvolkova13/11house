import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { CosmicHero } from '../components/CosmicHero'
import { LandingHeader } from '../components/LandingHeader'
import { PractitionerResults } from '../sections/PractitionerResults'
import { PricingSection } from '../sections/PricingSection'
import { FaqSection } from '../sections/FaqSection'
import { ProductExperience } from './ProductExperience'
import { FinaleFooter } from './FinaleFooter'
import { JourneySceneAdapter } from './JourneySceneAdapter'
import { attachFinaleScrollCompletion } from './finaleScrollCompletion'
import { attachOpeningScrollCompletion } from './openingScrollCompletion'
import { clamp01, sampleFinaleCurtain, sampleJourneyScene, type JourneyLayout } from './journeyMotion'
import './journey.css'

// Keep the section available for a later launch without mounting its animations.
const showPractitionerResults = false

const navigationTargets = {
  '#product-proof-title': '#journey-workspace',
  '#ai-routine-title': '#journey-access',
} as const

export function JourneyLanding() {
  const rootRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLElement>(null)
  const finaleRef = useRef<HTMLElement>(null)
  const scrollAdapter = useMemo(() => new JourneySceneAdapter(), [])
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion')))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reducedMotion) return
    return attachOpeningScrollCompletion(window, document, () => {
      const access = rootRef.current?.querySelector('#journey-access')
      return access ? access.getBoundingClientRect().top + window.scrollY : Infinity
    })
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion) return
    return attachFinaleScrollCompletion(window, document, () => {
      const finale = finaleRef.current
      return finale ? finale.getBoundingClientRect().top + window.scrollY : Infinity
    })
  }, [reducedMotion])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches
      || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion')))
    media.addEventListener('change', update)
    const frame = window.requestAnimationFrame(() => setReady(true))
    return () => { media.removeEventListener('change', update); window.cancelAnimationFrame(frame) }
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    const intro = introRef.current
    const finale = finaleRef.current
    if (!root || !intro || !finale) return
    const openingStage = intro.querySelector<HTMLElement>('.eh-journey__opening-stage')
    const finaleStage = finale.querySelector<HTMLElement>('.eh-journey__finale-stage')
    let frame = 0
    let measureFrame = 0
    let layout: JourneyLayout = { viewport: window.innerHeight, chapterStarts: [], finaleTop: Infinity }
    const pageTop = (element: Element) => element.getBoundingClientRect().top + window.scrollY
    const measure = () => {
      measureFrame = 0
      layout = {
        viewport: window.innerHeight,
        chapterStarts: Array.from(root.querySelectorAll('[data-chapter]')).map(pageTop),
        finaleTop: pageTop(finale),
      }
      scrollAdapter.restore(sampleJourneyScene(window.scrollY, layout))
      update()
    }
    const update = () => {
      const y = window.scrollY
      root.dataset.reading = y > intro.offsetHeight * 0.6 && y < layout.finaleTop ? 'true' : 'false'
      scrollAdapter.setTarget(sampleJourneyScene(y, layout))
      const introProgress = clamp01(y / Math.max(1, intro.offsetHeight - window.innerHeight))
      intro.style.setProperty('--opening-opacity', String(1 - clamp01((introProgress - 0.6) / 0.4)))
      if (openingStage) openingStage.inert = !reducedMotion && introProgress >= 0.99
      const curtain = sampleFinaleCurtain(y, layout.finaleTop, window.innerHeight, reducedMotion)
      root.dataset.finaleCurtain = String(curtain.active)
      root.style.setProperty('--finale-curtain-offset', `${curtain.offset}px`)
      root.style.setProperty('--finale-curtain-hold', `${curtain.hold}px`)
      if (finaleStage) finaleStage.inert = !reducedMotion && layout.finaleTop - y >= window.innerHeight
    }
    const advance = (frameTime: number) => {
      if (document.visibilityState !== 'hidden' && !reducedMotion) scrollAdapter.advance(frameTime)
      frame = window.requestAnimationFrame(advance)
    }
    const scheduleMeasure = () => {
      if (!measureFrame) measureFrame = window.requestAnimationFrame(measure)
    }
    const restore = () => {
      scrollAdapter.restore(sampleJourneyScene(window.scrollY, layout))
      update()
    }
    const resize = new ResizeObserver(scheduleMeasure)
    resize.observe(root)
    root.querySelectorAll('[data-chapter], .eh-journey__commercial').forEach((element) => resize.observe(element))
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', scheduleMeasure, { passive: true })
    window.addEventListener('pageshow', restore)
    document.addEventListener('visibilitychange', restore)
    measure()
    if (!reducedMotion) frame = window.requestAnimationFrame(advance)
    return () => {
      resize.disconnect()
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(measureFrame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', scheduleMeasure)
      window.removeEventListener('pageshow', restore)
      document.removeEventListener('visibilitychange', restore)
    }
  }, [reducedMotion, scrollAdapter])

  const openSection = (target: string) => {
    const destination = document.querySelector<HTMLElement>(target)
    destination?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
    if (destination) {
      destination.tabIndex = -1
      destination.focus({ preventScroll: true })
    }
  }
  const navigate = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    event.preventDefault()
    openSection(target)
  }

  return (
    <div className="eh-journey" ref={rootRef} data-motion={reducedMotion ? 'reduced' : 'full'} data-ready={ready}>
      <CosmicHero key={reducedMotion ? 'reduced' : 'full'} backgroundOnly handoffPhase="tunnel" onEnterStory={() => {}} scrollAdapter={scrollAdapter} runwayStyle={{}} />
      <LandingHeader onNavigate={navigate} destinations={navigationTargets} />
      <a className="eh-journey__skip" href="#journey-access">Перейти к знакомству с приложением</a>
      <main className="eh-journey__story">
        <section id="top" tabIndex={-1} className="eh-journey__opening" ref={introRef} aria-labelledby="journey-title">
          <div className="eh-journey__opening-stage">
            <h1 id="journey-title" className="eh-journey__split-title">
              <span className="eh-journey__split-start"><span>Вся практика<br />астролога</span></span>
              <span className="eh-journey__split-end"><span>в одном<br />приложении</span></span>
            </h1>
            <a className="eh-journey__start" href="#journey-access" onClick={(event) => navigate(event, '#journey-access')}>
              Начать <span aria-hidden="true">↓</span>
            </a>
            <a className="eh-journey__explore" href="#journey-access"><span>От первого входа —<br />до вашей целой практики</span><span aria-hidden="true">↓</span></a>
          </div>
        </section>
        <ProductExperience reducedMotion={reducedMotion} onNavigate={openSection} />
        <div id="journey-commercial" tabIndex={-1} className="landing-sections eh-journey__commercial" data-entered="true" data-motion={reducedMotion ? 'reduced' : 'full'}>
          {showPractitionerResults && <PractitionerResults />}
          <PricingSection />
          <FaqSection />
        </div>
        <section className="eh-journey__finale" id="journey-finale" tabIndex={-1} ref={finaleRef} aria-labelledby="journey-finale-title">
          <div className="eh-journey__finale-stage">
            <h2 id="journey-finale-title" className="eh-journey__split-title">
              <span className="eh-journey__split-start"><span>Меньше времени<br />на рутину</span></span>
              <span className="eh-journey__split-end"><span>больше<br />на консультацию</span></span>
            </h2>
            <div className="eh-journey__finale-action">
              <a href="https://app.elevenhouse.ai">Создать кабинет</a>
              <p>Бесплатно без банковской карты</p>
            </div>
            <FinaleFooter />
          </div>
        </section>
      </main>
    </div>
  )
}
