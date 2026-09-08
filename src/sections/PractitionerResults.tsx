import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { PractitionerHeading } from './PractitionerHeading'
import {
  REVIEW_WAVE_TICK_COUNT,
  REVIEW_TOUCH_HOLD_MS,
  getPractitionerLayout,
  getPractitionerRailState,
  getPractitionerResultsProgress,
  getPractitionerWaveTickState,
  samplePractitionerScrub,
} from './practitionerResultsMotion'

const practitionerStories = [
  {
    monogram: 'МК',
    name: 'Марина К.',
    speciality: 'Астролог · 7 лет практики',
    result: '+33% клиентов',
    quote: 'Разбор занимал у меня весь вечер. Теперь AI собирает черновик за пару минут по моим же трактовкам, я только довожу его своим тоном.',
  },
  {
    monogram: 'ДЛ',
    name: 'Дарья Л.',
    speciality: 'Нумерология · Матрица судьбы',
    result: '18 продаж на автопилоте',
    quote: 'Уехала в отпуск на две недели, а воронка сама продала разборы: собрала даты рождения, приняла оплаты и выдала материалы.',
  },
  {
    monogram: 'ВМ',
    name: 'Виктор М.',
    speciality: 'Human Design',
    result: '+47% к среднему чеку',
    quote: 'Платёжные ссылки и предоплата сделали запись серьёзнее — клиенты перестали пропадать, а средний чек вырос.',
  },
] as const

const waveTicks = Array.from({ length: REVIEW_WAVE_TICK_COUNT }, (_, index) => index)

