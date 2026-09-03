import * as THREE from 'three'
import { NebulaField } from './NebulaField'
import { PostProcessing } from './PostProcessing'
import { StarField } from './StarField'
import type { HeroScrollAdapter } from '../scroll/HeroScrollAdapter'
import { clamp, damp, decayVelocity, getTravelSpeed } from './motion'
import {
  getTunnelDive,
  getTunnelMix,
  getTunnelPresentation,
} from '../hero/heroNarrative'
import { getTunnelMotion, getTunnelViewportFraming } from './tunnelMotion'

type CosmicSceneOptions = {
  reducedMotion: boolean
  onFallback: () => void
  scrollAdapter: HeroScrollAdapter
}

export class CosmicScene {
  private readonly canvas: HTMLCanvasElement
  private readonly reducedMotion: boolean
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 0.1, 520)
  private readonly heroClearColor = new THREE.Color(0x010308)
  private readonly tunnelClearColor = new THREE.Color(0x000102)
  private readonly currentClearColor = new THREE.Color(0x010308)
  private readonly world = new THREE.Group()
  private readonly stars: StarField
  private readonly nebula: NebulaField
  private readonly post: PostProcessing
  private readonly clock = new THREE.Clock()
  private raf = 0
  private running = false
  private disposed = false
  private width = 1
  private height = 1
  private pixelRatio = 1
  private pointerTarget = new THREE.Vector2()
  private pointer = new THREE.Vector2()
  private pointerActive = false
  private scrollVelocity = 0
  private travel = 0
  private narrativeProgress = 0
  private readonly removeScrollListener: () => void

  constructor(canvas: HTMLCanvasElement, options: CosmicSceneOptions) {
    this.canvas = canvas
    this.reducedMotion = options.reducedMotion
    this.removeScrollListener = options.scrollAdapter.subscribe((snapshot) => {
      this.narrativeProgress = this.reducedMotion ? 0 : snapshot.travelProgress
      if (this.reducedMotion || snapshot.heroDelta === 0) return
      this.scrollVelocity = clamp(this.scrollVelocity + snapshot.heroDelta * 0.018, -11, 14)
    })

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
    } catch (error) {
      options.onFallback()
      throw error
    }

    this.renderer.setClearColor(0x010308, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.04

    this.camera.position.set(0, 5.4, 18)
    this.camera.rotation.x = -0.13
    this.scene.fog = new THREE.FogExp2(0x030610, 0.0034)
    this.scene.add(this.world)

    this.pixelRatio = this.getPixelRatio()
    this.stars = new StarField(window.innerWidth, window.innerHeight, this.pixelRatio)
    this.nebula = new NebulaField(this.camera, this.pixelRatio, this.reducedMotion)
    this.world.add(this.nebula.group, this.stars.points)

    this.post = new PostProcessing(this.renderer, this.scene, this.camera)
    this.resize()
    this.addListeners()
  }

  private getPixelRatio() {
    const constrained = window.innerWidth < 1100 ? 1.25 : 1.7
    return Math.min(window.devicePixelRatio || 1, constrained)
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    if (this.reducedMotion) return
    this.pointerActive = true
    this.pointerTarget.set(
      (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
      -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1),
    )
  }

  private readonly onVisibilityChange = () => {
    if (document.hidden) {
      this.stop()
    } else if (!this.disposed) {
      this.clock.getDelta()
      this.start()
    }
  }

  private readonly resize = () => {
    const width = Math.max(this.canvas.clientWidth, 1)
    const height = Math.max(this.canvas.clientHeight, 1)
    const nextPixelRatio = this.getPixelRatio()
    if (width === this.width && height === this.height && nextPixelRatio === this.pixelRatio) return

    this.width = width
    this.height = height
    this.pixelRatio = nextPixelRatio
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(nextPixelRatio)
    this.renderer.setSize(width, height, false)
    this.post.setPixelRatio(nextPixelRatio)
    this.post.setSize(width, height)
    this.nebula.setPixelRatio(nextPixelRatio)
  }

  private addListeners() {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('resize', this.resize, { passive: true })
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  private removeListeners() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('resize', this.resize)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  }

  private readonly frame = () => {
    if (!this.running || this.disposed) return
    this.raf = window.requestAnimationFrame(this.frame)

    const dt = Math.min(this.clock.getDelta(), 1 / 24)
    const elapsed = this.clock.elapsedTime
    const pointerLambda = this.reducedMotion ? 1.2 : 4.6
    this.pointer.x = damp(this.pointer.x, this.pointerTarget.x, pointerLambda, dt)
    this.pointer.y = damp(this.pointer.y, this.pointerTarget.y, pointerLambda, dt)

    if (this.reducedMotion) {
      this.scrollVelocity = 0
    } else {
      this.scrollVelocity = decayVelocity(this.scrollVelocity, 3.3, dt)
    }

    const speed = getTravelSpeed(this.scrollVelocity, this.reducedMotion)
    this.travel += speed * dt
    const streak = this.reducedMotion
      ? 0
      : THREE.MathUtils.smoothstep(Math.abs(this.scrollVelocity), 0.7, 9.5)
    const tunnelMix = getTunnelMix(this.narrativeProgress)
    const tunnelPresentation = getTunnelPresentation(this.narrativeProgress)
    const tunnelDive = getTunnelDive(this.narrativeProgress)
    const tunnelMotion = getTunnelMotion({
      mix: tunnelMix,
      presentation: tunnelPresentation,
      dive: tunnelDive,
      velocity: this.scrollVelocity,
      pointerX: this.pointer.x,
      pointerY: this.pointer.y,
      reducedMotion: this.reducedMotion,
    })
    const tunnelFraming = getTunnelViewportFraming(this.width)
    this.currentClearColor.lerpColors(
      this.heroClearColor,
      this.tunnelClearColor,
      tunnelMotion.collapse,
    )
    this.renderer.setClearColor(this.currentClearColor, 1)
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.currentClearColor)
    }

    const idleX = Math.sin(elapsed * 0.09) * 0.12
    const idleY = Math.cos(elapsed * 0.075) * 0.08
    const targetX = this.pointer.x * 3.25 + idleX
      + tunnelMotion.cameraX * tunnelPresentation * tunnelFraming.cameraScale
    const targetY = 5.4 + this.pointer.y * 1.72 + idleY
      + tunnelMotion.cameraY * tunnelPresentation * tunnelFraming.cameraScale
    this.camera.position.x = damp(this.camera.position.x, targetX, 2.6, dt)
    this.camera.position.y = damp(this.camera.position.y, targetY, 2.6, dt)
    this.camera.position.z = damp(
      this.camera.position.z,
      18 - this.scrollVelocity * 0.085 + tunnelMotion.cameraZ * tunnelPresentation,
      3.4,
      dt,
    )
    this.camera.rotation.y = damp(
      this.camera.rotation.y,
      -this.pointer.x * 0.086 + tunnelDive * tunnelFraming.yaw,
      3.1,
      dt,
    )
    this.camera.rotation.x = damp(
      this.camera.rotation.x,
      -0.13 + this.pointer.y * 0.056 - tunnelDive * 0.022,
      3.1,
      dt,
    )
    this.camera.rotation.z = damp(
      this.camera.rotation.z,
      -this.pointer.x * 0.007 + tunnelMotion.roll * tunnelMix,
      2.4,
      dt,
    )

    this.world.position.x = damp(
      this.world.position.x,
      this.pointer.x * 0.82 + tunnelFraming.worldX * tunnelPresentation,
      1.9,
      dt,
    )
    this.world.position.y = damp(
      this.world.position.y,
      this.pointer.y * 0.38 + tunnelFraming.worldY * tunnelPresentation,
      1.9,
      dt,
    )
    this.stars.update(
      elapsed,
      this.travel,
      streak,
      this.pixelRatio,
      tunnelMotion.starOpacity,
    )
    this.nebula.update(
      elapsed,
      this.pointer.x,
      this.pointer.y,
      this.travel,
      dt,
      this.pointerActive,
      tunnelMix,
      tunnelPresentation,
      tunnelDive,
      this.scrollVelocity,
    )
    this.post.render(streak)
  }

  start() {
    if (this.running || this.disposed) return
    this.running = true
    this.clock.start()
    this.raf = window.requestAnimationFrame(this.frame)
  }

  private stop() {
    this.running = false
    window.cancelAnimationFrame(this.raf)
    this.clock.stop()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.stop()
    this.removeScrollListener()
    this.removeListeners()
    this.stars.dispose()
    this.nebula.dispose()
    this.post.dispose()
    this.renderer.dispose()
  }
}
