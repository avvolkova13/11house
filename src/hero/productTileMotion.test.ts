import { describe, expect, it } from 'vitest'
import {
  getProductTileMotion,
  getTiledPanelMotion,
} from './productTileMotion'
import type { TiledPanelMotion } from './productTileMotion'

const tileInput = (
  overrides: Partial<Parameters<typeof getProductTileMotion>[0]> = {},
): Parameters<typeof getProductTileMotion>[0] => ({
  column: 5,
  row: 3,
  columns: 10,
  rows: 7,
  stageOffset: 0,
  pointerX: 0,
  pointerY: 0,
  elapsed: 0,
  reducedMotion: false,
  ...overrides,
})

describe('getTiledPanelMotion', () => {
  it('brings the panel from depth through a close camera pass', () => {
    const incoming = getTiledPanelMotion(0.82)
    const focus = getTiledPanelMotion(0)
    const outgoing = getTiledPanelMotion(-0.72)

    expect(incoming.scale).toBeLessThan(0.22)
    expect(focus.scale).toBeGreaterThan(0.48)
    expect(focus.scale).toBeLessThan(0.68)
    expect(outgoing.scale).toBeGreaterThan(focus.scale * 0.86)
    expect(focus.opacity).toBe(1)
  })

  it('approaches without turning the whole panel into a fullscreen wall', () => {
    const focus = getTiledPanelMotion(0)
    const outgoing = getTiledPanelMotion(-0.58) as TiledPanelMotion & { y?: number }
    const cameraZ = 14.7
    const focusProjection = focus.scale / (cameraZ - focus.z)
    const outgoingProjection = outgoing.scale / (cameraZ - outgoing.z)

    expect(outgoing.scale).toBeGreaterThan(focus.scale)
    expect(outgoing.z).toBeGreaterThan(1)
    expect(outgoing.z).toBeLessThan(3)
    expect(outgoingProjection / focusProjection).toBeGreaterThan(1.15)
    expect(outgoingProjection / focusProjection).toBeLessThan(1.65)
    expect(outgoing.y).toBeLessThan(-1.7)
    expect(outgoing.bend).toBeGreaterThan(1.1)
  })

  it('keeps the panel curved at focus and breaks it apart on exit', () => {
    expect(getTiledPanelMotion(0).bend).toBeGreaterThan(0.3)
    expect(getTiledPanelMotion(0.4).breakaway).toBe(0)
    expect(getTiledPanelMotion(-0.72).breakaway).toBeGreaterThan(0.5)
  })
})

