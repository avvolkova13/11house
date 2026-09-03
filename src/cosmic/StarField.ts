import * as THREE from 'three'
import { starFragmentShader, starVertexShader } from './shaders/star'
import { STAR_PROFILE } from './starProfile'

const seededRandom = (seed: number) => {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class StarField {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private readonly geometry: THREE.BufferGeometry
  private readonly material: THREE.ShaderMaterial

  constructor(width: number, height: number, pixelRatio: number) {
    const area = width * height
    const count = Math.round(THREE.MathUtils.clamp(area / 175, 4800, 8200))
    const random = seededRandom(11011992)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const temperatures = new Float32Array(count)

    for (let index = 0; index < count; index += 1) {
      const i3 = index * 3
      const depth = -232 + random() * 242
      const normalizedDepth = THREE.MathUtils.clamp((-depth + 10) / 242, 0, 1)
      const isSkyFill = random() < 0.72

      if (isSkyFill) {
        const cameraDistance = -depth + 5.4
        const frustumHalfHeight = Math.tan(THREE.MathUtils.degToRad(29)) * cameraDistance
        const frustumHalfWidth = frustumHalfHeight * (width / Math.max(height, 1))
        positions[i3] = (random() * 2 - 1) * frustumHalfWidth * 1.18
        positions[i3 + 1] = 5.4 + random() * frustumHalfHeight * 1.72
      } else {
        const angle = random() * Math.PI * 2
        const cluster = Math.pow(random(), 0.58)
        const tunnel = 6.5 + normalizedDepth * 34
        const radius = tunnel + cluster * (16 + normalizedDepth * 60)
        const horizontalBias = 0.78 + random() * 0.48

        positions[i3] = Math.cos(angle) * radius * horizontalBias
        positions[i3 + 1] = Math.sin(angle) * radius * 0.64 - 4.8 - random() * 5.2
      }
      positions[i3 + 2] = depth
      sizes[index] = random() < STAR_PROFILE.accentChance
        ? STAR_PROFILE.accentSizeMin
          + random() * (STAR_PROFILE.accentSizeMax - STAR_PROFILE.accentSizeMin)
        : STAR_PROFILE.regularSizeMin
          + Math.pow(random(), 4) * (STAR_PROFILE.regularSizeMax - STAR_PROFILE.regularSizeMin)
      phases[index] = random()
      temperatures[index] = random() < 0.2 ? 0.72 + random() * 0.28 : random() * 0.58
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    this.geometry.setAttribute('aTemperature', new THREE.BufferAttribute(temperatures, 1))

    this.material = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTravel: { value: 0 },
        uStreak: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
    this.points.renderOrder = 5
  }

  update(
    elapsed: number,
    travel: number,
    streak: number,
    pixelRatio: number,
    opacity = 1,
  ) {
    this.material.uniforms.uTime.value = elapsed
    this.material.uniforms.uTravel.value = travel
    this.material.uniforms.uStreak.value = streak
    this.material.uniforms.uPixelRatio.value = pixelRatio
    this.material.uniforms.uOpacity.value = opacity
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
