// @ts-expect-error Vitest runs in Node, while the app tsconfig intentionally omits Node types.
import { readFileSync } from 'node:fs'

import { StrictMode, act } from 'react'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pricingSceneHarness = vi.hoisted(() => {
  type SceneOptions = {
    maxDpr: number
    onContextLost: () => void
  }

  let initialization: Promise<void> = Promise.resolve()
  const instances: MockPricingWebGLScene[] = []

  class MockPricingWebGLScene {
    initialized = false
    disposed = false
    readonly renderedStates: unknown[] = []
    readonly initialize = vi.fn(async () => {
      try {
        await initialization
        if (!this.disposed) this.initialized = true
      } catch (error) {
        if (!this.disposed) this.dispose()
        throw error
      }
    })
    readonly resize = vi.fn()
    readonly render = vi.fn((state: unknown) => {
      if (this.initialized && !this.disposed) this.renderedStates.push(state)
    })
    readonly dispose = vi.fn(() => {
      this.disposed = true
      this.initialized = false
    })

    constructor(
      readonly canvas: HTMLCanvasElement,
      readonly plans: unknown[],
      readonly options: SceneOptions,
    ) {
      instances.push(this)
    }

    loseContext() {
      try {
        this.options.onContextLost()
      } finally {
        this.dispose()
      }
    }
  }

  return {
    MockPricingWebGLScene,
    getPricingHoldFrame(width: number, height: number) {
      const safeWidth = Math.max(1, width)
      const safeHeight = Math.max(1, height)
      const safeInset = safeWidth <= 560 ? 16 : 0
      const availableWidth = Math.max(1, safeWidth - safeInset * 2)
      const availableHeight = Math.max(1, safeHeight - safeInset * 2)
      const aspectRatio = 1800 / 1024
      const widthFitHeight = availableWidth * aspectRatio
      const fitAxis = widthFitHeight <= availableHeight ? 'width' : 'height'
      const projectedWidth = fitAxis === 'width'
        ? availableWidth / 1.3
        : availableHeight / 1.3 / aspectRatio

      return {
        cameraDistance: 1,
        fitAxis,
        height: projectedWidth * aspectRatio,
        safeInset,
        width: projectedWidth,
      }
    },
    instances,
    reset() {
      initialization = Promise.resolve()
      instances.length = 0
    },
    setInitialization(nextInitialization: Promise<void>) {
      initialization = nextInitialization
    },
  }
})

vi.mock('./PricingWebGLScene', () => ({
  PricingWebGLScene: pricingSceneHarness.MockPricingWebGLScene,
  PRICING_CAMERA_FRAMING_SCALE: 1.3,
  getPricingHoldFrame: pricingSceneHarness.getPricingHoldFrame,
}))

import { PricingSection } from './PricingSection'
import { PricingOrbit } from './PricingOrbit'
import {
  PricingWebGLStage,
  cancelPricingAnimationFrame,
  createPricingFrameRenderState,
  createPricingFallbackReporter,
  getPricingTransitionProgress,
  initializePricingScene,
  parsePricingFrameOverride,
  shouldRunPricingFrame,
  synchronizePricingTransitionClock,
} from './PricingWebGLStage'
import {
  beginPricingTransition,
  createPricingMotionState,
} from './pricingMotion'
import { pricingPlans } from './pricingData'
import { PRICING_CAMERA_FRAMING_SCALE } from './PricingWebGLScene'
import { samplePricingPlane, samplePricingTurn } from './pricingWebglMotion'

function projectExpectedHoldFrame(width: number, height: number) {
  return pricingSceneHarness.getPricingHoldFrame(width, height)
}

function projectExpectedHoldSideBounds(width: number, height: number) {
  const cardWidth = 4.8
  const activeCardZ = 1.6
  const focalLength = height / (2 * Math.tan(36 * Math.PI / 360))
  const activeFrame = projectExpectedHoldFrame(width, height)
  const cameraZ = activeCardZ + focalLength / (activeFrame.width / cardWidth)
  const sample = samplePricingPlane(1, samplePricingTurn(0, 'forward'))
  const halfWidth = cardWidth * sample.scale / 2
  const projectX = (localX: number) => {
    const worldX = sample.x + localX * Math.cos(sample.rotationY)
    const worldZ = sample.z - localX * Math.sin(sample.rotationY)
    return width / 2 + focalLength * worldX / (cameraZ - worldZ)
  }
  const [rawLeft, rawRight] = [-halfWidth, halfWidth]
    .map(projectX)
    .sort((a, b) => a - b)
  const right = {
    left: Math.max(0, rawLeft),
    right: Math.min(width, rawRight),
  }

  return {
    left: { left: width - right.right, right: width - right.left },
    right,
  }
}

