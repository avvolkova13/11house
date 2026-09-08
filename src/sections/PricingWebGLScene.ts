import {
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  Mesh,
  NormalBlending,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three'

import {
  PRICING_TEXTURE_HEIGHT,
  PRICING_TEXTURE_WIDTH,
  createPricingCardCanvas,
  createPricingReflectionCanvas,
} from './pricingCardTexture'
import type { PricingPlan } from './pricingData'
import type { PricingMotionDirection } from './pricingMotion'
import {
  samplePricingPlane,
  samplePricingTurn,
  type PricingPlaneSample,
  type PricingTurnSample,
} from './pricingWebglMotion'
import {
  pricingFragmentShader,
  pricingReflectionFragmentShader,
  pricingReflectionVertexShader,
  pricingVertexShader,
} from './pricingShaders'

export const CARD_WIDTH = 4.8
export const CARD_HEIGHT = CARD_WIDTH * PRICING_TEXTURE_HEIGHT / PRICING_TEXTURE_WIDTH

const PLANE_SLOTS = [-1, 0, 1] as const
const CAMERA_FOV = 36
export const PRICING_CAMERA_FRAMING_SCALE = 1.3
const ACTIVE_CARD_Z = 1.6
const MOBILE_BREAKPOINT = 560
const MOBILE_SAFE_AREA = 16
const pricingSceneFragmentShader = addOpacityUniform(pricingFragmentShader, 'base.a')
const pricingSceneReflectionFragmentShader = addOpacityUniform(
  pricingReflectionFragmentShader,
  'blurred.a * alphaMask',
)

type PricingPlaneSlot = typeof PLANE_SLOTS[number]

export type PricingWebGLSceneOptions = {
  onContextLost: () => void
  maxDpr: number
}

export type PricingWebGLRenderState = {
  activeIndex: number
  targetIndex: number | null
  direction: PricingMotionDirection
  progress: number
}

type PricingPlaneResources = {
  readonly slot: PricingPlaneSlot
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>
  readonly topReflection: Mesh<PlaneGeometry, ShaderMaterial>
  readonly bottomReflection: Mesh<PlaneGeometry, ShaderMaterial>
}

type PricingTextureResource = {
  readonly texture: CanvasTexture
}

type SceneViewport = {
  width: number
  height: number
  dpr: number
}

export type PricingHoldFrame = Readonly<{
  cameraDistance: number
  fitAxis: 'height' | 'width'
  height: number
  safeInset: number
  width: number
}>

export function getPricingHoldFrame(width: number, height: number): PricingHoldFrame {
  const safeWidth = Math.max(1, Number.isFinite(width) ? width : 1)
  const safeHeight = Math.max(1, Number.isFinite(height) ? height : 1)
  const safeInset = safeWidth <= MOBILE_BREAKPOINT ? MOBILE_SAFE_AREA : 0
  const availableWidth = Math.max(1, safeWidth - safeInset * 2)
  const availableHeight = Math.max(1, safeHeight - safeInset * 2)
  const halfFovTangent = Math.tan(CAMERA_FOV * Math.PI / 360)
  const widthDistance = CARD_WIDTH * safeHeight / (2 * halfFovTangent * availableWidth)
  const heightDistance = CARD_HEIGHT * safeHeight / (2 * halfFovTangent * availableHeight)
  const fitAxis = widthDistance >= heightDistance ? 'width' : 'height'
  const cameraDistance = Math.max(widthDistance, heightDistance) * PRICING_CAMERA_FRAMING_SCALE
  const pixelsPerWorldUnit = safeHeight / (2 * halfFovTangent * cameraDistance)

  return Object.freeze({
    cameraDistance,
    fitAxis,
    height: CARD_HEIGHT * pixelsPerWorldUnit,
    safeInset,
    width: CARD_WIDTH * pixelsPerWorldUnit,
  })
}

export function resolvePricingPlanIndex(
  activeIndex: number,
  slot: number,
  plans: readonly PricingPlan[],
): number {
  if (plans.length === 0) return -1

  const normalizedSlot = Math.min(1, Math.max(-1, Math.trunc(slot)))
  return modulo(activeIndex - normalizedSlot, plans.length)
}

export class PricingWebGLScene {
  private readonly canvas: HTMLCanvasElement
  private readonly plans: readonly PricingPlan[]
  private readonly options: PricingWebGLSceneOptions
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 80)
  private renderer: WebGLRenderer | null = null
  private planes: readonly PricingPlaneResources[] = []
  private textures: readonly PricingTextureResource[] = []
  private reflectionTextures: readonly PricingTextureResource[] = []
  private initializationPromise: Promise<void> | null = null
  private initialized = false
  private disposed = false
  private contextLost = false
  private contextLossListenerAttached = false
  private viewport: SceneViewport

  constructor(
    canvas: HTMLCanvasElement,
    plans: PricingPlan[],
    options: PricingWebGLSceneOptions,
  ) {
    this.canvas = canvas
    this.plans = [...plans]
    this.options = options
    this.viewport = {
      width: Math.max(1, canvas.clientWidth || canvas.width || 1),
      height: Math.max(1, canvas.clientHeight || canvas.height || 1),
      dpr: 1,
    }
  }

  initialize(): Promise<void> {
    if (this.disposed || this.contextLost) return Promise.resolve()
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this.initializeResources().catch((error: unknown) => {
      if (!this.disposed) this.dispose()
      throw error
    })
    return this.initializationPromise
  }

  resize(width: number, height: number, dpr: number): void {
    if (this.disposed) return

    const safeWidth = Math.max(1, width)
    const safeHeight = Math.max(1, height)
    this.viewport = { width: safeWidth, height: safeHeight, dpr }

    const breakpointCap = safeWidth <= MOBILE_BREAKPOINT ? 1.25 : 1.5
    const configuredCap = Number.isFinite(this.options.maxDpr) && this.options.maxDpr > 0
      ? this.options.maxDpr
      : breakpointCap
    const devicePixelRatio = Number.isFinite(dpr) && dpr > 0 ? dpr : 1
    const cappedDpr = Math.min(devicePixelRatio, configuredCap, breakpointCap)

    this.renderer?.setPixelRatio(cappedDpr)
    this.renderer?.setSize(safeWidth, safeHeight, false)

    const holdFrame = getPricingHoldFrame(safeWidth, safeHeight)
    this.camera.aspect = safeWidth / safeHeight
    this.camera.position.set(0, 0, ACTIVE_CARD_Z + holdFrame.cameraDistance)
    this.camera.updateProjectionMatrix()
    this.planes.forEach(({ topReflection, bottomReflection }) => {
      for (const reflection of [topReflection, bottomReflection]) {
        reflection.material.uniforms.uReflectionFlare.value = safeWidth <= MOBILE_BREAKPOINT ? 0.4 : 1
        // Let the white frame crop the tail, including on tall, narrow screens.
        reflection.material.uniforms.uReflectionReach.value = (safeHeight / holdFrame.height - 1) * 0.5 + 0.07
      }
    })
  }

  render(state: PricingWebGLRenderState, timeSeconds = 0): void {
    if (!this.initialized || this.disposed || this.contextLost || !this.renderer) return

    const activeIndex = modulo(state.activeIndex, this.plans.length)
    const turn = samplePricingTurn(state.progress, state.direction)

    this.planes.forEach((plane) => {
      const sample = samplePricingPlane(plane.slot, turn)
      const planIndex = resolvePricingPlanIndex(
        activeIndex,
        plane.slot,
        this.plans,
      )
      const texture = this.textures[planIndex].texture
      const reflectionTexture = this.reflectionTextures[planIndex].texture

      updateMainMesh(plane.mesh, texture, sample, turn, timeSeconds)
      updateReflectionMesh(plane.topReflection, reflectionTexture, sample, turn, timeSeconds, 'top')
      updateReflectionMesh(plane.bottomReflection, reflectionTexture, sample, turn, timeSeconds, 'bottom')
    })

    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.initialized = false
    this.contextLost = true

    if (this.contextLossListenerAttached) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost)
      this.contextLossListenerAttached = false
    }

    this.planes.forEach((plane) => {
      plane.mesh.geometry.dispose()
      plane.mesh.material.dispose()
      plane.topReflection.geometry.dispose()
      plane.topReflection.material.dispose()
      plane.bottomReflection.geometry.dispose()
      plane.bottomReflection.material.dispose()
    })
    this.planes = []

    this.textures.forEach((resource) => resource.texture.dispose())
    this.textures = []
    this.reflectionTextures.forEach((resource) => resource.texture.dispose())
    this.reflectionTextures = []

    this.scene.clear()
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
  }

  private async initializeResources(): Promise<void> {
    if (this.plans.length === 0) {
      throw new Error('PricingWebGLScene requires at least one pricing plan')
    }

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.setClearColor(0x000000, 0)
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost)
    this.contextLossListenerAttached = true

    const canvases = await Promise.all(this.plans.map((plan) => createPricingCardCanvas(plan)))
    if (this.disposed || this.contextLost) return

    this.textures = canvases.map((canvas) => {
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearFilter
      texture.magFilter = LinearFilter
      texture.generateMipmaps = false
      texture.needsUpdate = true
      return { texture }
    })

    this.reflectionTextures = canvases.map((canvas) => {
      const texture = new CanvasTexture(createPricingReflectionCanvas(canvas))
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearFilter
      texture.magFilter = LinearFilter
      texture.generateMipmaps = false
      texture.needsUpdate = true
      return { texture }
    })

    this.planes = PLANE_SLOTS.map((slot) => createPlaneResources(slot, this.textures[0].texture))
    this.planes.forEach(({ bottomReflection, mesh, topReflection }) => {
      this.scene.add(bottomReflection, topReflection, mesh)
    })

    this.resize(this.viewport.width, this.viewport.height, this.viewport.dpr)
    if (this.disposed || this.contextLost) return
    this.initialized = true
  }

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault()
    if (this.contextLost || this.disposed) return

    this.contextLost = true
    try {
      this.options.onContextLost()
    } finally {
      this.dispose()
    }
  }
}

