import { useEffect, useRef } from 'react'
import { loadLandingFonts } from '../fonts'
import { samplePractitionerHeadingMotion } from './practitionerResultsMotion'

type TextTile = { x: number; y: number; coverage: number; noise: number }
type RasterWord = {
  source: HTMLCanvasElement
  x: number
  y: number
  width: number
  height: number
  tiles: TextTile[]
}

/** Original canvas reveal, using PRODUX's observed 5px cells / 70ms word cadence. */
export function PractitionerHeading() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const heading = headingRef.current
    const canvas = canvasRef.current
    if (!heading || !canvas) return
    const context = canvas.getContext('2d')
    if (!context) { heading.dataset.revealEntered = 'true'; return }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let entered = false
    let inView = false
    let disposed = false
    let start = 0
    let words: RasterWord[] = []
    const cell = 5
    const finish = () => {
      window.cancelAnimationFrame(frame)
      frame = 0
      heading.dataset.pixelActive = 'false'
      heading.dataset.revealEntered = 'true'
    }
    const rasterize = () => {
      const bounds = heading.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return false
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.ceil(bounds.width * dpr)
      canvas.height = Math.ceil(bounds.height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      words = Array.from(heading.querySelectorAll<HTMLElement>('[data-review-word]')).map((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const source = document.createElement('canvas')
        source.width = Math.ceil(rect.width + 4)
        source.height = Math.ceil(rect.height + 4)
        const ink = source.getContext('2d')!
        ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        // Keep the reference's letter relationship while using the site's own font.
        ink.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing
        const metrics = ink.measureText(element.textContent ?? '')
        const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.8
        const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * 0.2
        ink.fillStyle = '#f5f3ee'
        ink.fillText(element.textContent ?? '', 0, (rect.height - ascent - descent) / 2 + ascent)
        const pixels = ink.getImageData(0, 0, source.width, source.height).data
        const tiles: TextTile[] = []
        for (let y = 0; y < source.height; y += cell) {
          for (let x = 0; x < source.width; x += cell) {
            let alpha = 0
            let samples = 0
            for (let dy = 0; dy < cell && y + dy < source.height; dy++) {
              for (let dx = 0; dx < cell && x + dx < source.width; dx++) {
                alpha += pixels[((y + dy) * source.width + x + dx) * 4 + 3] / 255
                samples++
              }
            }
            if (alpha > 0) tiles.push({ x, y, coverage: alpha / samples,
              noise: Math.sin(x * 12.9898 + y * 78.233) * 0.5 + 0.5 })
          }
        }
        return { source, tiles, x: rect.left - bounds.left, y: rect.top - bounds.top,
          width: rect.width, height: rect.height }
      })
      return true
    }
    const draw = (now: number) => {
      frame = 0
      if (disposed) return
      if (document.visibilityState === 'hidden') { finish(); return }
      context.clearRect(0, 0, canvas.width, canvas.height)
      const elapsed = now - start
      words.forEach((word, index) => {
        const { reveal, settle } = samplePractitionerHeadingMotion(elapsed, index)
        if (reveal === 0) return
        context.save()
        context.translate(word.x, word.y + word.height * 0.3 * (1 - settle))
        context.rotate(-6 * Math.PI / 180 * (1 - settle))
        if (reveal >= 1) context.drawImage(word.source, 0, 0)
        else word.tiles.forEach((tile) => {
          const diagonal = (1 - tile.y / word.height) * 0.72 + tile.x / word.width * 0.13
          const threshold = diagonal + tile.noise * 0.15
          const age = reveal - threshold
          if (age <= 0) return
          const sharp = Math.min(1, age / 0.15)
          context.globalAlpha = (1 - sharp) * Math.min(1, tile.coverage * 1.7)
          context.fillStyle = age < 0.055 ? '#7dceff' : '#f5f3ee'
          context.fillRect(tile.x, tile.y, cell, cell)
          context.globalAlpha = sharp
          context.drawImage(word.source, tile.x, tile.y, cell, cell, tile.x, tile.y, cell, cell)
        })
        context.restore()
      })
      if (elapsed >= 1750 + (words.length - 1) * 70) finish()
      else frame = window.requestAnimationFrame(draw)
    }
    const enter = async () => {
      if (entered || disposed) return
      entered = true
      heading.dataset.revealEntered = 'true'
      if (media.matches || window.innerWidth <= 640) return
      await loadLandingFonts()
      if (disposed || !inView || media.matches || document.visibilityState === 'hidden' || !rasterize()) return
      heading.dataset.pixelActive = 'true'
      start = performance.now()
      frame = window.requestAnimationFrame(draw)
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) void enter()
      else if (entered && frame) finish()
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 })
    observer.observe(heading)
    const resize = () => { if (entered) finish() }
    const visibility = () => { if (document.visibilityState === 'hidden' && entered) finish() }
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', visibility)
    media.addEventListener('change', resize)
    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      media.removeEventListener('change', resize)
    }
  }, [])

  return (
    <h2 id="practitioner-results-title" ref={headingRef}>
      <span className="practitioner-results__heading-line">
        <span data-review-word="0">Реальные</span>{' '}<span data-review-word="1">результаты</span>
      </span>
      <span className="practitioner-results__heading-line"><span data-review-word="2">практиков</span></span>
      <canvas className="practitioner-results__heading-canvas" ref={canvasRef} aria-hidden="true" />
    </h2>
  )
}