describe('getProductTileMotion', () => {
  it('folds neighbouring tiles to opposite sides of the cursor seam', () => {
    const left = getProductTileMotion({
      column: 4,
      row: 3,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: 0,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })
    const right = getProductTileMotion({
      column: 5,
      row: 3,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: 0,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })

    expect(Math.abs(left.z - right.z)).toBeGreaterThan(0.3)
    expect(Math.sign(left.rotationY)).not.toBe(Math.sign(right.rotationY))
  })

  it('lets the cursor pull the membrane laterally', () => {
    const leftPointer = getProductTileMotion({
      column: 5,
      row: 3,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: -0.8,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })
    const rightPointer = getProductTileMotion({
      column: 5,
      row: 3,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: 0.8,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })

    expect(rightPointer.x - leftPointer.x).toBeGreaterThan(0.2)
  })

  it('keeps a subtle asymmetric twist before pointer interaction', () => {
    const tile = getProductTileMotion({
      column: 2,
      row: 1,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: 1.25,
      pointerY: -1.25,
      elapsed: 0,
      reducedMotion: false,
    })

    expect(Math.abs(tile.rotationZ)).toBeGreaterThan(0.01)
  })

  it('creates a local three-dimensional cursor wave', () => {
    const near = getProductTileMotion({
      column: 3,
      row: 3,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: -0.3,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })
    const far = getProductTileMotion({
      column: 9,
      row: 0,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: -0.3,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })
    const nearWithoutPointer = getProductTileMotion({
      column: 3,
      row: 3,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: 1.25,
      pointerY: -1.25,
      elapsed: 0,
      reducedMotion: false,
    })

    expect(near.z).toBeGreaterThan(far.z)
    expect(Math.abs(near.rotationY - nearWithoutPointer.rotationY)).toBeGreaterThan(0.04)
  })

  it('keeps the early exit grid horizontally coherent', () => {
    const left = getProductTileMotion(tileInput({
      column: 0,
      row: 3,
      stageOffset: -0.28,
    }))
    const right = getProductTileMotion(tileInput({
      column: 9,
      row: 3,
      stageOffset: -0.28,
    }))

    expect(Math.abs(left.x)).toBeLessThan(0.45)
    expect(Math.abs(right.x)).toBeLessThan(0.45)
    expect(Math.abs(left.y - right.y)).toBeLessThan(0.22)
  })

  it('releases lower rows through the camera before upper rows', () => {
    const top = getProductTileMotion(tileInput({
      column: 5,
      row: 0,
      stageOffset: -0.5,
    }))
    const bottom = getProductTileMotion(tileInput({
      column: 5,
      row: 6,
      stageOffset: -0.5,
    }))

    expect(bottom.z).toBeGreaterThan(top.z + 0.8)
    expect(bottom.y).toBeLessThan(top.y - 0.45)
  })

  it('bows the near surface around the centre instead of pushing flat edges at the camera', () => {
    const centre = getProductTileMotion(tileInput({
      column: 5,
      row: 5,
      stageOffset: -0.5,
    }))
    const edge = getProductTileMotion(tileInput({
      column: 0,
      row: 5,
      stageOffset: -0.5,
    }))

    expect(centre.z).toBeGreaterThan(edge.z + 0.75)
    expect(Math.abs(edge.rotationY)).toBeGreaterThan(0.35)
  })

  it('fans the lower row wider than the upper row during the close pass', () => {
    const upperEdge = getProductTileMotion(tileInput({
      column: 0,
      row: 0,
      stageOffset: -0.58,
    }))
    const lowerEdge = getProductTileMotion(tileInput({
      column: 0,
      row: 6,
      stageOffset: -0.58,
    }))

    expect(Math.abs(lowerEdge.x)).toBeGreaterThan(Math.abs(upperEdge.x) + 0.42)
  })

  it('keeps neighbouring tiles on the same release arc', () => {
    const first = getProductTileMotion(tileInput({
      column: 4,
      row: 5,
      stageOffset: -0.58,
    }))
    const second = getProductTileMotion(tileInput({
      column: 5,
      row: 5,
      stageOffset: -0.58,
    }))

    expect(Math.abs(first.y - second.y)).toBeLessThan(0.12)
    expect(Math.abs(first.z - second.z)).toBeLessThan(0.22)
  })

  it('opens a tall row corridor instead of leaving a dense wall', () => {
    const top = getProductTileMotion(tileInput({
      column: 5,
      row: 0,
      stageOffset: -0.58,
    }))
    const bottom = getProductTileMotion(tileInput({
      column: 5,
      row: 6,
      stageOffset: -0.58,
    }))

    expect(top.y - bottom.y).toBeGreaterThan(2.4)
    expect(bottom.z).toBeGreaterThan(2.1)
  })

  it('sends the lower tail beyond the camera while the upper arc remains readable', () => {
    const top = getProductTileMotion(tileInput({
      column: 5,
      row: 0,
      stageOffset: -0.68,
    }))
    const bottom = getProductTileMotion(tileInput({
      column: 5,
      row: 6,
      stageOffset: -0.68,
    }))

    expect(bottom.z - top.z).toBeGreaterThan(1.5)
    expect(top.y).toBeGreaterThan(0.8)
    expect(bottom.y).toBeLessThan(-2.2)
  })

  it('reduces the final tiles to sparse camera-pass fragments', () => {
    const tailTile = getProductTileMotion(tileInput({
      column: 3,
      row: 2,
      stageOffset: -0.68,
    }))

    expect(tailTile.scale).toBeLessThan(0.2)
  })

  it('does not park tail fragments on the camera plane', () => {
    const panel = getTiledPanelMotion(-0.68)
    const cameraZ = 14.7
    const nearestDistance = Array.from({ length: 7 }, (_, row) => (
      Array.from({ length: 10 }, (_, column) => {
        const tile = getProductTileMotion(tileInput({
          column,
          row,
          stageOffset: -0.68,
        }))
        return Math.abs(cameraZ - (panel.z + tile.z))
      })
    )).flat().reduce((nearest, distance) => Math.min(nearest, distance), Infinity)

    expect(nearestDistance).toBeGreaterThan(1.25)
  })

  it('assembles from depth with the lower rows trailing behind', () => {
    const top = getProductTileMotion({
      column: 5,
      row: 0,
      columns: 10,
      rows: 7,
      stageOffset: 0.8,
      pointerX: 0,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })
    const bottom = getProductTileMotion({
      column: 5,
      row: 6,
      columns: 10,
      rows: 7,
      stageOffset: 0.8,
      pointerX: 0,
      pointerY: 0,
      elapsed: 0,
      reducedMotion: false,
    })

    expect(bottom.y).toBeLessThan(top.y)
    expect(bottom.z).toBeLessThan(top.z)
    expect(Math.abs(bottom.rotationX)).toBeGreaterThan(Math.abs(top.rotationX))
  })

  it('removes idle and pointer motion for reduced motion', () => {
    const tile = getProductTileMotion({
      column: 4,
      row: 3,
      columns: 10,
      rows: 7,
      stageOffset: 0,
      pointerX: 0.9,
      pointerY: -0.8,
      elapsed: 12,
      reducedMotion: true,
    })

    expect(tile.rotationX).toBe(0)
    expect(tile.rotationY).toBe(0)
    expect(tile.x).toBe(0)
    expect(tile.idle).toBe(0)
  })
})
