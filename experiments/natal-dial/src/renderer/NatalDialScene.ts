import {
  ACESFilmicToneMapping,
  Color,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  Texture,
  UnsignedByteType,
  Vector2,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { createDialAtlas } from '../dialTexture'
import { CYCLE_MS, getMotionFrame, getRenderSize } from '../motion'
import { COMPOSITE_FRAGMENT_SHADER } from '../shaders/composite'
import { DIAL_FRAGMENT_SHADER } from '../shaders/dial'
import { GLASS_FRAGMENT_SHADER } from '../shaders/glass'
import { GRID_FRAGMENT_SHADER } from '../shaders/grid'
import { FullscreenPass } from './FullscreenPass'

type AnimationAdapter = Readonly<{
  request: (callback: FrameRequestCallback) => number
  cancel: (id: number) => void
}>

export type LifecycleController = Readonly<{
  start: (callback: FrameRequestCallback) => void
  stop: () => void
  dispose: () => void
}>

type CompositePipeline = Readonly<{
  scene: () => void
  glass: () => void
  composite: () => void
}>

export function renderCompositePipeline(pipeline: CompositePipeline) {
  pipeline.scene()
  pipeline.glass()
  pipeline.composite()
}

export function getPrismScreenScale(motionScale: number) {
  return motionScale * 0.88
}

export function createLifecycleController(adapter: AnimationAdapter): LifecycleController {
  let frameId: number | null = null
  let callback: FrameRequestCallback | null = null
  let disposed = false

  const tick: FrameRequestCallback = (timestamp) => {
    if (disposed || !callback) return
    callback(timestamp)
    frameId = adapter.request(tick)
  }

  const stop = () => {
    if (frameId !== null) adapter.cancel(frameId)
    frameId = null
  }

  return {
    start(nextCallback) {
      if (disposed || frameId !== null) return
      callback = nextCallback
      frameId = adapter.request(tick)
    },
    stop,
    dispose() {
      if (disposed) return
      disposed = true
      stop()
      callback = null
    },
  }
}

function createTarget(depthBuffer = false) {
  const target = new WebGLRenderTarget(1, 1, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBAFormat,
    type: UnsignedByteType,
    depthBuffer,
    stencilBuffer: false,
  })
  target.texture.generateMipmaps = false
  return target
}

function createDialPass(atlas: Texture, layer: 0 | 1, outerArcIndex = 0) {
  return new FullscreenPass(DIAL_FRAGMENT_SHADER, {
    uResolution: { value: new Vector2(1, 1) },
    uZodiacRotation: { value: 0 },
    uHouseRotation: { value: 0 },
    uOuterRotationA: { value: 0 },
    uOuterRotationB: { value: 0 },
    uOuterArcIndex: { value: outerArcIndex },
    uLayer: { value: layer },
    uAtlas: { value: atlas },
  })
}

export function createDialRig(
  innerMap: Texture,
  outerMaps: readonly [Texture, Texture, Texture],
): Group {
  const rig = new Group()
  rig.name = 'dial-rig'
  rig.position.z = -1

  const createLayer = (name: string, map: Texture, z: number) => {
    const layer = new Mesh(
      new PlaneGeometry(3.04, 3.04),
      new MeshBasicMaterial({
        map,
        alphaTest: 0.065,
        depthWrite: true,
        toneMapped: false,
      }),
    )
    layer.name = name
    layer.position.z = z
    return layer
  }

  rig.add(createLayer('inner-dial-plane', innerMap, 0))
  outerMaps.forEach((map, index) => {
    rig.add(createLayer(`outer-dial-plane-${index}`, map, -0.024 - index * 0.018))
  })
  return rig
}

