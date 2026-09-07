import { Mesh, MeshBasicMaterial, Texture } from 'three'
import { describe, expect, it, vi } from 'vitest'
import {
  createDialRig,
  createLifecycleController,
  getPrismScreenScale,
  renderCompositePipeline,
} from './NatalDialScene'
import { FullscreenPass } from './FullscreenPass'

describe('NatalDialScene lifecycle', () => {
  it('keeps the shader prism at the reference scale relative to the dial', () => {
    expect(getPrismScreenScale(1)).toBeCloseTo(0.88, 8)
  })

  it('does not tone-map intermediate shader passes twice', () => {
    const pass = new FullscreenPass('void main() { gl_FragColor = vec4(1.0); }', {})

    expect(pass.material.toneMapped).toBe(false)
    pass.dispose()
  })

  it('composites the 3D dial through the dedicated raymarched glass pass', () => {
    const stages: string[] = []

    renderCompositePipeline({
      scene: () => stages.push('scene'),
      glass: () => stages.push('glass'),
      composite: () => stages.push('composite'),
    })

    expect(stages).toEqual(['scene', 'glass', 'composite'])
  })

  it('creates a two-layer spatial dial rig around its own center', () => {
    const rig = createDialRig(new Texture(), [new Texture(), new Texture(), new Texture()])
    const inner = rig.getObjectByName('inner-dial-plane') as Mesh
    const outerPlanes = [0, 1, 2].map((index) => (
      rig.getObjectByName(`outer-dial-plane-${index}`) as Mesh
    ))

    expect(rig.name).toBe('dial-rig')
    expect(rig.position.z).toBe(-1)
    expect(inner).toBeInstanceOf(Mesh)
    expect(outerPlanes).toHaveLength(3)
    outerPlanes.forEach((outer) => expect(outer).toBeInstanceOf(Mesh))
    expect(inner.position.z).toBe(0)
    outerPlanes.forEach((outer) => expect(outer.position.z).toBeLessThan(inner.position.z))
    expect(new Set(outerPlanes.map((outer) => outer.position.z)).size).toBe(3)
    expect((inner.material as MeshBasicMaterial).transparent).toBe(false)
    expect((inner.material as MeshBasicMaterial).alphaTest).toBeGreaterThanOrEqual(0.05)
    expect((inner.material as MeshBasicMaterial).depthWrite).toBe(true)
  })

  it('starts only one frame loop and cancels it on dispose', () => {
    const request = vi.fn(() => 7)
    const cancel = vi.fn()
    const controller = createLifecycleController({ request, cancel })

    controller.start(() => undefined)
    controller.start(() => undefined)

    expect(request).toHaveBeenCalledTimes(1)
    controller.dispose()
    expect(cancel).toHaveBeenCalledWith(7)
  })

  it('is safe to dispose twice', () => {
    const controller = createLifecycleController({
      request: () => 1,
      cancel: () => undefined,
    })

    expect(() => {
      controller.dispose()
      controller.dispose()
    }).not.toThrow()
  })
})
