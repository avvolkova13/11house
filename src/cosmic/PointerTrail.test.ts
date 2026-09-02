import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { PointerTrail } from './PointerTrail'

describe('PointerTrail', () => {
  it('eases the active cursor energy in and out', () => {
    const trail = new PointerTrail()
    trail.tick(0.1, 0.1, new THREE.Vector2(4, -8))
    expect(trail.cursorEnergy).toBeGreaterThan(0)
    expect(trail.cursorEnergy).toBeLessThan(0.25)

    const activeEnergy = trail.cursorEnergy
    trail.tick(0.25, 0.35, null)
    expect(trail.cursorEnergy).toBeLessThan(activeEnergy)
  })

  it('samples only after enough terrain-space movement', () => {
    const trail = new PointerTrail()
    trail.tick(0.016, 0.016, new THREE.Vector2(0, 0))
    trail.tick(0.016, 0.032, new THREE.Vector2(0.3, 0.2))
    expect(trail.weights.filter((weight) => weight > 0).length).toBe(0)

    trail.tick(0.032, 0.064, new THREE.Vector2(2.2, 0.2))
    expect(trail.weights.filter((weight) => weight > 0).length).toBe(1)
  })

  it('decays old samples while preserving a fixed twelve-slot ring buffer', () => {
    const trail = new PointerTrail()
    trail.tick(0.016, 0.016, new THREE.Vector2(0, 0))
    trail.tick(0.032, 0.048, new THREE.Vector2(3, 0))
    const initialWeight = Math.max(...trail.weights)

    trail.tick(0.5, 0.548, null)
    expect(Math.max(...trail.weights)).toBeLessThan(initialWeight)

    for (let index = 1; index <= 20; index += 1) {
      trail.tick(0.04, 0.548 + index * 0.04, new THREE.Vector2(index * 2, index))
    }
    expect(trail.centers).toHaveLength(12)
    expect(trail.weights).toHaveLength(12)
    expect(trail.weights.every((weight) => weight >= 0 && weight <= 0.82)).toBe(true)
  })
})
