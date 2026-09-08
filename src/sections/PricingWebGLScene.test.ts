// @ts-expect-error Vitest runs in Node, while the app tsconfig intentionally omits Node types.
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const threeHarness = vi.hoisted(() => {
  class FakeVector2 {
    constructor(public x = 0, public y = 0) {}

    set(x: number, y: number) {
      this.x = x
      this.y = y
      return this
    }
  }

  class FakeVector3 {
    constructor(public x = 0, public y = 0, public z = 0) {}

    set(x: number, y: number, z: number) {
      this.x = x
      this.y = y
      this.z = z
      return this
    }

    setScalar(value: number) {
      return this.set(value, value, value)
    }
  }

  class FakeObject3D {
    position = new FakeVector3()
    rotation = { y: 0, z: 0 }
    scale = new FakeVector3(1, 1, 1)
    renderOrder = 0
  }

  class FakePlaneGeometry {
    disposed = false

    constructor(
      public readonly width: number,
      public readonly height: number,
      public readonly widthSegments: number,
      public readonly heightSegments: number,
    ) {
      geometryInstances.push(this)
    }

    dispose() {
      this.disposed = true
    }
  }

  class FakeShaderMaterial {
    opacity = 1
    disposed = false
    readonly uniforms: Record<string, { value: unknown }>
    readonly transparent: boolean
    readonly depthTest: boolean
    readonly depthWrite: boolean
    readonly blending: unknown
    readonly fragmentShader: string

    constructor(options: {
      uniforms: Record<string, { value: unknown }>
      transparent: boolean
      depthTest: boolean
      depthWrite: boolean
      blending: unknown
      fragmentShader: string
    }) {
      this.uniforms = options.uniforms
      this.transparent = options.transparent
      this.depthTest = options.depthTest
      this.depthWrite = options.depthWrite
      this.blending = options.blending
      this.fragmentShader = options.fragmentShader
      materialInstances.push(this)
    }

    dispose() {
      this.disposed = true
    }
  }

  class FakeMesh extends FakeObject3D {
    visible = true
    constructor(
      public readonly geometry: FakePlaneGeometry,
      public readonly material: FakeShaderMaterial,
    ) {
      super()
      meshInstances.push(this)
    }
  }

  class FakeCanvasTexture {
    colorSpace: unknown
    needsUpdate = false
    disposed = false

    constructor(public readonly image: HTMLCanvasElement) {
      textureInstances.push(this)
    }

    dispose() {
      this.disposed = true
    }
  }

  class FakeScene {
    readonly children: FakeMesh[] = []

    add(...objects: FakeMesh[]) {
      this.children.push(...objects)
    }

    clear() {
      this.children.length = 0
    }
  }

  class FakePerspectiveCamera extends FakeObject3D {
    projectionUpdates = 0

    constructor(
      public readonly fov: number,
      public aspect: number,
      public readonly near: number,
      public readonly far: number,
    ) {
      super()
      cameraInstances.push(this)
    }

    updateProjectionMatrix() {
      this.projectionUpdates += 1
    }
  }

  class FakeWebGLRenderer {
    outputColorSpace: unknown
    pixelRatio = 1
    size = { width: 0, height: 0, updateStyle: true }
    renderCalls = 0
    disposed = false
    clear = { color: 0, alpha: 1 }
    readonly capabilities = { getMaxAnisotropy: () => 4 }

    constructor(public readonly options: Record<string, unknown>) {
      rendererInstances.push(this)
    }

    setClearColor(color: number, alpha: number) {
      this.clear = { color, alpha }
    }

    setPixelRatio(pixelRatio: number) {
      this.pixelRatio = pixelRatio
    }

    setSize(width: number, height: number, updateStyle = true) {
      this.size = { width, height, updateStyle }
    }

    render() {
      this.renderCalls += 1
    }

    dispose() {
      this.disposed = true
    }
  }

  const meshInstances: FakeMesh[] = []
  const rendererInstances: FakeWebGLRenderer[] = []
  const cameraInstances: FakePerspectiveCamera[] = []
  const geometryInstances: FakePlaneGeometry[] = []
  const materialInstances: FakeShaderMaterial[] = []
  const textureInstances: FakeCanvasTexture[] = []

  return {
    FakeCanvasTexture,
    FakeMesh,
    FakePerspectiveCamera,
    FakePlaneGeometry,
    FakeScene,
    FakeShaderMaterial,
    FakeVector2,
    FakeWebGLRenderer,
    cameraInstances,
    geometryInstances,
    materialInstances,
    rendererInstances,
    meshInstances,
    textureInstances,
  }
})

