import { useEffect, useRef, useState } from 'react'
import { featureStories } from './featureStories'
import { isStoryReadable, storyFrame } from './featurePlayback'
import { SourceFragment, type FeatureId } from './SourceFragments'
import './featureWalkthrough.css'

export function FeatureWalkthrough({ feature, reducedMotion, onExplore }: { feature: FeatureId; reducedMotion: boolean; onExplore: () => void }) {
  const story = featureStories[feature]
  const [time, setTime] = useState(0)
  const [paused, setPaused] = useState(false)
  const [run, setRun] = useState(0)
  const elapsed = useRef(0)
  const region = useRef<HTMLDivElement>(null)
  const explanation = useRef<HTMLDivElement>(null)
  const frame = storyFrame(story.beats, time)
  const beat = story.beats[frame.index]
  const progress = reducedMotion ? 1 : frame.progress

  useEffect(() => {
    const element = region.current
    if (!element || paused || reducedMotion) return
    const total = story.beats.reduce((sum, item) => sum + item.duration, 0)
    const compact = window.matchMedia('(max-width: 700px)')
    let raf = 0
    let last = 0
    let near = false
    const tick = (now: number) => {
      raf = 0
      if (!near || document.visibilityState !== 'visible' || elapsed.current >= total) return
      const topInset = compact.matches ? Math.max(96, explanation.current?.getBoundingClientRect().bottom ?? 96) : 96
      if (isStoryReadable(element.getBoundingClientRect(), window.innerHeight, topInset)) {
        if (last) {
          elapsed.current = Math.min(total, elapsed.current + Math.min(now - last, 80))
          setTime(elapsed.current)
        }
        last = now
      } else last = 0
      if (elapsed.current < total) raf = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(raf)
      last = 0
      if (near && document.visibilityState === 'visible' && elapsed.current < total) raf = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; resume() }, { threshold: 0 })
    observer.observe(element)
    document.addEventListener('visibilitychange', resume)
    return () => { observer.disconnect(); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', resume) }
  }, [story, paused, reducedMotion, run])

  const seek = (index: number, fraction = 0) => {
    const safe = Math.max(0, Math.min(story.beats.length - 1, index))
    elapsed.current = story.beats.slice(0, safe).reduce((sum, item) => sum + item.duration, 0) + story.beats[safe].duration * fraction
    setTime(elapsed.current)
    setRun((value) => value + 1)
  }
  const next = () => frame.index < story.beats.length - 1 ? seek(frame.index + 1) : seek(frame.index, 1)
  const openTab = (tab: number) => {
    const later = story.beats.findIndex((item, index) => item.tab === tab && index > frame.index)
    const target = later >= 0 ? later : story.beats.findIndex((item) => item.tab === tab)
    if (target >= 0) seek(target)
  }
  const replay = () => { setPaused(false); seek(0) }
  const guide = { id: beat.id, progress, next, finish: () => seek(frame.index, .88) }

  return <div className="eh-walkthrough" data-feature-story={feature} data-story-step={beat.id} data-story-state={frame.done ? 'complete' : paused ? 'paused' : reducedMotion ? 'manual' : 'playing'}>
    <p className="eh-walkthrough__purpose">{story.purpose}</p>
    <div className="eh-walkthrough__body">
      <div className="eh-walkthrough__explanation" ref={explanation}>
        <p className="eh-walkthrough__counter">{String(frame.index + 1).padStart(2, '0')} <span>/ {String(story.beats.length).padStart(2, '0')}</span></p>
        <div className="eh-walkthrough__copy" key={beat.id}>
          <h3>{beat.title}</h3>
          <p>{beat.body}</p>
        </div>
    <div className="eh-walkthrough__playback">
      <div className="eh-walkthrough__track" aria-hidden="true"><span style={{ transform: `scaleX(${reducedMotion ? (frame.index + 1) / story.beats.length : time / frame.total})` }} /></div>
      <div className="eh-walkthrough__controls">
        <button type="button" disabled={frame.index === 0} onClick={() => seek(frame.index - 1)}>← Назад</button>
        {frame.done ? <button type="button" onClick={replay}>Посмотреть ещё раз</button> : !reducedMotion && <button className="eh-walkthrough__toggle" type="button" aria-label={paused ? 'Продолжить анимацию' : 'Приостановить анимацию'} onClick={() => setPaused((value) => !value)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            {paused ? <path d="M8 5v14l11-7z" /> : <><rect x="7" y="5" width="3" height="14" rx="1" /><rect x="14" y="5" width="3" height="14" rx="1" /></>}
          </svg>
        </button>}
        {!frame.done && <button type="button" onClick={next}>{frame.index === story.beats.length - 1 ? 'Завершить' : 'Следующий шаг'} →</button>}
      </div>
    </div>
        <nav className="eh-walkthrough__steps" aria-label="Шаги знакомства">{story.beats.map((item, index) => <button key={item.id} type="button" aria-current={index === frame.index ? 'step' : undefined} onClick={() => seek(index)}><span aria-hidden="true">{index < frame.index ? '✓' : String(index + 1).padStart(2, '0')}</span>{item.label}</button>)}</nav>
      </div>
      <div className="eh-walkthrough__visual" ref={region}>
        <div className="eh-walkthrough__action" role="status"><span aria-hidden="true">{progress >= .82 ? '✓' : '→'}</span>{progress >= .82 ? beat.result : beat.action}</div>
        <div className="eh-walkthrough__stage" key={beat.id}>
          <SourceFragment feature={feature} step={beat.tab} setStep={openTab} guide={guide} />
          {frame.done && <p className="eh-walkthrough__outcome" role="status">{story.outcome}</p>}
        </div>
        <div className="eh-walkthrough__footer">
          <button type="button" className="eh-experience__another" onClick={onExplore}>Посмотреть другую возможность <span aria-hidden="true">↗</span></button>
        </div>
      </div>
    </div>
  </div>
}