describe('PricingSection', () => {
  it('keeps plan details and a registration action inside the cards without a separate details block', () => {
    const html = renderToStaticMarkup(<PricingSection />)
    expect(html).not.toContain('class="pricing-details"')
    expect(html).not.toContain('pricing-section__note')
    expect(html).toContain('aria-label="Тариф Pro"')
    expect(html).toMatch(/class="pricing-card-action"[^>]*href="https:\/\/app\.elevenhouse\.ai\/auth\?mode=register"[^>]*>Выбрать Pro<\/a>/)
    expect(html).toContain('30 записей в месяц')
    expect(html).toContain('20 AI-действий в месяц')
    expect(html).toContain('До 5 астрологов')
    expect(html).toContain('Всё из Старт, плюс')
    expect(html).toContain('Всё из Pro, плюс')
  })
  it('renders one synchronized holding state with Pro in the center', () => {
    const html = renderToStaticMarkup(<PricingSection />)

    expect(html).toContain('data-motion-phase="holding"')
    expect(html).toContain('data-motion-direction="forward"')
    expect(html).toContain('data-card-role="active"')
    expect(html).toContain('data-card-role="previous"')
    expect(html).toContain('data-card-role="next"')
    expect(html).toContain('data-plan="pro"')
    expect(html).toContain('data-selected="true"')
    expect(html).toContain('Pro')
    expect(html).toContain('Все системы расчётов')
  })

  it('keeps all plans available as manual controls without legacy delays', () => {
    const html = renderToStaticMarkup(<PricingSection />)

    expect(html.match(/aria-pressed=/g)).toHaveLength(6)
    expect(html).toContain('Подробнее о тарифе Старт')
    expect(html).toContain('Подробнее о тарифе Studio')
    expect(html).toContain('aria-live="polite"')
    expect(html).not.toContain('--orbit-delay')
  })

  it('renders an aria-hidden WebGL canvas and accessible overlay controls', () => {
    const html = renderToStaticMarkup(<PricingSection />)

    expect(html).toContain('pricing-webgl-stage__canvas')
    expect(html).toContain('<canvas')
    expect(html).toContain('aria-hidden="true"')
    expect(html.match(/pricing-orbit-hit-area/g)).toHaveLength(3)
    expect(html).toContain('--pricing-camera-framing-scale:1.3')
  })

  it('keeps a static fallback without legacy reflection nodes', () => {
    const html = renderToStaticMarkup(<PricingSection />)

    expect(html).toContain('pricing-orbit-fallback')
    expect(html).toContain('data-visible="false"')
    expect(html).toMatch(/pricing-orbit-fallback[^>]*hidden=""/)
    expect(html).not.toContain('pricing-orbit-reflection__slice')
    expect(html).not.toContain('pricing-orbit__spectral-edge')
  })

  it('uses WebGL layout and contains no legacy CSS coverflow choreography', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')

    expect(css).toContain('.pricing-webgl-stage__canvas')
    expect(css).toContain('.pricing-orbit-hit-area')
    expect(css).toContain('.pricing-orbit-fallback')
    expect(css).toContain('.pricing-webgl-stage[data-fallback="true"]')
    expect(css).toContain('.pricing-orbit-fallback[data-visible="true"]')
    expect(css).not.toContain('@keyframes pricing-surface-enter-forward')
    expect(css).not.toContain('@keyframes pricing-reflection-enter-forward')
    expect(css).not.toContain('@keyframes pricing-spectral-left')
    expect(css).not.toContain('@keyframes pricing-scene-exposure')
    expect(css).not.toContain('rotateY(88deg)')
  })

  it('maps settled WebGL slots to matching controls and fallback cards at every breakpoint', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
    const normalizedCss = css.replace(/\s+/g, ' ')

    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area[data-card-role="next"] { z-index: 3; left: 20%; width: min(23vw, 340px, calc(60% - var(--pricing-active-hit-width))); }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area[data-card-role="previous"] { z-index: 3; right: auto; left: 80%; width: min(23vw, 340px, calc(60% - var(--pricing-active-hit-width))); }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-fallback__card[data-card-role="next"] { z-index: 1; left: 20%; width: min(23vw, 340px); height: auto; opacity: 0.54; }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-fallback__card[data-card-role="previous"] { z-index: 1; left: 80%; width: min(23vw, 340px); height: auto; opacity: 0.54; }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-fallback__card[data-card-role="next"] { left: 0; width: max(120px, 34vw); }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-fallback__card[data-card-role="previous"] { left: 100%; width: max(120px, 34vw); }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area[data-card-role="active"] { z-index: 2; left: 50%; width: var(--pricing-active-hit-width, auto); height: var(--pricing-active-hit-height, calc(100% / var(--pricing-camera-framing-scale))); aspect-ratio: 1024 / 1356; }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area[data-card-role="next"] { left: 11%; width: min(30vw, 270px, calc(78% - var(--pricing-active-hit-width))); }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area[data-card-role="previous"] { right: auto; left: 89%; width: min(30vw, 270px, calc(78% - var(--pricing-active-hit-width))); }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area[data-card-role="next"] { left: 0; width: 48px; transform: translate(0, -50%); }',
    )
    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area[data-card-role="previous"] { right: 0; left: auto; width: 48px; transform: translate(0, -50%); }',
    )
    expect(normalizedCss).not.toContain('data-card-role="incoming"')
    expect(normalizedCss).not.toContain('data-card-role="outgoing"')
    expect(normalizedCss).not.toContain('data-card-role="relay"')
    expect(normalizedCss).toContain(
      '.pricing-orbit-hit-area:focus-visible { outline: 2px solid #9f7711; outline-offset: 6px; }',
    )
    expect(normalizedCss).toContain('.pricing-orbit::after { content: none; position: absolute; z-index: 0;')
    expect(normalizedCss).toContain('top: var(--pricing-contact-shadow-top, 88%);')
    expect(normalizedCss).not.toContain('.pricing-orbit::after { top: 82%;')
    expect(normalizedCss).toContain('.pricing-orbit__controls { position: absolute; z-index: 3;')
  })

  it('keeps desktop, tablet, and physical-edge controls separate from the projected active hit area', () => {
    const layouts = [
      { width: 1440, orbitHeight: 790, mode: 'desktop' as const },
      { width: 1024, orbitHeight: 634.875, mode: 'desktop' as const },
      { width: 768, orbitHeight: 650, mode: 'tablet' as const },
      { width: 561, orbitHeight: 650, mode: 'tablet' as const },
      { width: 560, orbitHeight: 570, mode: 'mobile' as const },
      { width: 480, orbitHeight: 570, mode: 'mobile' as const },
      { width: 440, orbitHeight: 570, mode: 'mobile' as const },
      { width: 390, orbitHeight: 570, mode: 'mobile' as const },
    ]

    for (const layout of layouts) {
      const activeWidth = projectExpectedHoldFrame(layout.width, layout.orbitHeight).width
      const activeLeft = (layout.width - activeWidth) / 2
      const activeRight = activeLeft + activeWidth
      const sideCenterRatio = layout.mode === 'desktop' ? 0.2 : 0.11
      const nominalSideWidth = layout.mode === 'desktop'
        ? Math.min(layout.width * 0.23, 340)
        : Math.min(layout.width * 0.3, 270)
      const nonOverlapWidth = layout.mode === 'desktop'
        ? layout.width * 0.6 - activeWidth
        : layout.width * 0.78 - activeWidth
      const sideWidth = layout.mode === 'mobile'
        ? 48
        : Math.min(nominalSideWidth, nonOverlapWidth)
      const previousBounds = layout.mode === 'mobile'
        ? { left: 0, right: sideWidth }
        : {
            left: layout.width * sideCenterRatio - sideWidth / 2,
            right: layout.width * sideCenterRatio + sideWidth / 2,
          }
      const nextBounds = layout.mode === 'mobile'
        ? { left: layout.width - sideWidth, right: layout.width }
        : {
            left: layout.width * (1 - sideCenterRatio) - sideWidth / 2,
            right: layout.width * (1 - sideCenterRatio) + sideWidth / 2,
          }

      expect(previousBounds.right).toBeLessThanOrEqual(activeLeft + 0.001)
      expect(nextBounds.left).toBeGreaterThanOrEqual(activeRight - 0.001)
      expect(sideWidth).toBeGreaterThan(0)
    }
  })

  it('projects the text and selection hit area with the same matrix, including tablet widths', () => {
    const source = readFileSync(new URL('./PricingOrbit.tsx', import.meta.url), 'utf8')
    expect(source).toContain('element.style.transform = transform')
    expect(source).toContain('control.style.transform = transform')
    expect(source).toContain('onCardFrame={updateCardFrame}')
  })

  it('tracks pointer and keyboard modality before focus enters the pricing stage', () => {
    const source = readFileSync(new URL('./PricingSection.tsx', import.meta.url), 'utf8')

    expect(source).toContain("useState<PricingInputModality>('pointer')")
    expect(source).toContain("window.addEventListener('pointerdown'")
    expect(source).toContain("window.addEventListener('keydown'")
    expect(source).toContain("window.removeEventListener('pointerdown'")
    expect(source).toContain("window.removeEventListener('keydown'")
    expect(source).toContain('useEffect(() => {')
    expect(source).not.toContain('onPointerDownCapture')
    expect(source).not.toContain('onKeyDownCapture')
    expect(source).toContain("inputModality === 'keyboard'")
    expect(source).toContain("const handleGlobalPointerDown = () => setInputModality('pointer')")
    expect(source).toContain('[isAutoPaused, motionState.phase, motionState.sequence]')
    expect(source).toContain('const settleAfterPricingFallback = useCallback(() => {')
    expect(source).toContain('completePricingTransition(current)')
  })

  it('keeps pricing controls available while the renderer uses its HTML fallback', () => {
    const html = renderToStaticMarkup(<PricingSection />)
    const orbitSource = readFileSync(new URL('./PricingOrbit.tsx', import.meta.url), 'utf8')

    expect(html.match(/class="pricing-orbit-hit-area/g)).toHaveLength(3)
    expect(html).not.toMatch(/class="pricing-orbit-hit-area"[^>]*disabled/)
    expect(orbitSource).toContain('onFallback={reportFallback}')
    expect(orbitSource).toContain("disabled={motionState.phase === 'transitioning'}")
    expect(orbitSource).toContain('className="pricing-orbit-fallback"')
  })
})

