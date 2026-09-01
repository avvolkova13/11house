import * as THREE from 'three'
import {
  terrainFragmentShader,
  terrainPointFragmentShader,
  terrainPointVertexShader,
  terrainVertexShader,
} from './shaders/nebula'

export class NebulaField {
  readonly group = new THREE.Group()
  private readonly geometry: THREE.PlaneGeometry
  private readonly pointGeometry: THREE.PlaneGeometry
  private readonly surface: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly particles: THREE.Points<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly sharedTime = { value: 0 }
  private readonly sharedTravel = { value: 0 }
  private readonly sharedPointer = { value: new THREE.Vector2() }

  constructor(pixelRatio = 1) {
    this.geometry = new THREE.PlaneGeometry(152, 265, 248, 372)
    this.pointGeometry = this.geometry.clone()
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
        uPointer: this.sharedPointer,
        uShadowColor: { value: new THREE.Color(0x020712) },
        uRidgeColor: { value: new THREE.Color(0x242d46) },
        uHotColor: { value: new THREE.Color(0xa66c32) },
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
        uPointer: this.sharedPointer,
        uPixelRatio: { value: pixelRatio },
        uPointColor: { value: new THREE.Color(0xb27c3e) },
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

  update(elapsed: number, pointerX: number, pointerY: number, travel: number) {
    this.sharedTime.value = elapsed
    this.sharedTravel.value = travel
    this.sharedPointer.value.set(pointerX, pointerY)
    this.group.rotation.z = Math.sin(elapsed * 0.035) * 0.0025
    this.group.position.x = pointerX * 0.52
    this.group.position.y = pointerY * 0.18
  }

  dispose() {
    this.geometry.dispose()
    this.pointGeometry.dispose()
    this.surface.material.dispose()
    this.particles.material.dispose()
  }
}