const textureHarness = vi.hoisted(() => ({
  createPricingCardCanvas: vi.fn(async () => ({}) as HTMLCanvasElement),
}))

vi.mock('three', () => ({
  CanvasTexture: threeHarness.FakeCanvasTexture,
  DoubleSide: 'DoubleSide',
  LinearFilter: 'LinearFilter',
  Mesh: threeHarness.FakeMesh,
  NormalBlending: 'NormalBlending',
  PerspectiveCamera: threeHarness.FakePerspectiveCamera,
  PlaneGeometry: threeHarness.FakePlaneGeometry,
  Scene: threeHarness.FakeScene,
  ShaderMaterial: threeHarness.FakeShaderMaterial,
  SRGBColorSpace: 'SRGBColorSpace',
  Vector2: threeHarness.FakeVector2,
  WebGLRenderer: threeHarness.FakeWebGLRenderer,
}))

vi.mock('./pricingCardTexture', () => ({
  PRICING_TEXTURE_HEIGHT: 1356,
  PRICING_TEXTURE_WIDTH: 1024,
  createPricingCardCanvas: textureHarness.createPricingCardCanvas,
  createPricingReflectionCanvas: (source: HTMLCanvasElement) => source,
}))

import { pricingPlans } from './pricingData'
import * as pricingSceneModule from './PricingWebGLScene'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  PricingWebGLScene,
  resolvePricingPlanIndex,
} from './PricingWebGLScene'

const source = readFileSync(new URL('./PricingWebGLScene.ts', import.meta.url), 'utf8')

class EventCanvas {
  readonly listeners = new Map<string, Set<EventListener>>()
  addCalls = 0
  removeCalls = 0
  width = 0
  height = 0
  clientWidth = 0
  clientHeight = 0