describe('PricingWebGLStage lifecycle', () => {
  it('parses only finite development frame overrides inside the closed unit interval', () => {
    expect(parsePricingFrameOverride('?pricing-progress=0')).toEqual({
      direction: 'forward',
      progress: 0,
    })
    expect(parsePricingFrameOverride('?pricing-progress=0.42&pricing-direction=backward')).toEqual({
      direction: 'backward',
      progress: 0.42,
    })
    expect(parsePricingFrameOverride('?pricing-progress=1&pricing-direction=sideways')).toEqual({
      direction: 'forward',
      progress: 1,
    })

    for (const search of [
      '',
      '?pricing-progress=',
      '?pricing-progress=%20',
      '?pricing-progress=-0.01',
      '?pricing-progress=1.01',
      '?pricing-progress=Infinity',
      '?pricing-progress=not-a-number',
    ]) {
      expect(parsePricingFrameOverride(search)).toBeNull()
    }
  })

  it('synthesizes the adjacent target for a frozen forward or backward frame', () => {
    const motionState = createPricingMotionState('pro')

    expect(createPricingFrameRenderState(pricingPlans, motionState, {
      direction: 'forward',
      progress: 0.4,
    })).toEqual({
      activeIndex: 1,
      targetIndex: 0,
      direction: 'forward',
      progress: 0.4,
    })
    expect(createPricingFrameRenderState(pricingPlans, motionState, {
      direction: 'backward',
      progress: 0.4,
    })).toEqual({
      activeIndex: 1,
      targetIndex: 2,
      direction: 'backward',
      progress: 0.4,
    })
  })

  it('derives progress from elapsed wall-clock time and clamps both endpoints', () => {
    expect(getPricingTransitionProgress(850, 1000)).toBe(0)
    expect(getPricingTransitionProgress(1675, 1000)).toBe(0.5)
    expect(getPricingTransitionProgress(2350, 1000)).toBe(1)
    expect(getPricingTransitionProgress(5000, 1000)).toBe(1)
  })

  it('continues the same transition clock across gate changes and restarts only for a new sequence', () => {
    const clock = { sequence: null as number | null, startedAt: null as number | null }
    const firstTransition = beginPricingTransition(
      createPricingMotionState('pro'),
      pricingPlans.map((plan) => plan.key),
    )

    synchronizePricingTransitionClock(clock, firstTransition, 1000)
    expect(clock).toEqual({ sequence: 1, startedAt: 1000 })

    synchronizePricingTransitionClock(clock, firstTransition, 1700)
    expect(clock).toEqual({ sequence: 1, startedAt: 1000 })

    synchronizePricingTransitionClock(clock, { ...firstTransition, sequence: 2 }, 2000)
    expect(clock).toEqual({ sequence: 2, startedAt: 2000 })

    synchronizePricingTransitionClock(clock, createPricingMotionState('studio'), 2400)
    expect(clock).toEqual({ sequence: null, startedAt: null })
  })

  it('runs RAF only for a visible active transition without reduced motion or override', () => {
    const active = {
      phase: 'transitioning' as const,
      inView: true,
      documentVisible: true,
      reducedMotion: false,
      fallback: false,
      frameOverride: null,
    }

    expect(shouldRunPricingFrame(active)).toBe(true)
    expect(shouldRunPricingFrame({ ...active, phase: 'holding' })).toBe(true)
    expect(shouldRunPricingFrame({ ...active, inView: false })).toBe(false)
    expect(shouldRunPricingFrame({ ...active, documentVisible: false })).toBe(false)
    expect(shouldRunPricingFrame({ ...active, reducedMotion: true })).toBe(false)
    expect(shouldRunPricingFrame({ ...active, fallback: true })).toBe(false)
    expect(shouldRunPricingFrame({
      ...active,
      frameOverride: { direction: 'forward', progress: 0.5 },
    })).toBe(false)
  })

  it('cancels an outstanding frame once and clears its ref', () => {
    const frameRef = { current: 73 }
    const cancelFrame = vi.fn()

    cancelPricingAnimationFrame(frameRef, cancelFrame)
    cancelPricingAnimationFrame(frameRef, cancelFrame)

    expect(cancelFrame).toHaveBeenCalledOnce()
    expect(cancelFrame).toHaveBeenCalledWith(73)
    expect(frameRef.current).toBe(0)
  })

  it('reports initialization rejection only while mounted', async () => {
    const onReady = vi.fn()
    const onFallback = vi.fn()
    const mounted = { current: true }

    await initializePricingScene(
      { initialize: () => Promise.reject(new Error('renderer unavailable')) },
      () => mounted.current,
      onReady,
      onFallback,
    )
    expect(onReady).not.toHaveBeenCalled()
    expect(onFallback).toHaveBeenCalledOnce()

    let rejectAfterUnmount: ((reason?: unknown) => void) | undefined
    const pending = initializePricingScene(
      {
        initialize: () => new Promise<void>((_resolve, reject) => {
          rejectAfterUnmount = reject
        }),
      },
      () => mounted.current,
      onReady,
      onFallback,
    )
    mounted.current = false
    rejectAfterUnmount?.(new Error('late rejection'))
    await pending

    expect(onReady).not.toHaveBeenCalled()
    expect(onFallback).toHaveBeenCalledOnce()
  })

  it('does not report ready when initialization resolves after unmount', async () => {
    const onReady = vi.fn()
    const onFallback = vi.fn()
    const mounted = { current: true }
    let resolveAfterUnmount: (() => void) | undefined
    const pending = initializePricingScene(
      {
        initialize: () => new Promise<void>((resolve) => {
          resolveAfterUnmount = resolve
        }),
      },
      () => mounted.current,
      onReady,
      onFallback,
    )

    mounted.current = false
    resolveAfterUnmount?.()
    await pending

    expect(onReady).not.toHaveBeenCalled()
    expect(onFallback).not.toHaveBeenCalled()
  })

  it('reports fallback idempotently and never after unmount', () => {
    const onFallback = vi.fn()
    const mounted = { current: true }
    const reportFallback = createPricingFallbackReporter(
      () => mounted.current,
      onFallback,
    )

    reportFallback()
    reportFallback()
    mounted.current = false
    reportFallback()

    expect(onFallback).toHaveBeenCalledOnce()
  })

  it('owns observer and RAF cleanup without fixed-step progress', () => {
    const source = readFileSync(new URL('./PricingWebGLStage.tsx', import.meta.url), 'utf8')

    expect(source).toContain('new ResizeObserver')
    expect(source).toContain('.disconnect()')
    expect(source).toContain('cancelPricingAnimationFrame')
    expect(source).toContain('timestamp - transitionStartedAt')
    expect(source).toContain('/ PRICING_TRANSITION_MS')
    expect(source).not.toMatch(/progress\s*\+=/)
    expect(source).toContain('import.meta.env.DEV')
  })
})

