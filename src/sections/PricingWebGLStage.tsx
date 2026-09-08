import { useCallback, useEffect, useRef, useState } from 'react'

import { PricingWebGLScene } from './PricingWebGLScene'
import type { PricingWebGLRenderState } from './PricingWebGLScene'
import type { PricingPlan } from './pricingData'
import {
  getPricingRenderMode,
  shouldRunPricingFrame,
} from './pricingWebglLifecycle'
import type {
  PricingFrameGate,
  PricingFrameOverride,
} from './pricingWebglLifecycle'
import {
  PRICING_TRANSITION_MS,
  type PricingMotionState,
} from './pricingMotion'

export { getPricingRenderMode, shouldRunPricingFrame }
export type { PricingFrameGate, PricingFrameOverride }

export type PricingTransitionClock = {
  sequence: number | null
  startedAt: number | null
}

type AnimationFrameRef = {
  current: number
}

type InitializablePricingScene = {
  initialize: () => Promise<void>
}

export type PricingWebGLStageProps = {
  plans: PricingPlan[]
  motionState: PricingMotionState
  inView: boolean
  prefersReducedMotion: boolean
  onFallback: () => void
}

export function parsePricingFrameOverride(search: string): PricingFrameOverride | null {
  const parameters = new URLSearchParams(search)
  const rawProgress = parameters.get('pricing-progress')

  if (rawProgress === null || rawProgress.trim() === '') return null

  const progress = Number(rawProgress)
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) return null

  return {
    direction: parameters.get('pricing-direction') === 'backward' ? 'backward' : 'forward',
    progress,
  }
}

export function getPricingTransitionProgress(timestamp: number, transitionStartedAt: number): number {
  const elapsed = timestamp - transitionStartedAt
  return Math.min(1, Math.max(0, elapsed / PRICING_TRANSITION_MS))
}

export function synchronizePricingTransitionClock(
  clock: PricingTransitionClock,
  motionState: PricingMotionState,
  timestamp: number,
): void {
  if (motionState.phase !== 'transitioning') {
    clock.sequence = null
    clock.startedAt = null
    return
  }

  if (clock.sequence === motionState.sequence) return

  clock.sequence = motionState.sequence
  clock.startedAt = timestamp
}

export function createPricingFrameRenderState(
  plans: readonly PricingPlan[],
  motionState: PricingMotionState,
  frameOverride: PricingFrameOverride | null,
  transitionProgress = 0,
): PricingWebGLRenderState | null {
  const activeIndex = plans.findIndex((plan) => plan.key === motionState.activeKey)
  if (activeIndex < 0 || plans.length === 0) return null

  if (frameOverride) {
    const directionOffset = frameOverride.direction === 'forward' ? -1 : 1
    const targetIndex = plans.length > 1
      ? modulo(activeIndex + directionOffset, plans.length)
      : null

    return {
      activeIndex,
      targetIndex,
      direction: frameOverride.direction,
      progress: frameOverride.progress,
    }
  }

  const targetIndex = motionState.targetKey === null
    ? null
    : plans.findIndex((plan) => plan.key === motionState.targetKey)

  return {
    activeIndex,
    targetIndex: targetIndex === -1 ? null : targetIndex,
    direction: motionState.direction,
    progress: motionState.phase === 'transitioning'
      ? Math.min(1, Math.max(0, transitionProgress))
      : 0,
  }
}

export function cancelPricingAnimationFrame(
  frameRef: AnimationFrameRef,
  cancelFrame: (handle: number) => void = cancelAnimationFrame,
): void {
  if (frameRef.current === 0) return

  cancelFrame(frameRef.current)
  frameRef.current = 0
}

export async function initializePricingScene(
  scene: InitializablePricingScene,
  isMounted: () => boolean,
  onReady: () => void,
  onFallback: () => void,
): Promise<void> {
  try {
    await scene.initialize()
    if (isMounted()) onReady()
  } catch {
    if (isMounted()) onFallback()
  }
}

export function createPricingFallbackReporter(
  isMounted: () => boolean,
  onFallback: () => void,
): () => boolean {
  let reported = false

  return () => {
    if (reported || !isMounted()) return false

    reported = true
    onFallback()
    return true
  }
}

