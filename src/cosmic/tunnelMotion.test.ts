import { describe, expect, it } from 'vitest'
import {
  getTunnelIdleMotion,
  getTunnelBackdrop,
  getTunnelMotion,
  getTunnelPhase,
  getTunnelViewportFraming,
  sampleSurfacePoint,
} from './tunnelMotion'
import { terrainVertexShader } from './shaders/nebula'

describe('tunnel visual continuity', () => {
  it('keeps the environment blue while the terrain becomes the tunnel', () => {
    expect(getTunnelBackdrop(0)).toEqual({ r: 1, g: 3, b: 8 })
    expect(getTunnelBackdrop(0.5)).toEqual(getTunnelBackdrop(0))
    expect(getTunnelBackdrop(1)).toEqual(getTunnelBackdrop(0))
  })
})

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

  it('keeps the vanishing point above and right without shrinking the opening', () => {
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
    expect(deep.openingScale).toBeGreaterThanOrEqual(forming.openingScale)
    expect(deep.starOpacity).toBeLessThan(forming.starOpacity)
    expect(deep.starOpacity).toBeGreaterThan(0)
  })
})

describe('Mesh-reference tunnel response', () => {
  it('keeps the throat centered across viewport framings', () => {
    expect(getTunnelViewportFraming(1280)).toEqual({
      cameraScale: 1,
      worldX: 0,
      worldY: 0,
      yaw: 0,
    })
    expect(getTunnelViewportFraming(390)).toEqual({
      cameraScale: 0.18,
      worldX: 0,
      worldY: 0,
      yaw: 0,
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
    const middle = getTunnelMotion({
      mix: 1,
      presentation: 1,
      dive: 0.5,
      velocity: 0,
      pointerX: 0,
      pointerY: 0,
      reducedMotion: false,
    })

    expect(start.cameraZ).toBe(0)
    expect(end.cameraZ).toBeLessThan(0)
    expect(end.cameraZ).toBeGreaterThan(-8)
    expect(middle.cameraX).toBeLessThan(0)
    expect(middle.cameraY).toBeLessThan(0)
    expect(Math.abs(end.cameraX)).toBeLessThan(0.1)
    expect(Math.abs(end.cameraY)).toBeLessThan(0.1)
  })

  it('keeps the projected mouth scale stable through the full flight', () => {
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
    const startDistance = Math.abs(start.surfaceDepth - (18 + start.cameraZ))
      / start.openingScale
    const endDistance = Math.abs(end.surfaceDepth - (18 + end.cameraZ))
      / end.openingScale

    expect(end.openingScale).toBeGreaterThanOrEqual(start.openingScale)
    expect(endDistance).toBeLessThanOrEqual(startDistance * 1.03)
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

describe('formed tunnel idle motion', () => {
  it('keeps orbit and flow visibly moving when scroll velocity is zero', () => {
    const start = getTunnelIdleMotion({
      elapsed: 0,
      presentation: 1,
      reducedMotion: false,
    })
    const later = getTunnelIdleMotion({
      elapsed: 3,
      presentation: 1,
      reducedMotion: false,
    })

    expect(Math.abs(later.orbit - start.orbit)).toBeGreaterThan(0.1)
    expect(later.flowSpeed).toBeGreaterThan(0.8)
    expect(Math.abs(later.cameraX - start.cameraX)).toBeGreaterThan(0.02)
  })

  it('removes continuous movement for reduced motion', () => {
    expect(getTunnelIdleMotion({
      elapsed: 12,
      presentation: 1,
      reducedMotion: true,
    })).toEqual({
      orbit: 0,
      flowSpeed: 0,
      cameraX: 0,
      cameraY: 0,
      cameraZ: 0,
      scale: 1,
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

  const sampleCrossSection = (y: number, dive = 1) => {
    const points = Array.from({ length: 64 }, (_, index) => sampleSurfacePoint({
      ...baseInput,
      x: -76 + (index + 0.5) * (152 / 64),
      y,
      mix: 1,
      presentation: 1,
      dive,
    }))
    const center = points.reduce(
      (sum, point) => ({ x: sum.x + point.x, z: sum.z + point.z }),
      { x: 0, z: 0 },
    )
    center.x /= points.length
    center.z /= points.length

    return {
      center,
      radius: Math.sqrt(points.reduce((sum, point) => (
        sum + (point.x - center.x) ** 2 + (point.z - center.z) ** 2
      ), 0) / points.length),
    }
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

  it('keeps the final tunnel radius stable and places its throat on the camera axis', () => {
    const startRadius = sampleCrossSection(-80, 0).radius
    const endRadius = sampleCrossSection(-80, 1).radius

    expect(endRadius).toBeGreaterThanOrEqual(startRadius * 0.98)
    const throat = sampleCrossSection(132.5).center
    const middle = sampleCrossSection(50).center
    expect(Math.abs(middle.x)).toBeLessThan(18)
    expect(Math.abs(throat.x)).toBeLessThan(4)
    expect(throat.z).toBeCloseTo(-25, 0)
  })

  it('keeps the GPU tunnel throat aligned with the sampled geometry', () => {
    expect(terrainVertexShader).toContain('- finalTaper * 51.0')
  })

  it('holds a long tubular body before tapering at the far throat', () => {
    const mouth = sampleCrossSection(-105).radius
    const middle = sampleCrossSection(50).radius
    const throat = sampleCrossSection(120).radius

    expect(middle).toBeGreaterThanOrEqual(mouth * 0.65)
    expect(throat).toBeLessThan(middle * 0.45)
  })

  it('wraps the wall around the viewer instead of forming one straight funnel sheet', () => {
    const samples = Array.from({ length: 25 }, (_, index) => {
      const y = -120 + index * 10
      const center = sampleCrossSection(y).center
      const point = sampleSurfacePoint({
        ...baseInput,
        x: 0,
        y,
        mix: 1,
        presentation: 1,
        dive: 1,
      })
      return Math.atan2(point.z - center.z, point.x - center.x)
    })
    const totalTurn = samples.slice(1).reduce((turn, angle, index) => {
      let delta = angle - samples[index]
      if (delta > Math.PI) delta -= Math.PI * 2
      if (delta < -Math.PI) delta += Math.PI * 2
      return turn + delta
    }, 0)

    expect(Math.abs(totalTurn)).toBeGreaterThan(4.2)
  })

  it('uses a tall rotating passage profile instead of flattened vortex rings', () => {
    const y = 50
    const { center } = sampleCrossSection(y)
    const points = Array.from({ length: 64 }, (_, index) => sampleSurfacePoint({
      ...baseInput,
      x: -76 + (index + 0.5) * (152 / 64),
      y,
      mix: 1,
      presentation: 1,
      dive: 1,
    }))
    const halfWidth = Math.max(...points.map((point) => Math.abs(point.x - center.x)))
    const halfHeight = Math.max(...points.map((point) => Math.abs(point.z - center.z)))

    expect(halfHeight / halfWidth).toBeGreaterThan(0.95)
    expect(halfHeight / halfWidth).toBeLessThan(1.25)
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