describe('PricingWebGLStage React lifecycle integration', () => {
  let testDom: ReturnType<typeof installTestDom>
  let mountedRoots: Set<Root>

  beforeEach(() => {
    pricingSceneHarness.reset()
    testDom = installTestDom()
    mountedRoots = new Set()
  })

  afterEach(async () => {
    for (const root of mountedRoots) {
      await act(async () => root.unmount())
    }
    vi.useRealTimers()
    testDom.restore()
  })

  async function mountStage(
    overrides: Partial<Parameters<typeof PricingWebGLStage>[0]> = {},
    strictMode = false,
  ) {
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)
    const props = {
      plans: pricingPlans,
      motionState: createPricingMotionState(),
      inView: true,
      prefersReducedMotion: false,
      onFallback: vi.fn(),
      ...overrides,
    }

    await act(async () => {
      const stage = <PricingWebGLStage {...props} />
      root.render(strictMode ? <StrictMode>{stage}</StrictMode> : stage)
      await flushMicrotasks()
    })

    return {
      container,
      props,
      root,
      async render(nextOverrides: Partial<typeof props>) {
        Object.assign(props, nextOverrides)
        await act(async () => {
          const stage = <PricingWebGLStage {...props} />
          root.render(strictMode ? <StrictMode>{stage}</StrictMode> : stage)
          await flushMicrotasks()
        })
      },
      async unmount() {
        await act(async () => root.unmount())
        mountedRoots.delete(root)
      },
    }
  }

  it('animates settled artwork at 30fps and cancels frames on unmount', async () => {
    const initialization = createDeferred<void>()
    pricingSceneHarness.setInitialization(initialization.promise)
    const mounted = await mountStage()
    const scene = pricingSceneHarness.instances[0]

    expect(scene.renderedStates).toHaveLength(0)
    await act(async () => {
      initialization.resolve()
      await flushMicrotasks()
    })

    expect(scene.renderedStates).toEqual([{
      activeIndex: 1,
      targetIndex: null,
      direction: 'forward',
      progress: 0,
    }])
    expect(testDom.animationFrames).toHaveLength(1)
    await act(async () => {
      testDom.runAnimationFrame(120)
      await flushMicrotasks()
    })
    expect(scene.renderedStates).toHaveLength(2)
    await act(async () => testDom.runAnimationFrame(136))
    expect(scene.renderedStates).toHaveLength(2)
    await act(async () => testDom.runAnimationFrame(154))
    expect(scene.renderedStates).toHaveLength(3)
    expect(testDom.animationFrames).toHaveLength(1)
    await mounted.unmount()
    expect(testDom.animationFrames).toHaveLength(0)
    expect(scene.dispose).toHaveBeenCalledOnce()
  })

  it('resumes RAF from the original wall-clock origin after in-view and visibility pauses', async () => {
    const transition = beginPricingTransition(
      createPricingMotionState(),
      pricingPlans.map((plan) => plan.key),
    )
    testDom.setNow(1000)
    const mounted = await mountStage({ motionState: transition })
    const scene = pricingSceneHarness.instances[0]

    expect(testDom.animationFrames).toHaveLength(1)
    await act(async () => {
      testDom.runAnimationFrame(1200)
      await flushMicrotasks()
    })
    expect(scene.renderedStates).toHaveLength(1)
    expect((scene.renderedStates[0] as { progress: number }).progress).toBeCloseTo(200 / 1350)

    testDom.setNow(1500)
    await mounted.render({ inView: false })
    expect(testDom.animationFrames).toHaveLength(0)
    expect(testDom.cancelAnimationFrame).toHaveBeenCalledTimes(1)

    testDom.setNow(1800)
    await mounted.render({ inView: true })
    expect(testDom.animationFrames).toHaveLength(1)
    await act(async () => {
      testDom.runAnimationFrame(1800)
      await flushMicrotasks()
    })
    expect((scene.renderedStates[1] as { progress: number }).progress).toBeCloseTo(800 / 1350)

    testDom.setNow(1850)
    await act(async () => {
      testDom.document.visibilityState = 'hidden'
      testDom.document.dispatchEvent(new Event('visibilitychange'))
      await flushMicrotasks()
    })
    expect(testDom.animationFrames).toHaveLength(0)

    testDom.setNow(2000)
    await act(async () => {
      testDom.document.visibilityState = 'visible'
      testDom.document.dispatchEvent(new Event('visibilitychange'))
      await flushMicrotasks()
    })
    expect(testDom.animationFrames).toHaveLength(1)
    await act(async () => {
      testDom.runAnimationFrame(2000)
      await flushMicrotasks()
    })
    expect((scene.renderedStates[2] as { progress: number }).progress).toBeCloseTo(1000 / 1350)

    await mounted.unmount()
    expect(testDom.animationFrames).toHaveLength(0)
    expect(testDom.cancelAnimationFrame).toHaveBeenCalledTimes(3)
  })

  it('disconnects ResizeObserver and removes its visibility listener on unmount', async () => {
    const mounted = await mountStage()
    const observer = testDom.resizeObservers[0]

    expect(observer.observe).toHaveBeenCalledOnce()
    expect(testDom.document.listenerCount('visibilitychange')).toBe(1)
    await mounted.unmount()

    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(testDom.document.listenerCount('visibilitychange')).toBe(0)
  })

  it('unmounts before initialization resolves without late state and disposes once', async () => {
    const initialization = createDeferred<void>()
    const onFallback = vi.fn()
    pricingSceneHarness.setInitialization(initialization.promise)
    const mounted = await mountStage({ onFallback })
    const scene = pricingSceneHarness.instances[0]

    await mounted.unmount()
    expect(scene.dispose).toHaveBeenCalledOnce()

    await act(async () => {
      initialization.resolve()
      await flushMicrotasks()
    })

    expect(scene.renderedStates).toHaveLength(0)
    expect(onFallback).not.toHaveBeenCalled()
    expect(scene.dispose).toHaveBeenCalledOnce()
  })

  it('lets Scene self-dispose once when pending initialization rejects after unmount', async () => {
    const initialization = createDeferred<void>()
    const onFallback = vi.fn()
    pricingSceneHarness.setInitialization(initialization.promise)
    const mounted = await mountStage({ onFallback })
    const scene = pricingSceneHarness.instances[0]

    await mounted.unmount()
    expect(scene.dispose).toHaveBeenCalledOnce()

    await act(async () => {
      initialization.reject(new Error('late renderer failure'))
      await flushMicrotasks()
    })

    expect(scene.dispose).toHaveBeenCalledOnce()
    expect(scene.renderedStates).toHaveLength(0)
    expect(onFallback).not.toHaveBeenCalled()
  })

  it('does not leave the first Scene live across a StrictMode setup-cleanup-remount cycle', async () => {
    const initialization = createDeferred<void>()
    pricingSceneHarness.setInitialization(initialization.promise)
    const mounted = await mountStage({}, true)
    const [firstScene, secondScene] = pricingSceneHarness.instances

    expect(pricingSceneHarness.instances).toHaveLength(2)
    expect(firstScene.disposed).toBe(true)
    expect(firstScene.dispose).toHaveBeenCalledOnce()
    expect(secondScene.disposed).toBe(false)
    expect(secondScene.dispose).not.toHaveBeenCalled()

    await mounted.unmount()
    expect(secondScene.dispose).toHaveBeenCalledOnce()

    await act(async () => {
      initialization.resolve()
      await flushMicrotasks()
    })
    expect(firstScene.dispose).toHaveBeenCalledOnce()
    expect(secondScene.dispose).toHaveBeenCalledOnce()
  })

  it('uses Scene-owned disposal once when initialization rejects', async () => {
    const initialization = createDeferred<void>()
    const onFallback = vi.fn()
    pricingSceneHarness.setInitialization(initialization.promise)
    const mounted = await mountStage({ onFallback })
    const scene = pricingSceneHarness.instances[0]

    await act(async () => {
      initialization.reject(new Error('renderer unavailable'))
      await flushMicrotasks()
    })

    expect(onFallback).toHaveBeenCalledOnce()
    expect(scene.dispose).toHaveBeenCalledOnce()
    expect(findElementByClassName(mounted.container, 'pricing-webgl-stage')?.getAttribute(
      'data-fallback',
    )).toBe('true')

    await mounted.unmount()
    expect(scene.dispose).toHaveBeenCalledOnce()
  })

  it('contains a throwing fallback consumer after initialization rejection', async () => {
    const initialization = createDeferred<void>()
    const onFallback = vi.fn(() => {
      throw new Error('consumer fallback failed')
    })
    pricingSceneHarness.setInitialization(initialization.promise)
    const mounted = await mountStage({ onFallback })
    const scene = pricingSceneHarness.instances[0]

    await act(async () => {
      initialization.reject(new Error('renderer unavailable'))
      await flushMicrotasks()
    })

    expect(onFallback).toHaveBeenCalledOnce()
    expect(scene.dispose).toHaveBeenCalledOnce()
    expect(findElementByClassName(mounted.container, 'pricing-webgl-stage')?.getAttribute(
      'data-fallback',
    )).toBe('true')

    await mounted.unmount()
    expect(scene.dispose).toHaveBeenCalledOnce()
  })

  it('uses Scene-owned disposal once after the context callback', async () => {
    const onFallback = vi.fn()
    const mounted = await mountStage({ onFallback })
    const scene = pricingSceneHarness.instances[0]

    await act(async () => {
      scene.loseContext()
      await flushMicrotasks()
    })

    expect(onFallback).toHaveBeenCalledOnce()
    expect(scene.dispose).toHaveBeenCalledOnce()
    expect(findElementByClassName(mounted.container, 'pricing-webgl-stage')?.getAttribute(
      'data-fallback',
    )).toBe('true')

    await mounted.unmount()
    expect(scene.dispose).toHaveBeenCalledOnce()
  })

  it('keeps overlay controls enabled when context loss reveals the HTML fallback', async () => {
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)

    await act(async () => {
      root.render(
        <PricingOrbit
          plans={pricingPlans}
          motionState={createPricingMotionState()}
          inView
          prefersReducedMotion={false}
          onSelect={vi.fn()}
        />,
      )
      await flushMicrotasks()
    })

    await act(async () => {
      pricingSceneHarness.instances[0].loseContext()
      await flushMicrotasks()
    })

    const controls = findElementsByClassName(container as unknown as TestNode, 'pricing-orbit-hit-area')
    const fallback = findElementByClassName(container as unknown as TestNode, 'pricing-orbit-fallback')
    expect(controls).toHaveLength(3)
    expect(controls.every((control) => !control.hasAttribute('disabled'))).toBe(true)
    expect(fallback?.getAttribute('data-visible')).toBe('true')

    await act(async () => root.unmount())
    mountedRoots.delete(root)
  })

  it('writes the shared width-and-height projection into active hit-area CSS variables', async () => {
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)

    await act(async () => {
      root.render(
        <PricingOrbit
          plans={pricingPlans}
          motionState={createPricingMotionState()}
          inView
          prefersReducedMotion={false}
          onSelect={vi.fn()}
        />,
      )
      await flushMicrotasks()
    })

    const orbit = findElementByClassName(container as unknown as TestNode, 'pricing-orbit')
    const projected = projectExpectedHoldFrame(orbit?.clientWidth ?? 1, orbit?.clientHeight ?? 1)

    expect(orbit?.style.setProperty).toHaveBeenCalledWith(
      '--pricing-active-hit-width',
      `${projected.width}px`,
    )
    expect(orbit?.style.setProperty).toHaveBeenCalledWith(
      '--pricing-active-hit-height',
      `${projected.height}px`,
    )

    await act(async () => root.unmount())
    mountedRoots.delete(root)
  })

  it('keeps the contact shadow center 8px below the projected active-card bottom', async () => {
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)

    await act(async () => {
      root.render(
        <PricingOrbit
          plans={pricingPlans}
          motionState={createPricingMotionState()}
          inView
          prefersReducedMotion={false}
          onSelect={vi.fn()}
        />,
      )
      await flushMicrotasks()
    })

    const orbit = findElementByClassName(container as unknown as TestNode, 'pricing-orbit')
    const observer = testDom.resizeObservers.find(({ observe }) => (
      observe.mock.calls.some(([target]) => target === orbit)
    ))

    expect(orbit).toBeDefined()
    expect(observer).toBeDefined()

    for (const [width, height] of [
      [390, 570],
      [440, 570],
      [480, 570],
      [560, 570],
      [561, 650],
    ] as const) {
      const projected = projectExpectedHoldFrame(width, height)
      const expectedShadowOffset = projected.height / 2 + 8

      await act(async () => {
        observer?.callback([{
          contentRect: { width, height },
        } as ResizeObserverEntry], observer as unknown as ResizeObserver)
        await flushMicrotasks()
      })

      expect(orbit?.style.setProperty).toHaveBeenLastCalledWith(
        '--pricing-contact-shadow-top',
        `calc(50% + ${expectedShadowOffset}px)`,
      )
      expect(height / 2 + expectedShadowOffset - (height / 2 + projected.height / 2))
        .toBeCloseTo(8, 10)
    }

    await act(async () => root.unmount())
    mountedRoots.delete(root)
  })

  it('settles a transitioning parent and re-enables controls on renderer failure', async () => {
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)
    vi.useFakeTimers()

    await act(async () => {
      root.render(<PricingSection />)
      await flushMicrotasks()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500)
      await flushMicrotasks()
    })

    const orbit = findElementByClassName(container as unknown as TestNode, 'pricing-orbit')
    expect(orbit?.getAttribute('data-motion-phase')).toBe('transitioning')
    expect(findElementsByClassName(container as unknown as TestNode, 'pricing-orbit-hit-area')
      .every((button) => button.hasAttribute('disabled'))).toBe(true)

    await act(async () => {
      pricingSceneHarness.instances[0].loseContext()
      await flushMicrotasks()
    })

    expect(orbit?.getAttribute('data-motion-phase')).toBe('holding')
    expect(orbit?.getAttribute('data-motion-sequence')).toBe('1')
    const controls = findElementsByClassName(container as unknown as TestNode, 'pricing-orbit-hit-area')
    expect(controls.every((button) => !button.hasAttribute('disabled'))).toBe(true)

    const studioButton = controls.find((button) => button.getAttribute('data-plan') === 'studio')
    await act(async () => {
      studioButton?.dispatchEvent(new Event('click', { bubbles: true }))
      await flushMicrotasks()
    })
    expect(orbit?.getAttribute('data-motion-phase')).toBe('transitioning')
    expect(orbit?.getAttribute('data-motion-sequence')).toBe('2')

    await act(async () => root.unmount())
    mountedRoots.delete(root)
  })

  it('restarts the full 4500ms hold after fallback settles a transition', async () => {
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)
    vi.useFakeTimers()

    await act(async () => {
      root.render(<PricingSection />)
      await flushMicrotasks()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4500)
      await flushMicrotasks()
    })

    const orbit = findElementByClassName(container as unknown as TestNode, 'pricing-orbit')
    expect(orbit?.getAttribute('data-motion-phase')).toBe('transitioning')

    await act(async () => {
      pricingSceneHarness.instances[0].loseContext()
      await flushMicrotasks()
    })
    expect(orbit?.getAttribute('data-motion-phase')).toBe('holding')
    expect(orbit?.getAttribute('data-motion-sequence')).toBe('1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4499)
      await flushMicrotasks()
    })
    expect(orbit?.getAttribute('data-motion-phase')).toBe('holding')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
      await flushMicrotasks()
    })
    expect(orbit?.getAttribute('data-motion-phase')).toBe('transitioning')
    expect(orbit?.getAttribute('data-motion-sequence')).toBe('2')

    await act(async () => root.unmount())
    mountedRoots.delete(root)
  })

  it('freezes the parent carousel while a valid development frame override is active', async () => {
    testDom.window.location.search = '?pricing-progress=0.55&pricing-direction=backward'
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)
    vi.useFakeTimers()

    await act(async () => {
      root.render(<PricingSection />)
      await flushMicrotasks()
    })

    const orbit = findElementByClassName(container as unknown as TestNode, 'pricing-orbit')
    const motionStage = findElementByClassName(container as unknown as TestNode, 'pricing-motion-stage')
    const proControl = findElementsByClassName(
      container as unknown as TestNode,
      'pricing-orbit-hit-area',
    ).find((control) => control.getAttribute('data-plan') === 'pro')

    expect(motionStage?.getAttribute('data-auto-paused')).toBe('true')
    expect(proControl?.getAttribute('data-selected')).toBe('true')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000)
      await flushMicrotasks()
    })

    expect(orbit?.getAttribute('data-motion-phase')).toBe('holding')
    expect(orbit?.getAttribute('data-motion-sequence')).toBe('0')
    expect(proControl?.getAttribute('data-selected')).toBe('true')
    expect(pricingSceneHarness.instances[0].renderedStates.at(-1)).toEqual({
      activeIndex: 1,
      targetIndex: 2,
      direction: 'backward',
      progress: 0.55,
    })

    await act(async () => root.unmount())
    mountedRoots.delete(root)
  })

  it('keeps HTML fallback hidden while renderer initialization is pending', async () => {
    const initialization = createDeferred<void>()
    pricingSceneHarness.setInitialization(initialization.promise)
    const { createRoot } = await import('react-dom/client')
    const container = testDom.document.createElement('div')
    testDom.document.body.appendChild(container)
    const root = createRoot(container as unknown as HTMLElement)
    mountedRoots.add(root)

    await act(async () => {
      root.render(
        <PricingOrbit
          plans={pricingPlans}
          motionState={createPricingMotionState()}
          inView
          prefersReducedMotion={false}
          onSelect={vi.fn()}
        />,
      )
      await flushMicrotasks()
    })

    const stage = findElementByClassName(container as unknown as TestNode, 'pricing-webgl-stage')
    const fallback = findElementByClassName(container as unknown as TestNode, 'pricing-orbit-fallback')
    expect(stage?.getAttribute('data-render-mode')).toBe('pending')
    expect(stage?.getAttribute('data-fallback')).toBe('false')
    expect(fallback?.getAttribute('data-visible')).toBe('false')
    expect(fallback?.hasAttribute('hidden')).toBe(true)

    await act(async () => root.unmount())
    mountedRoots.delete(root)
  })
})