function createPlaneResources(
  slot: PricingPlaneSlot,
  texture: CanvasTexture,
): PricingPlaneResources {
  const mesh = new Mesh(
    new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 1, 1),
    createPricingMaterial(texture, false),
  )
  const topReflection = new Mesh(
    new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 48, 24),
    createPricingMaterial(texture, true),
  )
  const bottomReflection = new Mesh(
    new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 48, 24),
    createPricingMaterial(texture, true),
  )

  bottomReflection.renderOrder = 0
  topReflection.renderOrder = 1
  mesh.renderOrder = 2

  return Object.freeze({ slot, mesh, topReflection, bottomReflection })
}

function createPricingMaterial(texture: CanvasTexture, reflection: boolean): ShaderMaterial {
  const depthOptions = reflection
    ? { depthWrite: false }
    : { depthWrite: true }

  return new ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uTrail: { value: 0 },
      uVelocity: { value: 0 },
      uDirection: { value: 1 },
      uPhase: { value: 0 },
      uTime: { value: 0 },
      uReflectionSide: { value: 0 },
      uCardYaw: { value: 0 },
      uReflectionFlare: { value: 1 },
      uReflectionReach: { value: 0.22 },
      uOpacity: { value: 1 },
      uCardSize: { value: new Vector2(CARD_WIDTH, CARD_HEIGHT) },
    },
    vertexShader: reflection ? pricingReflectionVertexShader : pricingVertexShader,
    fragmentShader: reflection ? pricingSceneReflectionFragmentShader : pricingSceneFragmentShader,
    transparent: true,
    depthTest: true,
    ...depthOptions,
    blending: NormalBlending,
    side: DoubleSide,
  })
}

