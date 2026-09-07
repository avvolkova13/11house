import './styles.css'
import { buildAccessibleSummary } from './dialTexture'
import { getPreviewPhase, getReducedMotionPreference } from './environment'
import { NatalDialScene } from './renderer/NatalDialScene'

const canvas = document.querySelector<HTMLCanvasElement>('#natal-dial-canvas')
const fallback = document.querySelector<HTMLDivElement>('#natal-dial-fallback')
const summary = document.querySelector<HTMLParagraphElement>('#natal-dial-summary')

if (!canvas || !fallback || !summary) {
  throw new Error('Natal dial shell is incomplete')
}

summary.textContent = buildAccessibleSummary()
const reducedMotion = getReducedMotionPreference(
  matchMedia('(prefers-reduced-motion: reduce)').matches,
  location.search,
  import.meta.env.DEV,
)
const previewPhase = getPreviewPhase(location.search, import.meta.env.DEV)

function showFallback(
  targetCanvas: HTMLCanvasElement,
  targetFallback: HTMLDivElement,
  error: unknown,
) {
  console.error('Natal dial initialization failed', error)
  targetCanvas.hidden = true
  targetFallback.hidden = false
}

try {
  const scene = new NatalDialScene(canvas, fallback, reducedMotion)
  if (previewPhase === null) scene.start()
  else scene.renderAtPhase(previewPhase)

  if (import.meta.env.DEV) {
    Object.assign(window, {
      __natalDialDebug: {
        renderAtPhase: (phase: number) => scene.renderAtPhase(phase),
      },
    })
  }

  addEventListener('pagehide', () => scene.dispose(), { once: true })
} catch (error) {
  showFallback(canvas, fallback, error)
}
