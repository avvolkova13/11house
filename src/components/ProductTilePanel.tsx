import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import {
  getProductTileMotion,
  getTiledPanelMotion,
} from '../hero/productTileMotion'

type ProductTilePanelProps = {
  active: boolean
  screenshot: string
  stageOffset: number
  reducedMotion: boolean
}

const COLUMNS = 12
const ROWS = 7
const TILE_SIZE = 0.92
const TILE_GAP = 0.085
const TILE_DEPTH = 0.18

const damp = (current: number, target: number, lambda: number, dt: number) => (
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
)

const createRoundedTileShape = () => {
  const half = TILE_SIZE / 2
  const radius = 0.09
  const shape = new THREE.Shape()
  shape.moveTo(-half + radius, -half)
  shape.lineTo(half - radius, -half)
  shape.quadraticCurveTo(half, -half, half, -half + radius)
  shape.lineTo(half, half - radius)
  shape.quadraticCurveTo(half, half, half - radius, half)
  shape.lineTo(-half + radius, half)
  shape.quadraticCurveTo(-half, half, -half, half - radius)
  shape.lineTo(-half, -half + radius)
  shape.quadraticCurveTo(-half, -half, -half + radius, -half)
  return shape
}

const remapTileUvs = (
  geometry: THREE.BufferGeometry,
  column: number,
  row: number,
) => {
  const uv = geometry.getAttribute('uv')
  const position = geometry.getAttribute('position')
  if (!uv || !position) return

  for (let index = 0; index < uv.count; index += 1) {
    const localU = THREE.MathUtils.clamp(position.getX(index) / TILE_SIZE + 0.5, 0, 1)
    const localV = THREE.MathUtils.clamp(position.getY(index) / TILE_SIZE + 0.5, 0, 1)
    uv.setXY(
      index,
      (column + localU) / COLUMNS,
      1 - (row + (1 - localV)) / ROWS,
    )
  }
  uv.needsUpdate = true
}

