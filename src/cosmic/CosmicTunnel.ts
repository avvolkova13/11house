import * as THREE from 'three'

const RING_COUNT = 44
const SEGMENT_COUNT = 104
const RING_SPACING = 5.4

const seededNoise = (ring: number, segment: number) => {
  const value = Math.sin(ring * 81.17 + segment * 19.41) * 43758.5453
  return value - Math.floor(value)
}

export class CosmicTunnel {
  readonly group = new THREE.Group()
  private readonly lineGeometry: THREE.BufferGeometry
  private readonly pointGeometry: THREE.BufferGeometry
  private readonly lineMaterial: THREE.LineBasicMaterial
  private readonly pointMaterial: THREE.PointsMaterial
  private readonly rings: THREE.LineSegments
  private readonly particles: THREE.Points

  constructor(pixelRatio: number) {
    const linePositions: number[] = []
    const pointPositions: number[] = []

    for (let ring = 0; ring < RING_COUNT; ring += 1) {
      const z = -9 - ring * RING_SPACING
      const distance = 18 - z
      const radius = 16 + distance * 0.28
      const ringPhase = ring * 0.37

      for (let segment = 0; segment < SEGMENT_COUNT; segment += 1) {
        const angleA = (segment / SEGMENT_COUNT) * Math.PI * 2
        const angleB = ((segment + 1) / SEGMENT_COUNT) * Math.PI * 2
        const contourA = 1
          + Math.sin(angleA * 3 + ringPhase) * 0.026
          + Math.sin(angleA * 7 - ringPhase * 0.7) * 0.014
          + (seededNoise(ring, segment) - 0.5) * 0.018
        const contourB = 1
          + Math.sin(angleB * 3 + ringPhase) * 0.026
          + Math.sin(angleB * 7 - ringPhase * 0.7) * 0.014
          + (seededNoise(ring, segment + 1) - 0.5) * 0.018
        const flatten = 0.72

        linePositions.push(
          Math.cos(angleA) * radius * contourA,
          Math.sin(angleA) * radius * contourA * flatten,
          z,
          Math.cos(angleB) * radius * contourB,
          Math.sin(angleB) * radius * contourB * flatten,
          z,
        )

        if (seededNoise(ring + 93, segment + 47) > 0.72) {
          pointPositions.push(
            Math.cos(angleA) * radius * contourA,
            Math.sin(angleA) * radius * contourA * flatten,
            z + (seededNoise(ring + 17, segment) - 0.5) * 2.4,
          )
        }
      }
    }

    this.lineGeometry = new THREE.BufferGeometry()
    this.lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3),
    )
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x9a7437,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
    this.rings = new THREE.LineSegments(this.lineGeometry, this.lineMaterial)
    this.rings.renderOrder = 2

    this.pointGeometry = new THREE.BufferGeometry()
    this.pointGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(pointPositions, 3),
    )
    this.pointMaterial = new THREE.PointsMaterial({
      color: 0xe4c277,
      size: 0.45 * pixelRatio,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
    this.particles = new THREE.Points(this.pointGeometry, this.pointMaterial)
    this.particles.renderOrder = 4

    this.group.position.set(0, 5.4, 18)
    this.group.rotation.x = -0.13
    this.group.add(this.rings, this.particles)
  }

  setPixelRatio(pixelRatio: number) {
    this.pointMaterial.size = 0.45 * pixelRatio
  }

  update(elapsed: number, travel: number, mix: number) {
    this.lineMaterial.opacity = mix * 0.24
    this.pointMaterial.opacity = mix * 0.48
    this.group.visible = mix > 0.002
    this.group.position.z = 18 + (travel * 2.4) % RING_SPACING
    this.group.rotation.z = Math.sin(elapsed * 0.08) * 0.022 + travel * 0.0018
    const scale = 1.08 - mix * 0.08
    this.group.scale.set(scale, scale, 1)
  }

  dispose() {
    this.lineGeometry.dispose()
    this.pointGeometry.dispose()
    this.lineMaterial.dispose()
    this.pointMaterial.dispose()
  }
}