function updateMainMesh(
  mesh: Mesh<PlaneGeometry, ShaderMaterial>,
  texture: CanvasTexture,
  sample: PricingPlaneSample,
  turn: PricingTurnSample,
  timeSeconds: number,
): void {
  mesh.position.set(sample.x, 0, sample.z)
  mesh.rotation.y = sample.rotationY
  mesh.scale.setScalar(sample.scale)
  mesh.material.opacity = sample.opacity
  updateMaterialUniforms(mesh.material, texture, turn, timeSeconds, 0)
}

function updateReflectionMesh(
  mesh: Mesh<PlaneGeometry, ShaderMaterial>,
  texture: CanvasTexture,
  sample: PricingPlaneSample,
  turn: PricingTurnSample,
  timeSeconds: number,
  position: 'top' | 'bottom',
): void {
  // Reference: only the card approaching the foreground produces the optical echo.
  // Fade continuously on the orbit so there is no flash when physical slots wrap.
  const proximity = Math.max(0, 1 - Math.abs(sample.orbitPosition))
  const foreground = Math.max(0, (proximity - 0.45) / 0.55)
  const presence = foreground * foreground * (3 - 2 * foreground)
  const side = position === 'top' ? 1 : -1
  const edgeY = CARD_HEIGHT * sample.scale * 0.5 * side

  mesh.position.set(sample.x, edgeY, sample.z)
  mesh.rotation.y = 0
  mesh.rotation.z = 0
  mesh.scale.setScalar(sample.scale)
  mesh.material.opacity = sample.opacity * presence * 0.94
  // Skip the diffusion shader entirely for side cards with no visible reflection.
  mesh.visible = presence > 0
  mesh.material.uniforms.uCardYaw.value = sample.rotationY
  updateMaterialUniforms(
    mesh.material,
    texture,
    turn,
    timeSeconds,
    position === 'top' ? 1 : -1,
  )
}

function updateMaterialUniforms(
  material: ShaderMaterial,
  texture: CanvasTexture,
  turn: PricingTurnSample,
  timeSeconds: number,
  reflectionSide: number,
): void {
  material.uniforms.uTexture.value = texture
  material.uniforms.uTrail.value = turn.reflectionIntensity
  material.uniforms.uVelocity.value = turn.velocity
  material.uniforms.uDirection.value = turn.directionSign
  material.uniforms.uPhase.value = turn.travel
  material.uniforms.uTime.value = timeSeconds
  material.uniforms.uReflectionSide.value = reflectionSide
  material.uniforms.uOpacity.value = material.opacity
  material.uniforms.uCardSize.value.set(CARD_WIDTH, CARD_HEIGHT)
}

function addOpacityUniform(fragmentShader: string, alphaExpression: string): string {
  return fragmentShader
    .replace(
      'uniform sampler2D uTexture;',
      'uniform sampler2D uTexture;\nuniform float uOpacity;',
    )
    .replace(alphaExpression, `${alphaExpression} * uOpacity`)
}

function modulo(value: number, divisor: number): number {
  if (divisor <= 0) return -1
  return ((Math.trunc(value) % divisor) + divisor) % divisor
}