  addEventListener(type: string, listener: EventListener) {
    this.addCalls += 1
    const listeners = this.listeners.get(type) ?? new Set<EventListener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: EventListener) {
    this.removeCalls += 1
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(type: string, event: Event) {
    this.listeners.get(type)?.forEach((listener) => listener(event))
  }
}

describe('PricingWebGLScene source contract', () => {
  it('uses exactly three rigid planes and isolated pricing resources', () => {
    expect(source).toContain('new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 1, 1)')
    expect(source).toContain('new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 48, 24)')
    expect(source).toContain('const PLANE_SLOTS = [-1, 0, 1] as const')
    expect(source).not.toContain('uFold')
    expect(source).not.toContain('uWave')
    expect(source).not.toContain('uPinch')
    expect(source).toContain('uCardYaw')
    expect(source).toContain('mesh.rotation.z =')
    expect(source).toContain('uReflectionSide')
    expect(source).toContain('uPhase')
    expect(source).toContain('uTime')
    expect(source).toContain('new WebGLRenderer')
    expect(source).not.toContain('CosmicScene')
    expect(source).not.toContain('requestAnimationFrame')
  })

  it('projects one shared hold frame across every mobile fit-axis boundary', () => {
    type HoldFrame = {
      cameraDistance: number
      fitAxis: 'height' | 'width'
      height: number
      safeInset: number
      width: number
    }
    const getPricingHoldFrame = (
      pricingSceneModule as unknown as {
        getPricingHoldFrame?: (width: number, height: number) => HoldFrame
      }
    ).getPricingHoldFrame

    expect(getPricingHoldFrame).toBeTypeOf('function')
    if (!getPricingHoldFrame) return

    const cases = [
      { width: 390, height: 570, fitAxis: 'width' as const, safeInset: 16, cardWidth: 275.3846153846, cardHeight: 364.6694711538 },
      { width: 440, height: 570, fitAxis: 'height' as const, safeInset: 16, cardWidth: 312.5209893351, cardHeight: 413.8461538462 },
      { width: 480, height: 570, fitAxis: 'height' as const, safeInset: 16, cardWidth: 312.5209893351, cardHeight: 413.8461538462 },
      { width: 560, height: 570, fitAxis: 'height' as const, safeInset: 16, cardWidth: 312.5209893351, cardHeight: 413.8461538462 },
      { width: 561, height: 650, fitAxis: 'height' as const, safeInset: 0, cardWidth: 377.581120944, cardHeight: 500 },
    ]

    for (const expected of cases) {
      const frame = getPricingHoldFrame(expected.width, expected.height)

      expect(frame.fitAxis).toBe(expected.fitAxis)
      expect(frame.safeInset).toBe(expected.safeInset)
      expect(frame.width).toBeCloseTo(expected.cardWidth, 8)
      expect(frame.height).toBeCloseTo(expected.cardHeight, 8)
      expect(frame.width / frame.height).toBeCloseTo(CARD_WIDTH / CARD_HEIGHT, 10)
      expect(frame.cameraDistance).toBeGreaterThan(0)
    }
  })

  it('configures a transparent sRGB renderer with explicit depth ordering', () => {
    expect(source).toContain('alpha: true')
    expect(source).toContain('outputColorSpace = SRGBColorSpace')
    expect(source).toContain('depthWrite: false')
    expect(source).toContain('NormalBlending')
    expect(source).toContain('renderOrder')
  })

  it('disposes every GPU resource and loses no event listeners', () => {
    expect(source).toContain("event.preventDefault()")
    expect(source).toContain("removeEventListener('webglcontextlost'")
    expect(source).toContain('.geometry.dispose()')
    expect(source).toContain('.material.dispose()')
    expect(source).toContain('.texture.dispose()')
    expect(source).toContain('this.renderer.dispose()')
  })
})

describe('pricing ribbon texture mapping', () => {
  it('maps every stable slot with the required modular formula', () => {
    expect([-1, 0, 1].map((slot) => (
      resolvePricingPlanIndex(1, slot, pricingPlans)
    ))).toEqual([2, 1, 0])
  })

  it('keeps each texture attached to its physical plane during a turn', () => {
    expect([-1, 0, 1].map((slot) => (
      resolvePricingPlanIndex(0, slot, pricingPlans)
    ))).toEqual([1, 0, 2])
  })
})

describe('PricingWebGLScene lifecycle', () => {
  beforeEach(() => {
    threeHarness.meshInstances.length = 0
    threeHarness.rendererInstances.length = 0
    threeHarness.cameraInstances.length = 0
    threeHarness.geometryInstances.length = 0
    threeHarness.materialInstances.length = 0
    threeHarness.textureInstances.length = 0
    textureHarness.createPricingCardCanvas.mockClear()
  })

  it('initializes textures asynchronously and creates isolated materials for all passes', async () => {
    const canvas = new EventCanvas()
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 2,
      onContextLost: vi.fn(),
    })

    const firstInitialization = scene.initialize()
    const secondInitialization = scene.initialize()

    expect(secondInitialization).toBe(firstInitialization)
    await firstInitialization
    expect(textureHarness.createPricingCardCanvas).toHaveBeenCalledTimes(3)
    expect(threeHarness.textureInstances).toHaveLength(6)
    expect(threeHarness.materialInstances).toHaveLength(9)
    expect(new Set(threeHarness.materialInstances).size).toBe(9)
    expect(new Set(threeHarness.materialInstances.map(({ uniforms }) => uniforms)).size).toBe(9)
    expect(new Set(threeHarness.materialInstances.map(({ uniforms }) => (
      uniforms.uCardSize.value
    ))).size).toBe(9)
    expect(threeHarness.materialInstances.every(({ uniforms }) => {
      const size = uniforms.uCardSize.value as InstanceType<typeof threeHarness.FakeVector2>
      return size.x === CARD_WIDTH && size.y === CARD_HEIGHT
    })).toBe(true)
  })