export function PricingWebGLStage({
  plans,
  motionState,
  inView,
  prefersReducedMotion,
  onFallback,
}: PricingWebGLStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<PricingWebGLScene | null>(null)
  const frameRef = useRef(0)
  const transitionStartedAtRef = useRef<number | null>(null)
  const transitionSequenceRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const fallbackRef = useRef(false)
  const initialPlansRef = useRef(plans)
  const onFallbackRef = useRef(onFallback)
  const [initialized, setInitialized] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(() => (
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  ))
  const frameOverrideRef = useRef<PricingFrameOverride | null>(
    import.meta.env.DEV && typeof window !== 'undefined'
      ? parsePricingFrameOverride(window.location.search)
      : null,
  )
  const latestRenderInputRef = useRef({
    plans,
    motionState,
    documentVisible,
    inView,
    prefersReducedMotion,
  })

  onFallbackRef.current = onFallback
  latestRenderInputRef.current = {
    plans,
    motionState,
    documentVisible,
    inView,
    prefersReducedMotion,
  }

  const cancelFrame = useCallback(() => {
    cancelPricingAnimationFrame(frameRef)
  }, [])

  const renderLatestFrame = useCallback((scene: PricingWebGLScene, timestamp: number) => {
    const current = latestRenderInputRef.current
    const transitionStartedAt = transitionStartedAtRef.current
    const transitionProgress = current.motionState.phase === 'transitioning'
      && transitionStartedAt !== null
      ? getPricingTransitionProgress(timestamp, transitionStartedAt)
      : 0
    const renderState = createPricingFrameRenderState(
      current.plans,
      current.motionState,
      frameOverrideRef.current,
      transitionProgress,
    )

    if (renderState) scene.render(renderState, current.prefersReducedMotion || frameOverrideRef.current ? 0 : timestamp / 1000)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    let active = true
    let resizeObserver: ResizeObserver | null = null
    let listeningForWindowResize = false
    let ownedScene: PricingWebGLScene | null = null
    let sceneOwnershipReleased = false

    const stopResizeObservation = () => {
      resizeObserver?.disconnect()
      resizeObserver = null
      if (listeningForWindowResize) {
        window.removeEventListener('resize', resizeScene)
        listeningForWindowResize = false
      }
    }

    const reportFallback = createPricingFallbackReporter(
      () => active && mountedRef.current,
      () => {
        fallbackRef.current = true
        cancelFrame()
        stopResizeObservation()
        sceneRef.current = null
        setInitialized(false)
        setFallback(true)
        try {
          onFallbackRef.current()
        } catch {
          // The renderer remains safely released even if a consumer callback throws.
        }
      },
    )

    const releaseSceneOwnership = () => {
      if (!ownedScene || sceneOwnershipReleased) return

      sceneOwnershipReleased = true
      if (sceneRef.current === ownedScene) sceneRef.current = null
    }

    const disposeOwnedScene = () => {
      if (!ownedScene || sceneOwnershipReleased) return

      sceneOwnershipReleased = true
      if (sceneRef.current === ownedScene) sceneRef.current = null
      ownedScene.dispose()
    }

    const reportSelfReleasedSceneFallback = () => {
      releaseSceneOwnership()
      reportFallback()
    }

    const canvas = canvasRef.current
    if (!canvas) {
      reportFallback()
      return () => {
        active = false
        mountedRef.current = false
      }
    }
    const sceneCanvas = canvas

    let scene: PricingWebGLScene
    try {
      scene = new PricingWebGLScene(sceneCanvas, initialPlansRef.current, {
        maxDpr: 1.5,
        onContextLost: () => {
          if (active && mountedRef.current) setContextLost(true)
          reportSelfReleasedSceneFallback()
        },
      })
      ownedScene = scene
      sceneRef.current = scene
    } catch {
      reportFallback()
      return () => {
        active = false
        mountedRef.current = false
      }
    }

    function resizeScene() {
      if (!active || fallbackRef.current) return

      const width = Math.max(1, sceneCanvas.clientWidth)
      const height = Math.max(1, sceneCanvas.clientHeight)
      scene.resize(width, height, window.devicePixelRatio || 1)
      if (sceneRef.current === scene) renderLatestFrame(scene, performance.now())
    }

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry || !active || fallbackRef.current) return

        scene.resize(
          Math.max(1, entry.contentRect.width),
          Math.max(1, entry.contentRect.height),
          window.devicePixelRatio || 1,
        )
        if (sceneRef.current === scene) renderLatestFrame(scene, performance.now())
      })
      resizeObserver.observe(sceneCanvas)
    } else {
      window.addEventListener('resize', resizeScene)
      listeningForWindowResize = true
    }

    resizeScene()
    void scene.initialize().then(
      () => {
        if (
          !active
          || !mountedRef.current
          || fallbackRef.current
          || sceneRef.current !== scene
        ) {
          disposeOwnedScene()
          return
        }

        setInitialized(true)
      },
      () => {
        reportSelfReleasedSceneFallback()
      },
    )

    return () => {
      active = false
      mountedRef.current = false
      cancelFrame()
      stopResizeObservation()
      if (sceneRef.current === scene) sceneRef.current = null
      disposeOwnedScene()
    }
  }, [cancelFrame, renderLatestFrame])

  useEffect(() => {
    const updateVisibility = () => {
      setDocumentVisible(document.visibilityState !== 'hidden')
    }

    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    const clock = {
      sequence: transitionSequenceRef.current,
      startedAt: transitionStartedAtRef.current,
    }
    synchronizePricingTransitionClock(clock, motionState, performance.now())
    transitionSequenceRef.current = clock.sequence
    transitionStartedAtRef.current = clock.startedAt
  }, [motionState.phase, motionState.sequence])

  useEffect(() => {
    if (!initialized || fallback) return

    const scene = sceneRef.current
    if (!scene) return

    if (
      frameOverrideRef.current
      || motionState.phase === 'holding'
      || prefersReducedMotion
    ) {
      renderLatestFrame(scene, performance.now())
    }
  }, [
    fallback,
    initialized,
    motionState.activeKey,
    motionState.direction,
    motionState.phase,
    motionState.sequence,
    motionState.targetKey,
    prefersReducedMotion,
    renderLatestFrame,
  ])

  useEffect(() => {
    cancelFrame()

    if (!initialized || fallback) return

    const scene = sceneRef.current
    const frameGate: PricingFrameGate = {
      phase: motionState.phase,
      inView,
      documentVisible,
      reducedMotion: prefersReducedMotion,
      fallback,
      frameOverride: frameOverrideRef.current,
    }
    if (!scene || !shouldRunPricingFrame(frameGate)) return

    let lastArtworkFrame = -Infinity
    const renderFrame = (timestamp: number) => {
      frameRef.current = 0
      if (!mountedRef.current || fallbackRef.current || sceneRef.current !== scene) return

      const current = latestRenderInputRef.current
      const currentGate: PricingFrameGate = {
        phase: current.motionState.phase,
        inView: current.inView,
        documentVisible: current.documentVisible,
        reducedMotion: current.prefersReducedMotion,
        fallback: fallbackRef.current,
        frameOverride: frameOverrideRef.current,
      }
      if (!shouldRunPricingFrame(currentGate)) return

      const isTransitioning = current.motionState.phase === 'transitioning'
      // Quiet artwork runs at 30 fps; card transitions retain display refresh rate.
      if (!isTransitioning && timestamp - lastArtworkFrame < 1000 / 30) {
        frameRef.current = requestAnimationFrame(renderFrame)
        return
      }
      lastArtworkFrame = timestamp
      const transitionStartedAt = transitionStartedAtRef.current
      if (isTransitioning && transitionStartedAt === null) return

      const progress = isTransitioning && transitionStartedAt !== null
        ? getPricingTransitionProgress(timestamp, transitionStartedAt)
        : 0
      const renderState = createPricingFrameRenderState(
        current.plans,
        current.motionState,
        null,
        progress,
      )
      if (renderState) scene.render(renderState, timestamp / 1000)

      if (!isTransitioning || progress < 1) {
        frameRef.current = requestAnimationFrame(renderFrame)
      }
    }

    frameRef.current = requestAnimationFrame(renderFrame)
    return cancelFrame
  }, [
    cancelFrame,
    documentVisible,
    fallback,
    inView,
    initialized,
    motionState.activeKey,
    motionState.direction,
    motionState.phase,
    motionState.sequence,
    motionState.targetKey,
    prefersReducedMotion,
  ])

  const renderMode = getPricingRenderMode({
    initialized,
    contextLost,
    fallback,
  })
  const isFallbackMode = renderMode === 'fallback' && fallback

  return (
    <div
      className="pricing-webgl-stage"
      data-fallback={isFallbackMode ? 'true' : 'false'}
      data-render-mode={renderMode}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
      hidden={isFallbackMode}
    >
      <canvas
        className="pricing-webgl-stage__canvas"
        aria-hidden="true"
        ref={canvasRef}
      />
    </div>
  )
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}
