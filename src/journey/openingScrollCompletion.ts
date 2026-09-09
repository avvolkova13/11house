/** Complete only the opening flight; reading/product sections retain native scrolling. */
export function attachOpeningScrollCompletion(view: Window, page: Document, getAccessTop: () => number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let previousY = view.scrollY
  let direction = 1
  let pointerHeld = false
  let touchHeld = false
  const cancel = () => clearTimeout(timer)
  const settle = () => {
    if (pointerHeld || touchHeld || page.visibilityState === 'hidden') return
    const y = view.scrollY
    const end = getAccessTop()
    // Tolerate browser rounding/bounce at either endpoint, without moving readable content.
    if (!Number.isFinite(end) || y <= 12 || y >= end - 2) return
    view.scrollTo({ top: direction > 0 ? end : 0, behavior: 'smooth' })
  }
  const schedule = () => {
    cancel()
    if (!pointerHeld && !touchHeld && page.visibilityState !== 'hidden') timer = setTimeout(settle, 240)
  }
  const onScroll = () => {
    const y = view.scrollY
    if (Math.abs(y - previousY) > 1) direction = y > previousY ? 1 : -1
    previousY = y
    schedule()
  }
  const onPointerDown = () => { pointerHeld = true; cancel() }
  const onPointerUp = () => { pointerHeld = false; schedule() }
  const onTouchStart = () => { touchHeld = true; cancel() }
  const onTouchEnd = (event: TouchEvent) => { touchHeld = event.touches.length > 0; schedule() }
  const onResize = () => { previousY = view.scrollY; cancel() }
  view.addEventListener('scroll', onScroll, { passive: true })
  view.addEventListener('wheel', schedule, { passive: true })
  view.addEventListener('pointerdown', onPointerDown, { passive: true })
  view.addEventListener('pointerup', onPointerUp, { passive: true })
  view.addEventListener('pointercancel', onPointerUp, { passive: true })
  view.addEventListener('touchstart', onTouchStart, { passive: true })
  view.addEventListener('touchend', onTouchEnd, { passive: true })
  view.addEventListener('touchcancel', onTouchEnd, { passive: true })
  view.addEventListener('resize', onResize, { passive: true })
  page.addEventListener('visibilitychange', schedule)
  schedule()
  return () => {
    cancel()
    view.removeEventListener('scroll', onScroll)
    view.removeEventListener('wheel', schedule)
    view.removeEventListener('pointerdown', onPointerDown)
    view.removeEventListener('pointerup', onPointerUp)
    view.removeEventListener('pointercancel', onPointerUp)
    view.removeEventListener('touchstart', onTouchStart)
    view.removeEventListener('touchend', onTouchEnd)
    view.removeEventListener('touchcancel', onTouchEnd)
    view.removeEventListener('resize', onResize)
    page.removeEventListener('visibilitychange', schedule)
  }
}