export function PractitionerResults() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([])
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reducedMotionRef = useRef(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const clearTouch = () => {
    if (touchTimerRef.current !== null) clearTimeout(touchTimerRef.current)
    touchTimerRef.current = null
  }

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!section || !stage || !track) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let visible = false
    let disposed = false
    let resized = true
    let initialized = false
    let width = window.innerWidth
    let height = window.innerHeight
    let stageHeight = 0
    let sectionHeight = 0
    let railWidth = 0
    let layout = getPractitionerLayout(width)
    let progress = 0
    let from = 0
    let target = 0
    let startedAt = 0
    let lastWave = -1

    const measure = () => {
      width = window.innerWidth
      height = window.innerHeight
      stageHeight = stage.offsetHeight
      sectionHeight = section.offsetHeight
      railWidth = track.scrollWidth
      layout = getPractitionerLayout(width)
      stage.style.setProperty('--reviews-sticky-top', `${width <= 1024 ? height * 0.08 : height - stageHeight}px`)
      tickRefs.current.forEach((tick, index) => {
        if (!tick) return
        tick.style.display = index < layout.tickCount ? 'block' : 'none'
        tick.style.width = `${layout.tickWidth}px`
        tick.style.height = `${layout.tickMaxHeight}px`
      })
      lastWave = -1
      resized = false
    }

    const render = (now: number) => {
      frame = 0
      if (disposed || document.visibilityState === 'hidden') return
      reducedMotionRef.current = media.matches
      if (resized) measure()
      if (media.matches) {
        section.style.setProperty('--reviews-rail-x', '0px')
        section.style.setProperty('--reviews-card-step-y', '0px')
        initialized = false
        return
      }
      if (!visible || stageHeight === 0) return
      const next = getPractitionerResultsProgress(section.getBoundingClientRect().top, sectionHeight, stageHeight, height)
      progress = samplePractitionerScrub(from, target, now - startedAt)
      if (!initialized) {
        from = target = progress = next
        startedAt = now
        initialized = true
      } else if (Math.abs(next - target) > 0.000001) {
        from = progress
        target = next
        startedAt = now
      }
      const rail = getPractitionerRailState(progress, width, height, railWidth, layout.padding)
      section.style.setProperty('--reviews-rail-x', `${rail.x}px`)
      section.style.setProperty('--reviews-card-step-y', `${rail.cardStepY}px`)
      // The ruler responds to scroll immediately; the cards use the delayed scrub.
      if (Math.abs(next - lastWave) > 0.0001 || lastWave < 0) {
        tickRefs.current.forEach((tick, index) => {
          if (!tick || index >= layout.tickCount) return
          const state = getPractitionerWaveTickState(next, index, layout.tickCount, width)
          tick.style.transform = `scaleY(${state.height / layout.tickMaxHeight})`
          tick.style.opacity = String(state.opacity)
        })
        lastWave = next
      }
      if (Math.abs(progress - target) > 0.000001) frame = window.requestAnimationFrame(render)
    }
    const requestRender = () => {
      if (!frame && !disposed) frame = window.requestAnimationFrame(render)
    }
    const onResize = () => { clearTouch(); setHoveredCard(null); resized = true; requestRender() }
    const onScroll = () => { if (visible) requestRender() }
    const resetInteraction = () => {
      clearTouch()
      setHoveredCard(null)
      requestRender()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!visible) {
        window.cancelAnimationFrame(frame)
        frame = 0
        initialized = false
        resetInteraction()
      } else requestRender()
    }, { rootMargin: '200px 0px' })
    observer.observe(section)
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(stage)
    resizeObserver.observe(track)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', resetInteraction)
    media.addEventListener('change', resetInteraction)
    requestRender()
    return () => {
      disposed = true
      clearTouch()
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', resetInteraction)
      media.removeEventListener('change', resetInteraction)
    }
  }, [])

  const focusCard = (index: number) => {
    setHoveredCard(index)
    const card = cardRefs.current[index]
    const section = sectionRef.current
    const track = trackRef.current
    if (!card || !section || !track) return
    if (reducedMotionRef.current) {
      card.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' })
      return
    }
    const width = window.innerWidth
    const layout = getPractitionerLayout(width)
    const rect = card.getBoundingClientRect()
    if (rect.left >= layout.padding && rect.right <= width - layout.padding) return
    const startX = width * (width <= 640 ? 0.11 : 0.233)
    const endX = width - layout.padding * 2 - track.scrollWidth
    const desiredX = (width - layout.cardWidth) / 2 - layout.padding - index * (layout.cardWidth + layout.gap)
    const travel = Math.min(1, Math.max(0, (desiredX - startX) / (endX - startX || 1)))
    const rawProgress = 1 - Math.sqrt(1 - travel)
    const top = window.scrollY + section.getBoundingClientRect().top
    window.scrollTo({ top: top + window.innerHeight * 0.35 + rawProgress * (section.offsetHeight - window.innerHeight * 1.3), behavior: 'auto' })
  }

  return (
    <section className="practitioner-results" ref={sectionRef}
      data-review-focused={hoveredCard !== null ? 'true' : 'false'}
      aria-labelledby="practitioner-results-title">
      <div className="practitioner-results__stage" ref={stageRef}>
        <header className="practitioner-results__heading">
          <PractitionerHeading />
        </header>
        <div className="practitioner-results__wave" aria-hidden="true">
          {waveTicks.map((index) => <span className="practitioner-results__tick" key={index}
            ref={(element) => { tickRefs.current[index] = element }} />)}
        </div>
        <div className="practitioner-results__carousel">
          <div className="practitioner-results__track" ref={trackRef}>
            {practitionerStories.map((story, index) => (
              <article className="practitioner-results__story" key={story.name}
                ref={(element) => { cardRefs.current[index] = element }}
                style={{ '--story-index': index } as CSSProperties}
                tabIndex={0} aria-label={`Отзыв: ${story.name}`}
                data-review-active={hoveredCard === index ? 'true' : 'false'}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse' && window.innerWidth > 1024) setHoveredCard(index)
                }}
                onPointerLeave={(event) => {
                  clearTouch()
                  if (!event.currentTarget.matches(':focus-visible')) setHoveredCard(null)
                }}
                onPointerDown={(event) => {
                  clearTouch()
                  if (event.pointerType === 'touch' && !reducedMotionRef.current) {
                    touchTimerRef.current = setTimeout(() => setHoveredCard(index), REVIEW_TOUCH_HOLD_MS)
                  }
                }}
                onPointerMove={(event) => {
                  if (event.pointerType === 'touch') { clearTouch(); setHoveredCard(null) }
                }}
                onPointerUp={(event) => {
                  clearTouch()
                  if (event.pointerType === 'touch') setHoveredCard(null)
                }}
                onPointerCancel={() => { clearTouch(); setHoveredCard(null) }}
                onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) focusCard(index) }}
                onBlur={() => setHoveredCard(null)}
                onKeyDown={(event) => {
                  const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1
                    : event.key === 'Home' ? 0 : event.key === 'End' ? practitionerStories.length - 1 : null
                  if (next === null) return
                  event.preventDefault()
                  cardRefs.current[Math.min(practitionerStories.length - 1, Math.max(0, next))]?.focus({ preventScroll: true })
                }}>
                <header>
                  <span className="practitioner-results__monogram" aria-hidden="true">{story.monogram}</span>
                  <p><strong>{story.name}</strong><span>{story.speciality}</span><b>{story.result}</b></p>
                </header>
                <blockquote>«{story.quote}»</blockquote>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