  it('caps DPR by breakpoint and frames the mobile card inside a 16px safe area', async () => {
    const canvas = new EventCanvas()
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 2,
      onContextLost: vi.fn(),
    })
    await scene.initialize()

    scene.resize(390, 844, 3)
    const renderer = threeHarness.rendererInstances[0]
    const camera = threeHarness.cameraInstances[0]
    const cameraDistance = camera.position.z - 1.6
    const visibleHalfHeight = cameraDistance * Math.tan((camera.fov * Math.PI) / 360)
    const projectedCardWidth = 844 * CARD_WIDTH / (2 * visibleHalfHeight)
    const projectedCardHeight = 844 * CARD_HEIGHT / (2 * visibleHalfHeight)

    expect(renderer.pixelRatio).toBe(1.25)
    expect(renderer.size).toEqual({ width: 390, height: 844, updateStyle: false })
    expect(projectedCardWidth).toBeLessThanOrEqual(390 - 32 + 0.001)
    expect(projectedCardHeight).toBeLessThanOrEqual(844 - 32 + 0.001)
    const mobileFlare = threeHarness.materialInstances[4].uniforms.uReflectionFlare.value
    expect(mobileFlare).toBeGreaterThan(0)
    expect(mobileFlare).toBeLessThan(1)
    expect(threeHarness.materialInstances[5].uniforms.uReflectionFlare.value).toBe(mobileFlare)

