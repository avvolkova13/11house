import * as THREE from 'three'

const SAMPLE_COUNT = 12
const SAMPLE_SPACING = 0.95
const SAMPLE_INTERVAL = 0.025

const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

export class PointerTrail {
  readonly centers = Array.from({ length: SAMPLE_COUNT }, () => new THREE.Vector2(10_000, 10_000))
  readonly weights = Array.from({ length: SAMPLE_COUNT }, () => 0)
  readonly cursor = new THREE.Vector2(10_000, 10_000)
  cursorEnergy = 0

  private readonly lastSample = new THREE.Vector2()
  private hasTarget = false
  private lastSampleAt = 0
  private writeIndex = 0

  tick(dt: number, elapsed: number, target: THREE.Vector2 | null) {
    const safeDt = Math.min(Math.max(dt, 0), 0.1)
    const decay = Math.exp(-1.85 * safeDt)
    for (let index = 0; index < this.weights.length; index += 1) {
      this.weights[index] *= decay
      if (this.weights[index] < 0.002) this.weights[index] = 0
    }

    this.cursorEnergy = damp(
      this.cursorEnergy,
      target ? 1 : 0,
      target ? 2.0 : 4.8,
      safeDt,
    )
    if (this.cursorEnergy < 0.002) this.cursorEnergy = 0

    if (!target) {
      this.hasTarget = false
      return
    }

    if (!this.hasTarget) {
      this.cursor.copy(target)
      this.lastSample.copy(target)
      this.lastSampleAt = elapsed
      this.hasTarget = true
      return
    }

    const response = 1 - Math.exp(-8.5 * safeDt)
    this.cursor.lerp(target, response)
    const distance = target.distanceTo(this.lastSample)
    if (distance < SAMPLE_SPACING || elapsed - this.lastSampleAt < SAMPLE_INTERVAL) return

    this.centers[this.writeIndex].copy(this.lastSample).lerp(target, 0.5)
    this.weights[this.writeIndex] = THREE.MathUtils.clamp(distance * 0.16, 0.22, 0.82)
    this.writeIndex = (this.writeIndex + 1) % SAMPLE_COUNT
    this.lastSample.copy(target)
    this.lastSampleAt = elapsed
  }
}