export function ProductTilePanel({
  active,
  screenshot,
  stageOffset,
  reducedMotion,
}: ProductTilePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  const stageOffsetRef = useRef(stageOffset)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    stageOffsetRef.current = stageOffset
  }, [stageOffset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.14

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
    camera.position.set(0, 0, 14.7)
    const panel = new THREE.Group()
    scene.add(panel)

    const texture = new THREE.TextureLoader().load(screenshot)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)

    const material = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xffffff,
      metalness: 0.18,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.075,
      envMapIntensity: 0.56,
      emissive: new THREE.Color(0x08051f),
      emissiveIntensity: 0.18,
    })

    const tiles: THREE.Mesh[] = []
    const basePositions: THREE.Vector3[] = []
    const shape = createRoundedTileShape()
    const panelWidth = COLUMNS * (TILE_SIZE + TILE_GAP) - TILE_GAP
    const panelHeight = ROWS * (TILE_SIZE + TILE_GAP) - TILE_GAP

    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: TILE_DEPTH,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.045,
          bevelThickness: 0.045,
          curveSegments: 3,
          steps: 1,
        })
        geometry.translate(0, 0, -TILE_DEPTH / 2)
        remapTileUvs(geometry, column, row)
        geometry.computeVertexNormals()

        const tile = new THREE.Mesh(geometry, material)
        const base = new THREE.Vector3(
          column * (TILE_SIZE + TILE_GAP) - panelWidth / 2 + TILE_SIZE / 2,
          panelHeight / 2 - row * (TILE_SIZE + TILE_GAP) - TILE_SIZE / 2,
          0,
        )
        tile.position.copy(base)
        panel.add(tile)
        tiles.push(tile)
        basePositions.push(base)
      }
    }

    scene.add(new THREE.AmbientLight(0x7069a8, 0.74))
    const keyLight = new THREE.DirectionalLight(0xe5e9ff, 3.4)
    keyLight.position.set(-6, 7, 10)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0x8f62ff, 28, 32, 1.6)
    rimLight.position.set(5, -2, 8)
    scene.add(rimLight)
    const warmLight = new THREE.PointLight(0xffc83d, 13, 28, 1.8)
    warmLight.position.set(-6, 0, 5)
    scene.add(warmLight)

    const pointerTarget = new THREE.Vector2()
    const pointer = new THREE.Vector2()
    const clock = new THREE.Clock()
    let raf = 0
    let disposed = false
    let width = 1
    let height = 1

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion) return
      const rect = canvas.getBoundingClientRect()
      pointerTarget.set(
        THREE.MathUtils.clamp(((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1, -1.25, 1.25),
        THREE.MathUtils.clamp(-(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1), -1.25, 1.25),
      )
    }

    const resize = () => {
      const nextWidth = Math.max(canvas.clientWidth, 1)
      const nextHeight = Math.max(canvas.clientHeight, 1)
      if (nextWidth === width && nextHeight === height) return
      width = nextWidth
      height = nextHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 900 ? 1.2 : 1.65))
      renderer.setSize(width, height, false)
    }

    const frame = () => {
      if (disposed) return
      raf = window.requestAnimationFrame(frame)
      resize()

      const dt = Math.min(clock.getDelta(), 1 / 24)
      const elapsed = clock.elapsedTime
      if (!activeRef.current) return

      pointer.x = damp(pointer.x, pointerTarget.x, 8.2, dt)
      pointer.y = damp(pointer.y, pointerTarget.y, 8.2, dt)
      const panelMotion = getTiledPanelMotion(stageOffsetRef.current)

      panel.position.x = damp(panel.position.x, pointer.x * 0.75, 6.8, dt)
      panel.position.y = damp(panel.position.y, panelMotion.y + pointer.y * 0.35, 5.6, dt)
      panel.position.z = damp(panel.position.z, panelMotion.z, 5.6, dt)
      panel.scale.setScalar(damp(panel.scale.x, panelMotion.scale, 5.8, dt))
      panel.rotation.x = damp(panel.rotation.x, panelMotion.rotationX - 0.035 - pointer.y * 0.18, 6.2, dt)
      panel.rotation.y = damp(panel.rotation.y, panelMotion.rotationY - 0.055 + pointer.x * 0.3, 6.2, dt)
      panel.rotation.z = damp(panel.rotation.z, 0.018 - pointer.x * 0.06, 6.2, dt)
      rimLight.position.x = damp(rimLight.position.x, pointer.x * 7.5, 5.8, dt)
      rimLight.position.y = damp(rimLight.position.y, pointer.y * 4.4, 5.8, dt)
      warmLight.position.x = damp(warmLight.position.x, pointer.x * 5.2 - 2.5, 4.2, dt)
      warmLight.position.y = damp(warmLight.position.y, pointer.y * 3.2 - 0.6, 4.2, dt)

      tiles.forEach((tile, index) => {
        const row = Math.floor(index / COLUMNS)
        const column = index % COLUMNS
        const motion = getProductTileMotion({
          column,
          row,
          columns: COLUMNS,
          rows: ROWS,
          stageOffset: stageOffsetRef.current,
          pointerX: pointer.x,
          pointerY: pointer.y,
          elapsed,
          reducedMotion,
        })
        const base = basePositions[index]
        tile.position.set(
          base.x + motion.x,
          base.y + motion.y,
          motion.z,
        )
        tile.rotation.set(motion.rotationX, motion.rotationY, motion.rotationZ)
        tile.scale.setScalar(motion.scale)
      })

      renderer.render(scene, camera)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('resize', resize, { passive: true })
    resize()
    frame()

    return () => {
      disposed = true
      window.cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', resize)
      tiles.forEach((tile) => tile.geometry.dispose())
      texture.dispose()
      material.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
    }
  }, [reducedMotion, screenshot])

  return (
    <figure className="hero-product-tiles" aria-hidden="true">
      <canvas ref={canvasRef} />
    </figure>
  )
}