type TestEventListener = EventListenerOrEventListenerObject

class TestEventTarget {
  private readonly listeners = new Map<string, Set<TestEventListener>>()

  addEventListener(type: string, listener: TestEventListener | null) {
    if (!listener) return
    const listeners = this.listeners.get(type) ?? new Set<TestEventListener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: TestEventListener | null) {
    if (!listener) return
    this.listeners.get(type)?.delete(listener)
  }

  dispatchEvent(event: Event) {
    if (!event.target) {
      Object.defineProperty(event, 'target', { configurable: true, value: this })
    }
    this.listeners.get(event.type)?.forEach((listener) => {
      if (typeof listener === 'function') listener.call(this, event)
      else listener.handleEvent(event)
    })
    const parentNode = (this as unknown as TestNode).parentNode
    if (event.bubbles && parentNode) {
      parentNode.dispatchEvent(event)
    }
    return !event.defaultPrevented
  }

  listenerCount(type: string) {
    return this.listeners.get(type)?.size ?? 0
  }
}

class TestNode extends TestEventTarget {
  parentNode: TestNode | null = null
  childNodes: TestNode[] = []
  nodeValue: string | null = null
  private text = ''

  constructor(
    readonly nodeType: number,
    readonly nodeName: string,
    public ownerDocument: TestDocument,
  ) {
    super()
  }