    scene.resize(1024, 768, 3)
    expect(renderer.pixelRatio).toBe(1.5)
    expect(threeHarness.materialInstances[4].uniforms.uReflectionFlare.value).toBe(1)
  })

  it('uses options.maxDpr as an additional renderer cap', async () => {
    const canvas = new EventCanvas()
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.1,
      onContextLost: vi.fn(),
    })
    await scene.initialize()

    scene.resize(1024, 768, 3)

    expect(threeHarness.rendererInstances[0].pixelRatio).toBe(1.1)
  })

  it('extends both optical tails past the frame instead of leaving floating strips', async () => {
    const scene = new PricingWebGLScene(new EventCanvas() as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: vi.fn(),
    })
    await scene.initialize()
    for (const [width, height] of [[1280, 720], [1920, 900], [390, 570], [560, 570]]) {
      scene.resize(width, height, 1)
      const frame = pricingSceneModule.getPricingHoldFrame(width, height)
      for (const index of [4, 5]) {
        const reach = threeHarness.materialInstances[index].uniforms.uReflectionReach?.value as number
        expect(reach * frame.height).toBeGreaterThan((height - frame.height) / 2)
        expect(reach * frame.height).toBeLessThan((height - frame.height) / 2 + frame.height * 0.12)
      }
    }
    scene.dispose()
  })

  it('routes sampled material opacity into every custom shader pass', async () => {
    const canvas = new EventCanvas()
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: vi.fn(),
    })
    await scene.initialize()

    scene.render({
      activeIndex: 1,
      targetIndex: 2,
      direction: 'forward',
      progress: 0.5,
    })

    expect(threeHarness.materialInstances.every((material) => (
      material.fragmentShader.includes('uniform float uOpacity')
      && material.fragmentShader.includes('* uOpacity')
      && material.uniforms.uOpacity.value === material.opacity
    ))).toBe(true)
  })

  it('attaches each reflection to its own card edge and turn without a second clock', async () => {
    const scene = new PricingWebGLScene(new EventCanvas() as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: vi.fn(),
    })
    await scene.initialize()

    for (const direction of ['forward', 'backward'] as const) {
      for (const progress of [0, 0.2, 0.35, 0.5, 0.7, 0.9, 1]) {
        scene.render({ activeIndex: 1, targetIndex: 2, direction, progress })
        for (let index = 0; index < 9; index += 3) {
          const [card, top, bottom] = threeHarness.meshInstances.slice(index, index + 3)
          for (const [reflection, side] of [[top, 1], [bottom, -1]] as const) {
            expect(reflection.position.x).toBe(card.position.x)
            expect(reflection.position.z).toBe(card.position.z)
            expect(reflection.position.y).toBeCloseTo(side * CARD_HEIGHT * card.scale.y / 2)
            expect(reflection.scale.x).toBe(card.scale.x)
            expect(reflection.material.uniforms.uCardYaw.value).toBe(card.rotation.y)
            expect(reflection.material.uniforms.uReflectionSide.value).toBe(side)
            const originalIndex = threeHarness.textureInstances.indexOf(card.material.uniforms.uTexture.value as InstanceType<typeof threeHarness.FakeCanvasTexture>)
            expect(reflection.material.uniforms.uTexture.value).toBe(threeHarness.textureInstances[originalIndex + 3])
          }
        }
      }
    }
    scene.dispose()
  })

  it('shows the foreground reflection and removes the six-strip row at rest', async () => {
    const scene = new PricingWebGLScene(new EventCanvas() as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: vi.fn(),
    })
    await scene.initialize()
    scene.render({ activeIndex: 1, targetIndex: null, direction: 'forward', progress: 0 })
    const materials = threeHarness.materialInstances
    expect(materials[4].opacity).toBeGreaterThan(0.85)
    expect(materials[5].opacity).toBeGreaterThan(0.85)
    for (const index of [1, 2, 7, 8]) {
      expect(materials[index].opacity).toBe(0)
      expect(threeHarness.meshInstances[index].visible).toBe(false)
    }

    // After relabelling the slots at the end of a turn, brightness is identical.
    scene.render({ activeIndex: 1, targetIndex: 2, direction: 'forward', progress: 1 })
    expect(materials[7].opacity).toBeCloseTo(0.94)
    expect(materials[8].opacity).toBeCloseTo(0.94)
    expect(threeHarness.meshInstances[7].visible).toBe(true)
    expect(threeHarness.meshInstances[8].visible).toBe(true)
    expect(materials[4].opacity).toBe(0)
    expect(materials[5].opacity).toBe(0)
    scene.dispose()
  })

  it('keeps all three card textures attached while their planes exchange positions', async () => {
    const canvas = new EventCanvas()
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: vi.fn(),
    })
    await scene.initialize()

    const renderState = {
      activeIndex: 1,
      targetIndex: 2,
      direction: 'forward',
      progress: 0.26,
    } as const
    scene.render(renderState)

    const mainMaterials = [0, 3, 6].map((index) => threeHarness.materialInstances[index])
    expect(mainMaterials.map(({ uniforms }) => (
      threeHarness.textureInstances.indexOf(
        uniforms.uTexture.value as InstanceType<typeof threeHarness.FakeCanvasTexture>,
      )
    ))).toEqual([2, 1, 0])

    scene.render({ ...renderState, progress: 0.76 })
    expect(mainMaterials.map(({ uniforms }) => (
      threeHarness.textureInstances.indexOf(
        uniforms.uTexture.value as InstanceType<typeof threeHarness.FakeCanvasTexture>,
      )
    ))).toEqual([2, 1, 0])
  })

  it('does not draw a second optical sheet above the distant incoming card', async () => {
    const scene = new PricingWebGLScene(new EventCanvas() as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: vi.fn(),
    })
    await scene.initialize()
    scene.render({ activeIndex: 0, targetIndex: 2, direction: 'forward', progress: 0.35 })
    expect(threeHarness.meshInstances[4].visible).toBe(true)
    expect(threeHarness.meshInstances[7].visible).toBe(false)
    scene.render({ activeIndex: 0, targetIndex: 2, direction: 'forward', progress: 0.7 })
    expect(threeHarness.meshInstances[4].visible).toBe(false)
    expect(threeHarness.meshInstances[7].visible).toBe(true)
    scene.dispose()
    expect(threeHarness.textureInstances).toHaveLength(6)
    expect(threeHarness.textureInstances.every(({ disposed }) => disposed)).toBe(true)
  })

  it('prevents context loss, reports it once, stops rendering, and disposes idempotently', async () => {
    const canvas = new EventCanvas()
    const onContextLost = vi.fn()
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost,
    })
    await scene.initialize()

    scene.render({
      activeIndex: 1,
      targetIndex: 2,
      direction: 'forward',
      progress: 0.5,
    })
    const renderer = threeHarness.rendererInstances[0]
    expect(renderer.renderCalls).toBe(1)

    const contextLostEvent = { preventDefault: vi.fn() } as unknown as Event
    canvas.dispatch('webglcontextlost', contextLostEvent)
    canvas.dispatch('webglcontextlost', contextLostEvent)
    scene.render({
      activeIndex: 1,
      targetIndex: 2,
      direction: 'forward',
      progress: 0.7,
    })
    scene.dispose()

    expect(contextLostEvent.preventDefault).toHaveBeenCalledOnce()
    expect(onContextLost).toHaveBeenCalledOnce()
    expect(renderer.renderCalls).toBe(1)
    expect(canvas.addCalls).toBe(1)
    expect(canvas.removeCalls).toBe(1)
    expect(renderer.disposed).toBe(true)
    expect(threeHarness.textureInstances.every(({ disposed }) => disposed)).toBe(true)
    expect(threeHarness.materialInstances.every(({ disposed }) => disposed)).toBe(true)
  })

  it('does not dispose twice when pending initialization rejects after context loss', async () => {
    let rejectTextures: ((reason?: unknown) => void) | undefined
    const pendingTexture = new Promise<HTMLCanvasElement>((_resolve, reject) => {
      rejectTextures = reject
    })
    for (let index = 0; index < pricingPlans.length; index += 1) {
      textureHarness.createPricingCardCanvas.mockImplementationOnce(() => pendingTexture)
    }

    const canvas = new EventCanvas()
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: vi.fn(),
    })
    const dispose = vi.spyOn(scene, 'dispose')
    const initialization = scene.initialize()
    const renderer = threeHarness.rendererInstances[0]

    canvas.dispatch(
      'webglcontextlost',
      { preventDefault: vi.fn() } as unknown as Event,
    )
    expect(dispose).toHaveBeenCalledOnce()
    expect(canvas.removeCalls).toBe(1)
    expect(renderer.disposed).toBe(true)

    rejectTextures?.(new Error('late texture failure'))
    await expect(initialization).rejects.toThrow('late texture failure')

    expect(dispose).toHaveBeenCalledOnce()
    expect(canvas.removeCalls).toBe(1)
    expect(threeHarness.geometryInstances).toHaveLength(0)
    expect(threeHarness.textureInstances).toHaveLength(0)
  })

  it('guarantees context-loss cleanup when the callback throws', async () => {
    const canvas = new EventCanvas()
    const callbackError = new Error('fallback callback failed')
    const scene = new PricingWebGLScene(canvas as unknown as HTMLCanvasElement, pricingPlans, {
      maxDpr: 1.5,
      onContextLost: () => {
        throw callbackError
      },
    })
    await scene.initialize()

    const renderer = threeHarness.rendererInstances[0]
    const contextLostEvent = { preventDefault: vi.fn() } as unknown as Event

    expect(() => canvas.dispatch('webglcontextlost', contextLostEvent)).toThrow(callbackError)
    expect(contextLostEvent.preventDefault).toHaveBeenCalledOnce()
    expect(canvas.removeCalls).toBe(1)
    expect(renderer.disposed).toBe(true)
    expect(threeHarness.geometryInstances.every(({ disposed }) => disposed)).toBe(true)
    expect(threeHarness.materialInstances.every(({ disposed }) => disposed)).toBe(true)
    expect(threeHarness.textureInstances.every(({ disposed }) => disposed)).toBe(true)
  })
})
