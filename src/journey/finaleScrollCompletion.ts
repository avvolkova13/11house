const DURATION = 1000
const THRESHOLD = 18

/** One intentional gesture completes the finale reveal; ordinary page navigation stays native. */
export function attachFinaleScrollCompletion(view: Window, page: Document, getFinaleTop: () => number) {
  let frame = 0
  let running = false
  let direction = 0
  let pointerHeld = false
  let touchHeld = false
  let previousY = view.scrollY
  let startTime: number | null = null
  let from = 0
  let target = 0
  const cancel = () => {
    view.cancelAnimationFrame(frame)
    frame = 0
    running = false
    startTime = null
  }
  const animate = (now: number) => {
    if (!running || page.visibilityState === 'hidden') { cancel(); return }
    if (startTime === null) startTime = now
    const t = Math.min(1, (now - startTime) / DURATION)
    const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    view.scrollTo({ top: from + (target - from) * eased, behavior: 'instant' })
    if (t < 1) frame = view.requestAnimationFrame(animate)
    else { cancel(); direction = 0 }
  }
  const settle = () => {
    if (running || !direction || pointerHeld || touchHeld || page.visibilityState === 'hidden') return
    const end = getFinaleTop()
    const start = end - view.innerHeight
    const y = view.scrollY
    if (!Number.isFinite(end) || y <= start || y >= end) return
    if (direction > 0 ? y < start + THRESHOLD : y > end - THRESHOLD) return
    from = y
    // Cross fractional layout boundaries even when the browser rounds scrollY.
    target = direction > 0 ? Math.ceil(end) : Math.floor(start)
    running = true
    frame = view.requestAnimationFrame(animate)
  }
  const onScroll = () => {
    const y = view.scrollY
    if (!running && (pointerHeld || touchHeld) && Math.abs(y - previousY) > 1) direction = Math.sign(y - previousY)
    previousY = y
    settle()
  }
  const onWheel = (event: WheelEvent) => {
    if (!event.deltaY || event.ctrlKey) return
    const nextDirection = Math.sign(event.deltaY)
    if (running && nextDirection === direction) { event.preventDefault(); return }
    if (running) cancel()
    direction = nextDirection
  }
  const onKeyDown = (event: KeyboardEvent) => {
    const element = event.target as HTMLElement | null
    if (element?.closest?.('input, textarea, select, button, a, [contenteditable="true"], dialog')) return
    const nextDirection = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? 1
      : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0
    if (!nextDirection) { cancel(); direction = 0; return }
    if (running && direction === nextDirection) { event.preventDefault(); return }
    cancel()
    direction = nextDirection
  }
  const onPointerDown = () => { cancel(); direction = 0; pointerHeld = true }
  const onPointerUp = () => { pointerHeld = false; settle() }
  const onTouchStart = () => { cancel(); direction = 0; touchHeld = true }
  const onTouchEnd = (event: TouchEvent) => { touchHeld = event.touches.length > 0; settle() }
  const reset = () => { cancel(); direction = 0; previousY = view.scrollY }
  // A header/footer anchor must be able to pass through this range without snapping back.
  const onClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement | null)?.closest?.('a, button')) reset()
  }
  view.addEventListener('scroll', onScroll, { passive: true })
  view.addEventListener('wheel', onWheel, { passive: false })
  view.addEventListener('keydown', onKeyDown)
  view.addEventListener('pointerdown', onPointerDown, { passive: true })
  view.addEventListener('pointerup', onPointerUp, { passive: true })
  view.addEventListener('pointercancel', onPointerUp, { passive: true })
  view.addEventListener('touchstart', onTouchStart, { passive: true })
  view.addEventListener('touchend', onTouchEnd, { passive: true })
  view.addEventListener('touchcancel', onTouchEnd, { passive: true })
  view.addEventListener('resize', reset)
  view.addEventListener('pageshow', reset)
  page.addEventListener('visibilitychange', reset)
  page.addEventListener('click', onClick, true)
  return () => {
    reset()
    view.removeEventListener('scroll', onScroll)
    view.removeEventListener('wheel', onWheel)
    view.removeEventListener('keydown', onKeyDown)
    view.removeEventListener('pointerdown', onPointerDown)
    view.removeEventListener('pointerup', onPointerUp)
    view.removeEventListener('pointercancel', onPointerUp)
    view.removeEventListener('touchstart', onTouchStart)
    view.removeEventListener('touchend', onTouchEnd)
    view.removeEventListener('touchcancel', onTouchEnd)
    view.removeEventListener('resize', reset)
    view.removeEventListener('pageshow', reset)
    page.removeEventListener('visibilitychange', reset)
    page.removeEventListener('click', onClick, true)
  }
}