export class NatalDialScene {
  private readonly renderer: WebGLRenderer
  private readonly gridTarget = createTarget()
  private readonly innerDialTarget = createTarget()
  private readonly outerDialTargetA = createTarget()
  private readonly outerDialTargetB = createTarget()
  private readonly outerDialTargetC = createTarget()
  private readonly sceneTarget = createTarget(true)
  private readonly glassTarget = createTarget()
  private readonly atlas = createDialAtlas(2048)
  private readonly gridPass = new FullscreenPass(GRID_FRAGMENT_SHADER, {})
  private readonly innerDialPass = createDialPass(this.atlas.texture, 0)
  private readonly outerDialPasses = [
    createDialPass(this.atlas.texture, 1, 0),
    createDialPass(this.atlas.texture, 1, 1),
    createDialPass(this.atlas.texture, 1, 2),
  ] as const
  private readonly glassPass = new FullscreenPass(GLASS_FRAGMENT_SHADER, {
    uDial: { value: this.sceneTarget.texture },
    uResolution: { value: new Vector2(1, 1) },
    uPrismCenter: { value: new Vector2() },
    uPrismScale: { value: 0.55 },
    uPrismQuaternion: { value: new Vector4(0, 0, 0, 1) },
    uDispersion: { value: 0.8 },
    uCaustic: { value: 0 },
    uRaySteps: { value: 58 },
  })
  private readonly compositePass = new FullscreenPass(COMPOSITE_FRAGMENT_SHADER, {
    uDial: { value: this.sceneTarget.texture },
    uGlass: { value: this.glassTarget.texture },
    uResolution: { value: new Vector2(1, 1) },
    uPhase: { value: 0 },
  })
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(28, 1, 0.1, 20)
  private readonly dialRig = createDialRig(this.innerDialTarget.texture, [
    this.outerDialTargetA.texture,
    this.outerDialTargetB.texture,
    this.outerDialTargetC.texture,
  ])
  private readonly outerDialPlanes = [0, 1, 2].map((index) => (
    this.dialRig.getObjectByName(`outer-dial-plane-${index}`) as Mesh
  ))
  private readonly backdropGeometry = new PlaneGeometry(4.04, 4.04)
  private readonly backdropMaterial: MeshBasicMaterial
  private readonly lifecycle: LifecycleController
  private readonly resizeObserver: ResizeObserver
  private readonly reducedMotion: boolean
  private disposed = false
  private gridDirty = true
  private renderSize = 0
  private elapsedOffset = 0
  private resumeTimestamp: number | null = null

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly fallback: HTMLDivElement,
    reducedMotion: boolean,
  ) {
    this.reducedMotion = reducedMotion
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.setPixelRatio(1)

    this.scene.background = new Color(0x000000)
    this.camera.position.set(0, 0, 5)
    this.camera.lookAt(0, 0, 0)

    this.backdropMaterial = new MeshBasicMaterial({
      map: this.gridTarget.texture,
      toneMapped: false,
    })
    const backdrop = new Mesh(this.backdropGeometry, this.backdropMaterial)
    backdrop.name = 'grid-backdrop'
    backdrop.position.z = -3
    this.scene.add(backdrop, this.dialRig)

    this.lifecycle = createLifecycleController({
      request: (callback) => requestAnimationFrame(callback),
      cancel: (id) => cancelAnimationFrame(id),
    })
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    this.resize()
  }

  start() {
    if (this.disposed) return
    if (this.reducedMotion) {
      this.renderFrame(getMotionFrame(0, true))
      return
    }

    this.resumeTimestamp = null
    this.lifecycle.start(this.onAnimationFrame)
  }

  stop() {
    this.captureElapsedOffset(performance.now())
    this.lifecycle.stop()
  }

  resize() {
    if (this.disposed) return
    const bounds = this.canvas.getBoundingClientRect()
    const cssSize = Math.max(1, Math.min(bounds.width, bounds.height))
    const mobile = matchMedia('(max-width: 640px)').matches
    const nextSize = getRenderSize(cssSize, window.devicePixelRatio, mobile)
    if (nextSize === this.renderSize) return

    this.renderSize = nextSize
    this.renderer.setSize(nextSize, nextSize, false)
    this.gridTarget.setSize(nextSize, nextSize)
    this.innerDialTarget.setSize(nextSize, nextSize)
    this.outerDialTargetA.setSize(nextSize, nextSize)
    this.outerDialTargetB.setSize(nextSize, nextSize)
    this.outerDialTargetC.setSize(nextSize, nextSize)
    this.sceneTarget.setSize(nextSize, nextSize)
    this.glassTarget.setSize(nextSize, nextSize)
    this.innerDialPass.material.uniforms.uResolution.value.set(nextSize, nextSize)
    this.outerDialPasses.forEach((pass) => {
      pass.material.uniforms.uResolution.value.set(nextSize, nextSize)
    })
    this.glassPass.material.uniforms.uResolution.value.set(nextSize, nextSize)
    this.compositePass.material.uniforms.uResolution.value.set(nextSize, nextSize)
    this.gridDirty = true

    if (this.reducedMotion) this.renderFrame(getMotionFrame(0, true))
  }

  renderAtPhase(phase: number) {
    const wrapped = ((phase % 1) + 1) % 1
    this.renderFrame(getMotionFrame(wrapped * CYCLE_MS, false))
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.lifecycle.dispose()
    this.resizeObserver.disconnect()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.gridPass.dispose()
    this.innerDialPass.dispose()
    this.outerDialPasses.forEach((pass) => pass.dispose())
    this.glassPass.dispose()
    this.compositePass.dispose()
    this.atlas.texture.dispose()
    this.gridTarget.dispose()
    this.innerDialTarget.dispose()
    this.outerDialTargetA.dispose()
    this.outerDialTargetB.dispose()
    this.outerDialTargetC.dispose()
    this.sceneTarget.dispose()
    this.glassTarget.dispose()
    this.backdropGeometry.dispose()
    this.backdropMaterial.dispose()
    this.dialRig.traverse((object) => {
      if (!(object instanceof Mesh)) return
      object.geometry.dispose()
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose())
      } else {
        object.material.dispose()
      }
    })
    this.renderer.dispose()
  }

  private readonly onAnimationFrame: FrameRequestCallback = (timestamp) => {
    if (this.resumeTimestamp === null) this.resumeTimestamp = timestamp
    const elapsed = this.elapsedOffset + timestamp - this.resumeTimestamp
    this.renderFrame(getMotionFrame(elapsed, false))
  }

  private readonly onVisibilityChange = () => {
    if (document.hidden) {
      this.stop()
      return
    }
    this.resumeTimestamp = null
    this.lifecycle.start(this.onAnimationFrame)
  }

  private readonly onContextLost = (event: Event) => {
    event.preventDefault()
    this.lifecycle.stop()
    this.canvas.hidden = true
    this.fallback.hidden = false
  }

  private captureElapsedOffset(timestamp: number) {
    if (this.resumeTimestamp === null) return
    this.elapsedOffset += timestamp - this.resumeTimestamp
    this.resumeTimestamp = null
  }

  private renderFrame(frame: ReturnType<typeof getMotionFrame>) {
    if (this.disposed || this.renderSize === 0) return

    for (const pass of [this.innerDialPass, ...this.outerDialPasses]) {
      pass.material.uniforms.uZodiacRotation.value = frame.rings.zodiac
      pass.material.uniforms.uHouseRotation.value = frame.rings.houses
      pass.material.uniforms.uOuterRotationA.value = frame.rings.outerA
      pass.material.uniforms.uOuterRotationB.value = frame.rings.outerB
    }

    this.dialRig.rotation.set(frame.dialRig.pitch, frame.dialRig.yaw, frame.dialRig.roll)
    this.outerDialPlanes.forEach((plane, index) => {
      const layer = frame.dialRig.outerLayers[index]
      plane.rotation.set(layer.pitch, layer.yaw, layer.roll)
    })

    this.glassPass.material.uniforms.uPrismCenter.value.set(frame.prism.x, frame.prism.y)
    this.glassPass.material.uniforms.uPrismScale.value = getPrismScreenScale(frame.prism.scale)
    this.glassPass.material.uniforms.uPrismQuaternion.value.set(...frame.prism.quaternion)
    this.glassPass.material.uniforms.uDispersion.value = frame.optics.dispersion
    this.glassPass.material.uniforms.uCaustic.value = frame.optics.caustic
    this.compositePass.material.uniforms.uPhase.value = frame.phase

    if (this.gridDirty) {
      this.gridPass.render(this.renderer, this.gridTarget)
      this.gridDirty = false
    }
    this.innerDialPass.render(this.renderer, this.innerDialTarget)
    this.outerDialPasses[0].render(this.renderer, this.outerDialTargetA)
    this.outerDialPasses[1].render(this.renderer, this.outerDialTargetB)
    this.outerDialPasses[2].render(this.renderer, this.outerDialTargetC)
    renderCompositePipeline({
      scene: () => {
        this.renderer.setRenderTarget(this.sceneTarget)
        this.renderer.render(this.scene, this.camera)
      },
      glass: () => this.glassPass.render(this.renderer, this.glassTarget),
      composite: () => this.compositePass.render(this.renderer, null),
    })
  }
}
