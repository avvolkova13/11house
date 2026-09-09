import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attachOpeningScrollCompletion } from './openingScrollCompletion'

function setup() {
  const view = Object.assign(new EventTarget(), { scrollY: 0, scrollTo: vi.fn() })
  const page = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const stop = attachOpeningScrollCompletion(view as unknown as Window, page as unknown as Document, () => 1440)
  const scroll = (y: number) => { view.scrollY = y; view.dispatchEvent(new Event('scroll')) }
  return { view, page, stop, scroll }
}

describe('opening transition completion', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('finishes a partial downward gesture at the access form', () => {
    const { view, scroll, stop } = setup()
    scroll(518)
    vi.advanceTimersByTime(1000)
    expect(view.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 1440, behavior: 'smooth' })
    stop()
  })

  it('waits until scrolling and trackpad inertia stop', () => {
    const { view, scroll, stop } = setup()
    for (const y of [100, 200, 300]) { scroll(y); vi.advanceTimersByTime(100) }
    expect(view.scrollTo).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(view.scrollTo).toHaveBeenCalledTimes(1)
    stop()
  })

  it('returns to the first screen when the gesture reverses', () => {
    const { view, scroll, stop } = setup()
    scroll(900)
    scroll(500)
    vi.advanceTimersByTime(1000)
    expect(view.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: 'smooth' })
    stop()
  })

  it('leaves the endpoints and all reading sections freely scrollable', () => {
    const { view, scroll, stop } = setup()
    for (const y of [0, 2, 1440, 1441, 2000, 5000]) { scroll(y); vi.advanceTimersByTime(1000) }
    expect(view.scrollTo).not.toHaveBeenCalled()
    stop()
  })

  it('does not pull the page while a finger or scrollbar is held', () => {
    const { view, scroll, stop } = setup()
    view.dispatchEvent(new Event('pointerdown'))
    scroll(518)
    vi.advanceTimersByTime(1000)
    expect(view.scrollTo).not.toHaveBeenCalled()
    view.dispatchEvent(new Event('pointerup'))
    vi.advanceTimersByTime(1000)
    expect(view.scrollTo).toHaveBeenCalledTimes(1)
    stop()
  })

  it('cancels pending work on cleanup and while hidden', () => {
    const { view, page, scroll, stop } = setup()
    scroll(518)
    page.visibilityState = 'hidden'
    page.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(1000)
    expect(view.scrollTo).not.toHaveBeenCalled()
    page.visibilityState = 'visible'
    page.dispatchEvent(new Event('visibilitychange'))
    stop()
    scroll(600)
    vi.advanceTimersByTime(1000)
    expect(view.scrollTo).not.toHaveBeenCalled()
  })
})
