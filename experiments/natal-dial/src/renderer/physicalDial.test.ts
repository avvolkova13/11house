import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, Texture, TubeGeometry } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { CYCLE_MS, getMotionFrame } from '../motion'
import {
  createPhysicalDialRig,
  disposePhysicalDialRig,
  updatePhysicalDialRig,
} from './physicalDial'

describe('physical natal dial rig', () => {
  it('creates one closed orbit and three independent segmented spatial arcs', () => {
    const rig = createPhysicalDialRig(new Texture())
    const inner = rig.getObjectByName('inner-orbit') as Group
    const outerLayers = [0, 1, 2].map((index) => rig.getObjectByName(`outer-arc-${index}`) as Group)

    expect(inner).toBeInstanceOf(Group)
    expect(outerLayers.every((layer) => layer instanceof Group)).toBe(true)
    expect(inner.children.filter((child) => child instanceof Mesh)).toHaveLength(3)
    expect(inner.children.every((child) => (child as Mesh).geometry instanceof TubeGeometry)).toBe(true)
    expect(outerLayers.every((layer) => layer.children.length >= 6)).toBe(true)
    expect(outerLayers.every((layer) => layer.children.every((child) => (
      (child as Mesh).geometry instanceof TubeGeometry
    )))).toBe(true)
  })

  it('keeps chromatic edges and the natal marker atlas as transparent physical layers', () => {
    const rig = createPhysicalDialRig(new Texture())
    const inner = rig.getObjectByName('inner-orbit') as Group
    const materials = inner.children.map((child) => (child as Mesh).material as MeshBasicMaterial)
    const markers = rig.getObjectByName('natal-markers') as Mesh

    expect(materials.map((material) => material.color.getHex())).toEqual([
      0x20d8ff,
      0xff583d,
      0xf7f2e8,
    ])
    expect(materials.every((material) => material.transparent)).toBe(true)
    expect(markers.geometry).toBeInstanceOf(PlaneGeometry)
    expect((markers.material as MeshBasicMaterial).transparent).toBe(true)
    expect((markers.material as MeshBasicMaterial).depthWrite).toBe(false)
  })

  it('updates the layer transforms independently from one motion frame', () => {
    const rig = createPhysicalDialRig(new Texture())
    const frame = getMotionFrame(CYCLE_MS * 0.25, false)
    updatePhysicalDialRig(rig, frame)

    expect(rig.rotation.x).toBeCloseTo(frame.dialRig.pitch)
    expect(rig.rotation.y).toBeCloseTo(frame.dialRig.yaw)
    expect(rig.rotation.z).toBeCloseTo(frame.dialRig.roll)
    const rotations = [0, 1, 2].map((index) => {
      const layer = rig.getObjectByName(`outer-arc-${index}`) as Group
      return `${layer.rotation.x}:${layer.rotation.y}:${layer.rotation.z}`
    })
    expect(new Set(rotations).size).toBe(3)
  })

  it('disposes every generated geometry and material', () => {
    const rig = createPhysicalDialRig(new Texture())
    const meshes: Mesh[] = []
    rig.traverse((object) => {
      if (object instanceof Mesh) meshes.push(object)
    })
    const geometrySpies = meshes.map((mesh) => vi.spyOn(mesh.geometry, 'dispose'))
    const materialSpies = meshes.map((mesh) => vi.spyOn(mesh.material as MeshBasicMaterial, 'dispose'))

    disposePhysicalDialRig(rig)

    geometrySpies.forEach((spy) => expect(spy).toHaveBeenCalledOnce())
    materialSpies.forEach((spy) => expect(spy).toHaveBeenCalledOnce())
  })
})
