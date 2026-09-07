import {
  AdditiveBlending,
  Box3,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  Vector3,
} from 'three'
import { describe, expect, it } from 'vitest'
import { createPrismAssembly, createPrismEnvironmentScene } from './physicalPrism'

describe('physical prism assembly', () => {
  it('uses real rounded geometry with transmissive glass and an opaque inner core', () => {
    const prism = createPrismAssembly()
    const shell = prism.getObjectByName('glass-shell') as Mesh
    const core = prism.getObjectByName('dark-core') as Mesh
    const overlay = prism.getObjectByName('facet-overlay') as Mesh
    const frontFacets = prism.getObjectByName('front-facets')

    expect(shell).toBeInstanceOf(Mesh)
    expect(shell.geometry.type).toBe('ExtrudeGeometry')
    expect(shell.geometry.attributes.normal).toBeDefined()
    expect(shell.geometry.attributes.position.count).toBeGreaterThan(100)
    expect(shell.material).toBeInstanceOf(MeshPhysicalMaterial)
    expect((shell.material as MeshPhysicalMaterial).transmission).toBeGreaterThanOrEqual(0.85)
    expect((shell.material as MeshPhysicalMaterial).transmission).toBeLessThanOrEqual(0.95)
    expect((shell.material as MeshPhysicalMaterial).dispersion).toBeGreaterThanOrEqual(0.65)
    expect((shell.material as MeshPhysicalMaterial).thickness).toBeGreaterThanOrEqual(0.12)
    expect((shell.material as MeshPhysicalMaterial).thickness).toBeLessThanOrEqual(0.3)
    expect((shell.material as MeshPhysicalMaterial).attenuationDistance).toBeGreaterThanOrEqual(50)
    expect((shell.material as MeshPhysicalMaterial).iridescence).toBeGreaterThanOrEqual(0.4)
    expect((shell.material as MeshPhysicalMaterial).roughness).toBeGreaterThanOrEqual(0.05)
    expect((shell.material as MeshPhysicalMaterial).flatShading).toBe(true)

    expect(core).toBeInstanceOf(Mesh)
    expect(core.material).toBeInstanceOf(MeshStandardMaterial)
    expect((core.material as MeshStandardMaterial).transparent).toBe(false)
    expect((core.material as MeshStandardMaterial).roughness).toBeGreaterThanOrEqual(0.2)
    expect(core.scale.x).toBeLessThan(shell.scale.x)

    const shellSize = new Box3().setFromObject(shell).getSize(new Vector3())
    const coreSize = new Box3().setFromObject(core).getSize(new Vector3())
    expect(shellSize.x / shellSize.y).toBeLessThanOrEqual(1.2)
    expect(coreSize.x).toBeLessThan(shellSize.x)
    expect(coreSize.y).toBeLessThan(shellSize.y)
    expect(coreSize.z).toBeLessThan(shellSize.z)
    expect(coreSize.x / shellSize.x).toBeLessThan(0.48)
    expect(coreSize.y / shellSize.y).toBeLessThan(0.58)
    expect(core.position.z).toBeGreaterThan(0.2)

    expect(overlay.material).toBeInstanceOf(ShaderMaterial)
    expect((overlay.material as ShaderMaterial).transparent).toBe(true)
    expect((overlay.material as ShaderMaterial).depthWrite).toBe(false)
    expect((overlay.material as ShaderMaterial).blending).toBe(AdditiveBlending)
    expect((overlay.material as ShaderMaterial).uniforms.uCrystalFill.value).toBeGreaterThanOrEqual(0.03)
    expect((overlay.material as ShaderMaterial).uniforms.uCrystalFill.value).toBeLessThanOrEqual(0.06)
    expect((overlay.material as ShaderMaterial).uniforms.uCausticStrength.value).toBeGreaterThanOrEqual(0.15)
    expect(overlay.visible).toBe(true)
    expect(frontFacets).toBeUndefined()
  })

  it('builds a mostly black environment from three narrow luminous panels', () => {
    const environment = createPrismEnvironmentScene()
    const panels = environment.children.filter((child) => child instanceof Mesh) as Mesh[]

    expect(environment.background).toBeInstanceOf(Color)
    expect((environment.background as Color).getHex()).toBe(0x000000)
    expect(panels).toHaveLength(3)
    expect(panels.every((panel) => panel.material instanceof MeshBasicMaterial)).toBe(true)
    expect(panels.every((panel) => panel.scale.y < panel.scale.x)).toBe(true)
  })
})