  get firstChild(): TestNode | null {
    return this.childNodes[0] ?? null
  }

  get lastChild(): TestNode | null {
    return this.childNodes.at(-1) ?? null
  }

  get nextSibling(): TestNode | null {
    if (!this.parentNode) return null
    const index = this.parentNode.childNodes.indexOf(this)
    return this.parentNode.childNodes[index + 1] ?? null
  }

  get parentElement(): TestElement | null {
    return this.parentNode instanceof TestElement ? this.parentNode : null
  }

  get textContent() {
    return this.text
  }

  set textContent(value: string) {
    this.text = value
    this.childNodes.forEach((child) => {
      child.parentNode = null
    })
    this.childNodes = []
  }

  appendChild<T extends TestNode>(child: T): T {
    child.parentNode?.removeChild(child)
    child.parentNode = this
    this.childNodes.push(child)
    return child
  }

  insertBefore<T extends TestNode>(child: T, before: TestNode | null): T {
    if (before === null) return this.appendChild(child)
    child.parentNode?.removeChild(child)
    const index = this.childNodes.indexOf(before)
    child.parentNode = this
    this.childNodes.splice(index < 0 ? this.childNodes.length : index, 0, child)
    return child
  }

  removeChild<T extends TestNode>(child: T): T {
    const index = this.childNodes.indexOf(child)
    if (index >= 0) this.childNodes.splice(index, 1)
    child.parentNode = null
    return child
  }

