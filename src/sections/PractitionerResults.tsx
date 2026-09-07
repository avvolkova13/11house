import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
} from 'react'

import {
  REVIEW_WAVE_TICK_COUNT,
  getPractitionerEntranceState,
  getPractitionerRailState,
  getPractitionerResultsProgress,
  getPractitionerWaveTickState,
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

type DragState = {
  active: boolean
  pointerId: number
  startX: number
  startScrollY: number
  lastX: number
  lastTime: number
  velocity: number
}

const initialDragState: DragState = {
  active: false,
  pointerId: -1,
  startX: 0,
  startScrollY: 0,
  lastX: 0,
  lastTime: 0,
  velocity: 0,
}

export function PractitionerResults() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const inertiaFrameRef = useRef<number | null>(null)
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([])
  const dragRef = useRef<DragState>({ ...initialDragState })
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const render = () => {
      frameRef.current = null

      const section = sectionRef.current
      const stage = stageRef.current
      const track = trackRef.current

      if (!section || !stage || !track) return

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const isCompact = viewportWidth <= 760
      reducedMotionRef.current = reducedMotion.matches

      if (isCompact || reducedMotion.matches) {
        section.style.removeProperty('--reviews-rail-x')
        section.style.removeProperty('--reviews-card-step-y')
        section.style.removeProperty('--reviews-enter-opacity')
        section.style.removeProperty('--reviews-enter-y')
        section.style.removeProperty('--reviews-enter-blur')
        section.style.removeProperty('--reviews-enter-rotate')
        return
      }

      const sectionRect = section.getBoundingClientRect()
      const stageRect = stage.getBoundingClientRect()
      const progress = getPractitionerResultsProgress(
        sectionRect.top,
        sectionRect.height,
        stageRect.height,
        viewportHeight,
      )
      const rail = getPractitionerRailState(
        progress,
        viewportWidth,
        viewportHeight,
        track.scrollWidth,
        viewportWidth * 0.055,
      )
      const entrance = getPractitionerEntranceState(sectionRect.top, viewportHeight)

      section.style.setProperty('--reviews-rail-x', `${rail.x}px`)
      section.style.setProperty('--reviews-card-step-y', `${rail.cardStepY}px`)
      section.style.setProperty('--reviews-enter-opacity', String(entrance.opacity))
      section.style.setProperty('--reviews-enter-y', `${entrance.y}px`)
      section.style.setProperty('--reviews-enter-blur', `${entrance.blur}px`)
      section.style.setProperty('--reviews-enter-rotate', `${entrance.rotate}deg`)

      tickRefs.current.forEach((tick, index) => {
        if (!tick) return
        const tickState = getPractitionerWaveTickState(progress, index)
        tick.style.height = `${tickState.height}px`
        tick.style.opacity = String(tickState.opacity)
      })
    }

    const requestRender = () => {
      if (typeof window.requestAnimationFrame !== 'function') {
        render()
        return
      }
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(render)
    }

    render()
    window.addEventListener('scroll', requestRender, { passive: true })
    window.addEventListener('resize', requestRender)
    reducedMotion.addEventListener('change', requestRender)
    requestRender()

    return () => {
      window.removeEventListener('scroll', requestRender)
      window.removeEventListener('resize', requestRender)
      reducedMotion.removeEventListener('change', requestRender)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      if (inertiaFrameRef.current !== null) window.cancelAnimationFrame(inertiaFrameRef.current)
    }
  }, [])

  const stopInertia = () => {
    if (inertiaFrameRef.current === null) return
    window.cancelAnimationFrame(inertiaFrameRef.current)
    inertiaFrameRef.current = null
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || window.innerWidth <= 760 || reducedMotionRef.current) return

    stopInertia()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.dataset.dragging = 'true'
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollY: window.scrollY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return

    const now = performance.now()
    const elapsed = Math.max(8, now - drag.lastTime)
    const deltaX = event.clientX - drag.startX
    const frameDeltaX = event.clientX - drag.lastX

    drag.velocity = -(frameDeltaX * 2.8) / elapsed
    drag.lastX = event.clientX
    drag.lastTime = now
    window.scrollTo({ top: drag.startScrollY - (deltaX * 2.8), behavior: 'auto' })
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return

    drag.active = false
    event.currentTarget.dataset.dragging = 'false'
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    let velocity = drag.velocity
    let previousTime = performance.now()

    const coast = (time: number) => {
      const elapsed = Math.min(32, time - previousTime)
      previousTime = time
      velocity *= 0.92 ** (elapsed / 16.67)

      if (Math.abs(velocity) < 0.025) {
        inertiaFrameRef.current = null
        return
      }

      window.scrollTo({ top: window.scrollY + (velocity * elapsed), behavior: 'auto' })
      inertiaFrameRef.current = window.requestAnimationFrame(coast)
    }

    if (Math.abs(velocity) >= 0.025) {
      inertiaFrameRef.current = window.requestAnimationFrame(coast)
    }
  }

  return (
    <section
      className="practitioner-results"
      ref={sectionRef}
      aria-labelledby="practitioner-results-title"
    >
      <div className="practitioner-results__stage" ref={stageRef}>
        <header className="practitioner-results__heading">
          <h2 id="practitioner-results-title">
            <span><span>Реальные результаты</span></span>
            <span><span>практиков.</span></span>
          </h2>
          <a href="#practitioner-results-title">Все отзывы</a>
        </header>

        <div className="practitioner-results__wave" aria-hidden="true">
          {waveTicks.map((index) => (
            <span
              className="practitioner-results__tick"
              key={index}
              ref={(element) => { tickRefs.current[index] = element }}
            />
          ))}
        </div>

        <div
          className="practitioner-results__carousel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="practitioner-results__track" ref={trackRef}>
            {practitionerStories.map((story, index) => (
              <article
                className="practitioner-results__story"
                key={story.name}
                style={{ '--story-index': index } as CSSProperties}
              >
                <header>
                  <span className="practitioner-results__monogram" aria-hidden="true">
                    {story.monogram}
                  </span>
                  <p>
                    <strong>{story.name}</strong>
                    <span>{story.speciality}</span>
                    <b>{story.result}</b>
                  </p>
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
