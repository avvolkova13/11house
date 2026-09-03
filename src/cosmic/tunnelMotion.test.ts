import { describe, expect, it } from 'vitest'
import {
  getTunnelMotion,
  getTunnelPhase,
  getTunnelViewportFraming,
  sampleSurfacePoint,
} from './tunnelMotion'

describe('Mesh-reference tunnel phases', () => {
  it('clamps progress and resolves terrain, collapse, and dive phases', () => {
    expect(getTunnelPhase(-1)).toEqual(getTunnelPhase(0))
    expect(getTunnelPhase(2)).toEqual(getTunnelPhase(1))

    expect(getTunnelPhase(0.16)).toMatchObject({
      terrain: expect.any(Number),
      collapse: 0,
      dive: 0,
    })
    expect(getTunnelPhase(0.56).collapse).toBeGreaterThan(0)
    expect(getTunnelPhase(0.56).dive).toBe(0)
    expect(getTunnelPhase(0.9).dive).toBeGreaterThan(0)
  })

  it('keeps the vanishing point above and right while the opening tightens', () => {
    const forming = getTunnelMotion({
      mix: 0.28,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })
    const deep = getTunnelMotion({
      mix: 0.94,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })

    expect(deep.vanishingX).toBeGreaterThan(0)
    expect(deep.vanishingY).toBeGreaterThan(0)
    expect(deep.openingScale).toBeLessThan(forming.openingScale)
    expect(deep.starOpacity).toBeLessThan(forming.starOpacity)
    expect(deep.starOpacity).toBeGreaterThan(0)
  })
})

describe('Mesh-reference tunnel response', () => {
  it('keeps the offset throat visible in a narrow viewport', () => {
    expect(getTunnelViewportFraming(1280)).toEqual({
      cameraScale: 1,
      worldX: 0,
      worldY: 0,
      yaw: 0.035,
    })
    expect(getTunnelViewportFraming(390)).toEqual({
      cameraScale: 0.18,
      worldX: -12,
      worldY: -8,
      yaw: -0.06,
    })
  })

  it('maps signed wheel momentum to travel, streak, and camera roll', () => {
    const forward = getTunnelMotion({
      mix: 1,
      velocity: 8,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })
    const reverse = getTunnelMotion({
      mix: 1,
      velocity: -8,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })

    expect(forward.travelImpulse).toBeGreaterThan(0)
    expect(reverse.travelImpulse).toBeLessThan(0)
    expect(forward.roll).toBeGreaterThan(0)
    expect(reverse.roll).toBeLessThan(0)
    expect(forward.particleStretch).toBeGreaterThan(1)
  })

  it('removes travel impulse, streak, and roll for reduced motion', () => {
    expect(getTunnelMotion({
      mix: 1,
      velocity: 12,
      pointerX: 1,
      pointerY: 1,
      reducedMotion: true,
    })).toMatchObject({
      travelImpulse: 0,
      particleStretch: 1,
      roll: 0,
    })
  })

  it('turns the formed shell into a restrained reference-scale funnel', () => {
    const shell = getTunnelMotion({
      mix: 1,
      presentation: 0,
      dive: 0,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })
    const funnel = getTunnelMotion({
      mix: 1,
      presentation: 1,
      dive: 0,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })

    expect(shell.contourFrequency).toBe(112)
    expect(funnel.contourFrequency).toBe(120)
    expect(funnel.haloDensity).toBeGreaterThan(0.5)
  })

  it('moves the camera through one curved flight stage', () => {
    const start = getTunnelMotion({
      mix: 1,
      presentation: 1,
      dive: 0,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })
    const end = getTunnelMotion({
      mix: 1,
      presentation: 1,
      dive: 1,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })

    expect(start.cameraZ).toBe(0)
    expect(end.cameraZ).toBeLessThan(-8)
    expect(end.cameraX).toBeLessThan(0)
    expect(end.cameraY).toBeLessThan(0)
  })

  it('removes the camera flight for reduced motion', () => {
    expect(getTunnelMotion({
      mix: 1,
      presentation: 1,
      dive: 1,
      velocity: 9,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: true,
    })).toMatchObject({
      cameraX: 0,
      cameraY: 0,
      cameraZ: 0,
    })
  })
})