  contains(node: TestNode | null): boolean {
    if (!node) return false
    if (node === this) return true
    return this.childNodes.some((child) => child.contains(node))
  }
}

class TestTextNode extends TestNode {
  constructor(value: string, ownerDocument: TestDocument) {
    super(3, '#text', ownerDocument)
    this.nodeValue = value
  }
}

class TestElement extends TestNode {
  readonly attributes = new Map<string, string>()
  readonly namespaceURI: string
  readonly tagName: string
  readonly style = {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
  }
  clientWidth = 800
  clientHeight = 600

  constructor(tagName: string, ownerDocument: TestDocument, namespaceURI = 'http://www.w3.org/1999/xhtml') {
    super(1, tagName.toUpperCase(), ownerDocument)
    this.tagName = tagName.toUpperCase()
    this.namespaceURI = namespaceURI
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, String(value))
  }

  removeAttribute(name: string) {
    this.attributes.delete(name)
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }

  hasAttribute(name: string) {
    return this.attributes.has(name)
  }
}

class TestDocument extends TestNode {
  readonly documentElement: TestElement
  readonly body: TestElement
  activeElement: TestElement | null
  defaultView: object | null = null
  visibilityState: DocumentVisibilityState = 'visible'

  constructor() {
    super(9, '#document', null as unknown as TestDocument)
    this.ownerDocument = this
    this.documentElement = new TestElement('html', this)
    this.body = new TestElement('body', this)
    this.documentElement.appendChild(this.body)
    this.appendChild(this.documentElement)
    this.activeElement = this.body
  }

