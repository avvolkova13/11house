import { useEffect, useRef, useState } from 'react'
import { accessFrame, ACCESS_DURATION, isAccessReadable } from './accessSequence'
import { Icon } from './SourceIcons'

// app/landing.jsx → Register: only the name/email and verification fragments.
// The original .label, .input and .btn rules live in sourceFragments.css.
export function AccessFragment({ reducedMotion, onEnter }: { reducedMotion: boolean; onEnter: () => void }) {
  const region = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const enter = useRef(onEnter)
  enter.current = onEnter
  const [time, setTime] = useState(0)
  const [paused, setPaused] = useState(false)
  const [run, setRun] = useState(0)
  const frame = accessFrame(time)

  useEffect(() => {
    const element = region.current
    if (!element || reducedMotion || paused || elapsed.current >= ACCESS_DURATION) return
    let near = false
    let raf = 0
    let previous = 0
    const tick = (now: number) => {
      raf = 0
      if (!near || document.visibilityState !== 'visible' || elapsed.current >= ACCESS_DURATION) return
      const rect = element.getBoundingClientRect()
      const visible = isAccessReadable(rect, window.innerHeight)
      if (visible && document.visibilityState === 'visible') {
        if (previous) elapsed.current = Math.min(ACCESS_DURATION, elapsed.current + Math.min(now - previous, 60))
        setTime(elapsed.current)
        previous = now
        if (elapsed.current >= ACCESS_DURATION) {
          enter.current()
          return
        }
      } else previous = 0
      raf = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(raf)
      raf = 0
      previous = 0
      if (near && document.visibilityState === 'visible' && elapsed.current < ACCESS_DURATION) raf = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting
      resume()
    }, { threshold: 0 })
    observer.observe(element)
    document.addEventListener('visibilitychange', resume)
    return () => { observer.disconnect(); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', resume) }
  }, [paused, reducedMotion, run])

  const advance = () => {
    if (frame.screen === 'complete') { onEnter(); return }
    // Buttons remain usable with reduced motion or while playback is paused.
    const next = frame.screen === 'details' ? (time < 4700 ? 4700 : 5100) : (time < 7200 ? 7200 : ACCESS_DURATION)
    elapsed.current = next
    setTime(next)
    if (next === ACCESS_DURATION) onEnter()
  }
  const replay = () => { elapsed.current = 0; setTime(0); setPaused(false); setRun((value) => value + 1) }

  return <div className="eh-access" ref={region}>
    <div className="eh-source eh-access__form" data-access-screen={frame.screen}>
      {frame.screen === 'details' ? <>
        <label className="label" htmlFor="entry-name">Ваше имя</label>
        <input id="entry-name" className="input" value={frame.name} readOnly autoComplete="off" placeholder="Например, Алиса" data-typing={frame.focus === 'name'} />
        <label className="label" htmlFor="entry-email">Электронная почта</label>
        <input id="entry-email" className="input" value={frame.email} readOnly autoComplete="off" placeholder="you@example.com" data-typing={frame.focus === 'email'} />
        <button type="button" className="btn btn-primary" disabled={time < 4700} data-pressing={frame.pressing} onClick={advance}>Получить код для входа <Icon.chevR size={17} /></button>
      </> : frame.screen === 'code' ? <>
        <div className="eh-access__sent"><Icon.check size={16} /><span>Код отправлен на<br /><strong>{frame.email}</strong></span></div>
        <label className="label" htmlFor="entry-code">Код из письма</label>
        <input id="entry-code" className="input mono eh-access__code" value={frame.code} readOnly inputMode="numeric" placeholder="• • • •" data-typing={frame.focus === 'code'} />
        <button type="button" className="btn btn-primary" disabled={time < 7200} data-pressing={frame.pressing} onClick={advance}>Войти в кабинет <Icon.chevR size={17} /></button>
      </> : <div className="eh-access__welcome">
        <span className="eh-access__check"><Icon.check size={28} /></span>
        <h3>Добро пожаловать, Алиса</h3>
        <button type="button" className="btn btn-primary" onClick={onEnter}>Открыть возможности <Icon.chevR size={17} /></button>
      </div>}
    </div>
    <div className="eh-access__controls">
      {reducedMotion && time < ACCESS_DURATION && <button type="button" onClick={advance}>Продолжить</button>}
      {!reducedMotion && time < ACCESS_DURATION && <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? 'Продолжить' : 'Пауза'}</button>}
      <button type="button" onClick={replay}>Сначала</button>
      <button type="button" onClick={onEnter}>К возможностям <span aria-hidden="true">↓</span></button>
    </div>
  </div>
}
