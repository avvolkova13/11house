import { describe, expect, it, vi } from 'vitest'
import { attachFinaleScrollCompletion } from './finaleScrollCompletion'

function setup(finaleTop = 12000) {
  let id = 0
  const frames = new Map<number, FrameRequestCallback>()
  const view = Object.assign(new EventTarget(), {
    scrollY: 0, innerHeight: 800,
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++id, callback); return id },
    cancelAnimationFrame: (handle: number) => { frames.delete(handle) },
    scrollTo: vi.fn((options: ScrollToOptions) => { view.scrollY = options.top ?? 0; view.dispatchEvent(new Event('scroll')) }),
  })
  const page = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const stop = attachFinaleScrollCompletion(view as unknown as Window, page as unknown as Document, () => finaleTop)
  const wheel = (deltaY: number) => {
    const event = Object.assign(new Event('wheel', { cancelable: true }), { deltaY, ctrlKey: false })
    view.dispatchEvent(event)
    return event
  }
  const scroll = (y: number) => { view.scrollY = y; view.dispatchEvent(new Event('scroll')) }
  const tick = (now: number) => {
    const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now))
  }
  return { view, page, frames, stop, wheel, scroll, tick }
}

describe('intentional finale reveal', () => {
  it('takes a small gesture to a complete reveal with eased motion, without more input', () => {
    const s = setup()
    s.wheel(30); s.scroll(11230)
    expect(s.frames.size).toBe(1)
    s.tick(0); s.tick(250)
    expect(s.view.scrollY).toBeGreaterThan(11230)
    expect(s.view.scrollY).toBeLessThan(11400)
    s.tick(1000)
    expect(s.view.scrollY).toBe(12000)
    expect(s.frames.size).toBe(0)
    s.stop()
  })
  it('crosses fractional boundaries so the curtain and header settle fully', () => {
    const s = setup(12000.375)
    s.wheel(30); s.scroll(11230); s.tick(0); s.tick(1000)
    expect(s.view.scrollY).toBe(12001)
    s.wheel(-30); s.scroll(11900); s.tick(1100); s.tick(2100)
    expect(s.view.scrollY).toBe(11200)
    s.stop()
  })
  it('leaves ordinary reading and programmatic navigation alone', () => {
    const s = setup()
    s.scroll(11600)
    expect(s.frames.size).toBe(0)
    s.wheel(30)
    for (const y of [0, 5000, 11210, 12000, 14000]) s.scroll(y)
    expect(s.frames.size).toBe(0)
    s.stop()
  })
  it('absorbs forward inertia but allows a reverse gesture to return to FAQ', () => {
    const s = setup()
    s.wheel(30); s.scroll(11230); s.tick(0); s.tick(500)
    expect(s.wheel(50).defaultPrevented).toBe(true)
    expect(s.wheel(-50).defaultPrevented).toBe(false)
    s.scroll(11500); s.tick(600); s.tick(1600)
    expect(s.view.scrollY).toBe(11200)
    s.stop()
  })
  it('waits for release when the scrollbar or a finger is held', () => {
    const s = setup()
    s.view.dispatchEvent(new Event('pointerdown'))
    s.scroll(11400)
    expect(s.frames.size).toBe(0)
    s.view.dispatchEvent(new Event('pointerup'))
    expect(s.frames.size).toBe(1)
    s.stop()
  })
  it('cancels pending frames on resize, tab hiding and unmount', () => {
    for (const interrupt of ['resize', 'visibilitychange', 'unmount']) {
      const s = setup()
      s.wheel(30); s.scroll(11400); s.tick(0)
      if (interrupt === 'resize') s.view.dispatchEvent(new Event('resize'))
      else if (interrupt === 'visibilitychange') { s.page.visibilityState = 'hidden'; s.page.dispatchEvent(new Event('visibilitychange')) }
      else s.stop()
      expect(s.frames.size).toBe(0)
      s.stop()
    }
  })
})
