import { useEffect, useRef, useState } from 'react'
import { CosmicScene } from '../cosmic/CosmicScene'

export function CosmicHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'))
    let scene: CosmicScene | undefined

    try {
      scene = new CosmicScene(canvas, {
        reducedMotion,
        onFallback: () => setFallback(true),
      })
      scene.start()
    } catch {
      setFallback(true)
    }

    return () => {
      scene?.dispose()
    }
  }, [])

  return (
    <section className="cosmic-runway">
      <section className={`cosmic-hero${fallback ? ' cosmic-hero--fallback' : ''}`}>
        <canvas ref={canvasRef} className="cosmic-canvas" />
      </section>
    </section>
  )
}