  createElement(tagName: string) {
    return new TestElement(tagName, this)
  }

  createElementNS(namespaceURI: string, tagName: string) {
    return new TestElement(tagName, this, namespaceURI)
  }

  createTextNode(value: string) {
    return new TestTextNode(value, this)
  }

  createComment(value: string) {
    const comment = new TestNode(8, '#comment', this)
    comment.nodeValue = value
    return comment
  }
}

function installTestDom() {
  const savedGlobals = new Map<string, PropertyDescriptor | undefined>()
  const document = new TestDocument()
  const windowTarget = new TestEventTarget()
  const animationFrames = new Map<number, FrameRequestCallback>()
  let nextFrameId = 1
  let now = 0
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const frameId = nextFrameId++
    animationFrames.set(frameId, callback)
    return frameId
  })
  const cancelAnimationFrame = vi.fn((frameId: number) => {
    animationFrames.delete(frameId)
  })
  const resizeObservers: Array<{
    callback: ResizeObserverCallback
    disconnect: ReturnType<typeof vi.fn>
    observe: ReturnType<typeof vi.fn>
  }> = []

  class TestResizeObserver {
    readonly disconnect = vi.fn()
    readonly observe = vi.fn()
    readonly unobserve = vi.fn()

    constructor(readonly callback: ResizeObserverCallback) {
      resizeObservers.push(this)
    }
  }

  class TestHtmlIFrameElement extends TestElement {}

  const testWindow = Object.assign(windowTarget, {
    HTMLIFrameElement: TestHtmlIFrameElement,
    HTMLElement: TestElement,
    HTMLCanvasElement: TestElement,
    SVGElement: TestElement,
    Element: TestElement,
    Node: TestNode,
    Text: TestTextNode,
    document,
    devicePixelRatio: 2,
    event: undefined,
    getSelection: () => null,
    location: { protocol: 'http:', search: '' },
    navigator: { userAgent: 'vitest' },
    matchMedia: () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout: (handler: (...args: any[]) => void, timeout?: number, ...args: any[]) => (
      globalThis.setTimeout(handler, timeout, ...args)
    ),
    clearTimeout: (handle: number | ReturnType<typeof globalThis.setTimeout>) => (
      globalThis.clearTimeout(handle)
    ),
  })
  document.defaultView = testWindow

  const installGlobal = (name: string, value: unknown) => {
    savedGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    })
  }

  installGlobal('window', testWindow)
  installGlobal('document', document)
  installGlobal('Node', TestNode)
  installGlobal('Element', TestElement)
  installGlobal('HTMLElement', TestElement)
  installGlobal('HTMLCanvasElement', TestElement)
  installGlobal('SVGElement', TestElement)
  installGlobal('ResizeObserver', TestResizeObserver)
  installGlobal('requestAnimationFrame', requestAnimationFrame)
  installGlobal('cancelAnimationFrame', cancelAnimationFrame)
  installGlobal('performance', { now: () => now })
  installGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  return {
    animationFrames,
    cancelAnimationFrame,
    document,
    requestAnimationFrame,
    resizeObservers,
    window: testWindow,
    runAnimationFrame(timestamp: number) {
      now = timestamp
      const nextFrame = animationFrames.entries().next().value as
        | [number, FrameRequestCallback]
        | undefined
      if (!nextFrame) throw new Error('No animation frame is scheduled')

      animationFrames.delete(nextFrame[0])
      nextFrame[1](timestamp)
    },
    setNow(timestamp: number) {
      now = timestamp
    },
    restore() {
      Array.from(savedGlobals.entries()).reverse().forEach(([name, descriptor]) => {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor)
        else Reflect.deleteProperty(globalThis, name)
      })
    },
  }
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

function findElementByClassName(root: TestNode, className: string): TestElement | null {
  if (
    root instanceof TestElement
    && root.getAttribute('class')?.split(/\s+/).includes(className)
  ) {
    return root
  }

  for (const child of root.childNodes) {
    const match = findElementByClassName(child, className)
    if (match) return match
  }
  return null
}

function findElementsByClassName(root: TestNode, className: string): TestElement[] {
  const matches: TestElement[] = []
  if (
    root instanceof TestElement
    && root.getAttribute('class')?.split(/\s+/).includes(className)
  ) {
    matches.push(root)
  }

  for (const child of root.childNodes) matches.push(...findElementsByClassName(child, className))
  return matches
}
