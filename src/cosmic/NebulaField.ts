import * as THREE from 'three'
import {
  terrainFragmentShader,
  terrainPointFragmentShader,
  terrainPointVertexShader,
  terrainVertexShader,
} from './shaders/nebula'
import { PointerTrail } from './PointerTrail'
import { damp } from './motion'

export class NebulaField {
  readonly group = new THREE.Group()
  private readonly geometry: THREE.PlaneGeometry
  private readonly pointGeometry: THREE.PlaneGeometry
  private readonly surface: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly particles: THREE.Points<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly sharedTime = { value: 0 }
  private readonly sharedTravel = { value: 0 }
  private readonly sharedPointer = { value: new THREE.Vector2() }
  private readonly sharedOpacity = { value: 1 }
  private readonly sharedTunnelMix = { value: 0 }
  private readonly sharedTunnelPresentation = { value: 0 }
  private readonly sharedTunnelDive = { value: 0 }
  private readonly sharedVelocity = { value: 0 }
  private readonly sharedIntroEnergy = { value: 0 }
  private displayTunnelMix = 0
  private displayTunnelPresentation = 0
  private displayTunnelDive = 0
  private readonly interactionWidth = 96
  private readonly interactionHeight = 160
  private readonly interactionHeights = new Float32Array(
    this.interactionWidth * this.interactionHeight,
  )
  private readonly interactionValues: Float32Array
  private readonly interactionLookup: Uint32Array
  private readonly interactionAttribute: THREE.BufferAttribute
  private readonly interactionNormalValues: Float32Array
  private readonly interactionNormalAttribute: THREE.BufferAttribute
  private interactionVisible = false
  private readonly camera: THREE.Camera
  private readonly reducedMotion: boolean
  private readonly trail = new PointerTrail()
  private readonly raycaster = new THREE.Raycaster()
  private readonly interactionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 6)
  private readonly hitWorld = new THREE.Vector3()
  private readonly hitLocal = new THREE.Vector3()
  private readonly projectedPointer = new THREE.Vector2()

  constructor(camera: THREE.Camera, pixelRatio = 1, reducedMotion = false) {
    this.camera = camera
    this.reducedMotion = reducedMotion
    this.geometry = new THREE.PlaneGeometry(152, 265, 248, 372)
    this.pointGeometry = this.geometry.clone()
    const surfacePositions = this.geometry.attributes.position as THREE.BufferAttribute
    this.interactionValues = new Float32Array(surfacePositions.count)
    this.interactionLookup = new Uint32Array(surfacePositions.count)
    this.interactionAttribute = new THREE.BufferAttribute(this.interactionValues, 1)
    this.interactionAttribute.setUsage(THREE.DynamicDrawUsage)
    this.interactionNormalValues = new Float32Array(surfacePositions.count * 2)
    this.interactionNormalAttribute = new THREE.BufferAttribute(this.interactionNormalValues, 2)
    this.interactionNormalAttribute.setUsage(THREE.DynamicDrawUsage)
    for (let index = 0; index < surfacePositions.count; index += 1) {
      const x = THREE.MathUtils.clamp(
        Math.round((surfacePositions.getX(index) / 152 + 0.5) * (this.interactionWidth - 1)),
        0,
        this.interactionWidth - 1,
      )
      const y = THREE.MathUtils.clamp(
        Math.round((surfacePositions.getY(index) / 265 + 0.5) * (this.interactionHeight - 1)),
        0,
        this.interactionHeight - 1,
      )
      this.interactionLookup[index] = y * this.interactionWidth + x
    }
    this.geometry.setAttribute('aInteraction', this.interactionAttribute)
    this.geometry.setAttribute('aInteractionGradient', this.interactionNormalAttribute)
    this.pointGeometry.setAttribute('aInteraction', this.interactionAttribute)
    const pointPositions = this.pointGeometry.attributes.position as THREE.BufferAttribute
    for (let index = 0; index < pointPositions.count; index += 1) {
      const randomX = Math.sin(index * 12.9898) * 43758.5453
      const randomY = Math.sin((index + 41) * 78.233) * 24634.6345
      const jitterX = (randomX - Math.floor(randomX) - 0.5) * 0.46
      const jitterY = (randomY - Math.floor(randomY) - 0.5) * 0.54
      pointPositions.setX(index, pointPositions.getX(index) + jitterX)
      pointPositions.setY(index, pointPositions.getY(index) + jitterY)
    }
    pointPositions.needsUpdate = true

    const surfaceMaterial = new THREE.ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: {
        uTime: this.sharedTime,
        uTravel: this.sharedTravel,
        uTunnelMix: this.sharedTunnelMix,
        uTunnelPresentation: this.sharedTunnelPresentation,
        uTunnelDive: this.sharedTunnelDive,
        uVelocity: this.sharedVelocity,
        uPointer: this.sharedPointer,
        uShadowColor: { value: new THREE.Color(0x020712) },
        uRidgeColor: { value: new THREE.Color(0x242d46) },
        uHotColor: { value: new THREE.Color(0xa66c32) },
        uOpacity: this.sharedOpacity,
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    })

    const pointMaterial = new THREE.ShaderMaterial({
      vertexShader: terrainPointVertexShader,
      fragmentShader: terrainPointFragmentShader,
      uniforms: {
        uTime: this.sharedTime,
        uTravel: this.sharedTravel,
        uTunnelMix: this.sharedTunnelMix,
        uTunnelPresentation: this.sharedTunnelPresentation,
        uTunnelDive: this.sharedTunnelDive,
        uVelocity: this.sharedVelocity,
        uIntroEnergy: this.sharedIntroEnergy,
        uPointer: this.sharedPointer,
        uPixelRatio: { value: pixelRatio },
        uPointColor: { value: new THREE.Color(0xb27c3e) },
        uOpacity: this.sharedOpacity,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })

    this.surface = new THREE.Mesh(this.geometry, surfaceMaterial)
    this.surface.rotation.x = -Math.PI / 2
    this.surface.position.set(0, -10.5, -109)
    this.surface.renderOrder = 1

    this.particles = new THREE.Points(this.pointGeometry, pointMaterial)
    this.particles.rotation.copy(this.surface.rotation)
    this.particles.position.copy(this.surface.position)
    this.particles.renderOrder = 3
    this.group.add(this.surface, this.particles)
  }

  setPixelRatio(pixelRatio: number) {
    this.particles.material.uniforms.uPixelRatio.value = pixelRatio
  }

  private projectPointer() {
    this.raycaster.setFromCamera(this.sharedPointer.value, this.camera)
    const hit = this.raycaster.ray.intersectPlane(this.interactionPlane, this.hitWorld)
    if (!hit) return null

    this.surface.updateWorldMatrix(true, false)
    this.hitLocal.copy(hit)
    this.surface.worldToLocal(this.hitLocal)
    if (Math.abs(this.hitLocal.x) > 73 || Math.abs(this.hitLocal.y) > 130) return null

    return this.projectedPointer.set(this.hitLocal.x, this.hitLocal.y)
  }

  private stampInteraction(
    centerX: number,
    centerY: number,
    weight: number,
    coreRadius: number,
    coreStrength: number,
    moatRadius: number,
    moatWidth: number,
    moatStrength: number,
  ) {
    if (weight <= 0.002) return
    const radius = Math.max(coreRadius * 3.4, moatRadius + moatWidth * 3.0)
    const minX = Math.max(0, Math.floor(((centerX - radius) / 152 + 0.5) * this.interactionWidth))
    const maxX = Math.min(this.interactionWidth - 1, Math.ceil(((centerX + radius) / 152 + 0.5) * this.interactionWidth))
    const minY = Math.max(0, Math.floor(((centerY - radius) / 265 + 0.5) * this.interactionHeight))
    const maxY = Math.min(this.interactionHeight - 1, Math.ceil(((centerY + radius) / 265 + 0.5) * this.interactionHeight))

    for (let y = minY; y <= maxY; y += 1) {
      const terrainY = ((y + 0.5) / this.interactionHeight - 0.5) * 265
      for (let x = minX; x <= maxX; x += 1) {
        const terrainX = ((x + 0.5) / this.interactionWidth - 0.5) * 152
        const distance = Math.hypot(terrainX - centerX, terrainY - centerY)
        const core = Math.exp(-0.5 * (distance / coreRadius) ** 2)
        const moat = Math.exp(-0.5 * ((distance - moatRadius) / moatWidth) ** 2)
        this.interactionHeights[y * this.interactionWidth + x] += (
          core * coreStrength - moat * moatStrength
        ) * weight
      }
    }
  }

  private updateInteractionMap() {
    const hasInteraction = this.trail.cursorEnergy > 0
      || this.trail.weights.some((weight) => weight > 0)
    if (!hasInteraction && !this.interactionVisible) return
    this.interactionVisible = hasInteraction
    this.interactionHeights.fill(0)
    this.stampInteraction(
      this.trail.cursor.x,
      this.trail.cursor.y,
      this.trail.cursorEnergy,
      10.5,
      3.4,
      13.5,
      4.2,
      0.64,
    )
    for (let index = 0; index < this.trail.centers.length; index += 1) {
      const center = this.trail.centers[index]
      this.stampInteraction(
        center.x,
        center.y,
        this.trail.weights[index],
        7.4,
        1.8,
        9.3,
        3.2,
        0.38,
      )
    }

    for (let index = 0; index < this.interactionValues.length; index += 1) {
      const fieldIndex = this.interactionLookup[index]
      const x = fieldIndex % this.interactionWidth
      const y = Math.floor(fieldIndex / this.interactionWidth)
      const left = y * this.interactionWidth + Math.max(0, x - 1)
      const right = y * this.interactionWidth + Math.min(this.interactionWidth - 1, x + 1)
      const down = Math.max(0, y - 1) * this.interactionWidth + x
      const up = Math.min(this.interactionHeight - 1, y + 1) * this.interactionWidth + x
      this.interactionValues[index] = this.interactionHeights[fieldIndex]
      this.interactionNormalValues[index * 2] = (
        this.interactionHeights[right] - this.interactionHeights[left]
      ) / (2 * 152 / (this.interactionWidth - 1))
      this.interactionNormalValues[index * 2 + 1] = (
        this.interactionHeights[up] - this.interactionHeights[down]
      ) / (2 * 265 / (this.interactionHeight - 1))
    }
    this.interactionAttribute.needsUpdate = true
    this.interactionNormalAttribute.needsUpdate = true
  }

  update(
    elapsed: number,
    pointerX: number,
    pointerY: number,
    travel: number,
    dt: number,
    pointerActive: boolean,
    tunnelMix: number,
    tunnelPresentation: number,
    tunnelDive: number,
    velocity: number,
    introEnergy: number,
    tunnelSurfaceDepth: number,
    tunnelScale: number,
    tunnelOrbit: number,
  ) {
    this.sharedTime.value = elapsed
    this.sharedTravel.value = travel
    this.sharedPointer.value.set(pointerX, pointerY)
    this.displayTunnelMix = damp(
      this.displayTunnelMix,
      tunnelMix,
      this.reducedMotion ? 12 : 5.6,
      dt,
    )
    this.sharedTunnelMix.value = this.displayTunnelMix
    this.displayTunnelPresentation = damp(
      this.displayTunnelPresentation,
      tunnelPresentation,
      this.reducedMotion ? 12 : 5.2,
      dt,
    )
    this.displayTunnelDive = damp(
      this.displayTunnelDive,
      tunnelDive,
      this.reducedMotion ? 12 : 4.6,
      dt,
    )
    this.sharedTunnelPresentation.value = this.displayTunnelPresentation
    this.sharedTunnelDive.value = this.displayTunnelDive
    this.sharedVelocity.value = this.reducedMotion ? 0 : velocity
    this.sharedIntroEnergy.value = this.reducedMotion ? 0 : introEnergy
    const target = !this.reducedMotion && pointerActive && this.displayTunnelMix < 0.12
      ? this.projectPointer()
      : null
    this.trail.tick(dt, elapsed, target)
    this.updateInteractionMap()
    const tunnelInfluence = THREE.MathUtils.smoothstep(this.displayTunnelMix, 0.18, 0.72)
    const formedSurfaceZ = THREE.MathUtils.lerp(-109, -118, tunnelInfluence)
    const targetSurfaceZ = THREE.MathUtils.lerp(
      formedSurfaceZ,
      tunnelSurfaceDepth,
      this.displayTunnelPresentation,
    )
    const surfaceZ = damp(this.surface.position.z, targetSurfaceZ, 4.2, dt)
    this.surface.position.z = surfaceZ
    this.particles.position.z = surfaceZ
    this.surface.material.depthWrite = this.displayTunnelMix < 0.34
    this.group.rotation.z = Math.sin(elapsed * 0.035) * 0.0025
      + tunnelOrbit * this.displayTunnelPresentation
    const targetScale = THREE.MathUtils.lerp(
      1,
      tunnelScale,
      this.displayTunnelPresentation,
    )
    const displayScale = damp(this.group.scale.x, targetScale, 4.2, dt)
    this.group.scale.setScalar(displayScale)
    this.group.position.x = pointerX * THREE.MathUtils.lerp(0.52, 0.26, tunnelInfluence)
    this.group.position.y = pointerY * THREE.MathUtils.lerp(0.18, 0.12, tunnelInfluence)
  }

  dispose() {
    this.geometry.dispose()
    this.pointGeometry.dispose()
    this.surface.material.dispose()
    this.particles.material.dispose()
  }
}