describe('single-surface morph sampling', () => {
  const baseInput = {
    x: 18.24,
    y: 21.2,
    mix: 0.64,
    elapsed: 3.2,
    travel: 7.5,
  }

  it('preserves every terrain vertex through the full morph', () => {
    expect(sampleSurfacePoint({ ...baseInput, mix: 0 })).toMatchObject({
      x: baseInput.x,
      y: baseInput.y,
    })
    expect(sampleSurfacePoint(baseInput)).toEqual(sampleSurfacePoint(baseInput))
  })

  it('moves continuously instead of crossfading between unrelated objects', () => {
    const before = sampleSurfacePoint({ ...baseInput, mix: 0.499 })
    const after = sampleSurfacePoint({ ...baseInput, mix: 0.501 })

    expect(Math.hypot(
      after.x - before.x,
      after.y - before.y,
      after.z - before.z,
    )).toBeLessThan(1)
  })

  it('stays asymmetric across mirrored surface lanes during collapse', () => {
    const left = sampleSurfacePoint({ ...baseInput, x: -31.92 })
    const right = sampleSurfacePoint({ ...baseInput, x: 31.92 })

    expect(Math.abs(left.x + right.x)).toBeGreaterThan(0.2)
    expect(Math.abs(left.z - right.z)).toBeGreaterThan(0.05)
  })

  it('narrows the same surface toward an offset far opening', () => {
    const near = sampleSurfacePoint({ ...baseInput, y: -110, mix: 1 })
    const far = sampleSurfacePoint({ ...baseInput, y: 110, mix: 1 })
    const nearRadius = Math.hypot(near.x, near.z)
    const farRadius = Math.hypot(far.x - 50, far.z - 62)

    expect(farRadius).toBeLessThan(nearRadius)
  })

  it('keeps the approved formation unchanged before final presentation', () => {
    const approved = sampleSurfacePoint({ ...baseInput, mix: 1 })
    const unchanged = sampleSurfacePoint({
      ...baseInput,
      mix: 1,
      presentation: 0,
      dive: 0,
    })

    expect(unchanged).toEqual(approved)
  })

  it('compacts the final funnel without recentering its opening', () => {
    const shell = sampleSurfacePoint({ ...baseInput, x: 40, y: -80, mix: 1 })
    const funnel = sampleSurfacePoint({
      ...baseInput,
      x: 40,
      y: -80,
      mix: 1,
      presentation: 1,
      dive: 0.5,
    })

    expect(Math.hypot(funnel.x, funnel.z)).toBeLessThan(Math.hypot(shell.x, shell.z))
    const opening = sampleSurfacePoint({
      ...baseInput,
      x: 0,
      y: 132.5,
      mix: 1,
      presentation: 1,
      dive: 1,
    })
    expect(opening.x).toBeGreaterThan(25)
    expect(opening.z).toBeGreaterThan(10)
  })

  it('keeps the mouth wide near the camera and narrows toward the far throat', () => {
    const nearEdge = sampleSurfacePoint({
      ...baseInput,
      x: 42,
      y: -120,
      mix: 1,
      presentation: 1,
    })
    const farEdge = sampleSurfacePoint({
      ...baseInput,
      x: 42,
      y: 120,
      mix: 1,
      presentation: 1,
    })

    const nearCenter = sampleSurfacePoint({
      ...baseInput,
      x: 0,
      y: -120,
      mix: 1,
      presentation: 1,
    })
    const farCenter = sampleSurfacePoint({
      ...baseInput,
      x: 0,
      y: 120,
      mix: 1,
      presentation: 1,
    })

    expect(Math.hypot(
      farEdge.x - farCenter.x,
      farEdge.z - farCenter.z,
    )).toBeLessThan(Math.hypot(
      nearEdge.x - nearCenter.x,
      nearEdge.z - nearCenter.z,
    ))
  })
})
