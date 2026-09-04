const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const progress = clamp01((value - edge0) / (edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

export type TiledPanelMotion = {
  opacity: number
  scale: number
  bend: number
  breakaway: number
  cameraPass: number
  rowRelease: number
  tail: number
  rotationX: number
  rotationY: number
  y: number
  z: number
}

export const getTiledPanelMotion = (stageOffset: number): TiledPanelMotion => {
  const distance = Math.abs(stageOffset)
  const incoming = stageOffset > 0
  const arrival = 1 - smoothstep(0.02, 0.9, distance)
  const exit = incoming ? 0 : smoothstep(0.08, 0.72, -stageOffset)
  const cameraPass = smoothstep(0.06, 0.78, exit)
  const rowRelease = smoothstep(0.42, 0.9, exit)
  const tail = smoothstep(0.9, 0.995, exit)

  return {
    opacity: 1 - smoothstep(0.72, 1, distance),
    scale: incoming
      ? 0.12 + arrival * 0.44
      : 0.56 + cameraPass * 0.06,
    bend: incoming
      ? 0.28 + arrival * 0.28
      : 0.56 + cameraPass * 1.14,
    breakaway: exit,
    cameraPass,
    rowRelease,
    tail,
    rotationX: incoming
      ? -(1 - arrival) * 0.22
      : -cameraPass * 0.1,
    rotationY: incoming ? (1 - arrival) * 0.08 : -cameraPass * 0.055,
    y: incoming ? (1 - arrival) * 1.5 : -cameraPass * 2.05,
    z: incoming ? -9.5 * (1 - arrival) : cameraPass * 1.55,
  }
}

type ProductTileMotionInput = {
  column: number
  row: number
  columns: number
  rows: number
  stageOffset: number
  pointerX: number
  pointerY: number
  elapsed: number
  reducedMotion: boolean
}

export type ProductTileMotion = {
  x: number
  y: number
  z: number
  rotationX: number
  rotationY: number
  rotationZ: number
  scale: number
  idle: number
}

export const getProductTileMotion = ({
  column,
  row,
  columns,
  rows,
  stageOffset,
  pointerX,
  pointerY,
  elapsed,
  reducedMotion,
}: ProductTileMotionInput): ProductTileMotion => {
  const nx = columns > 1 ? column / (columns - 1) * 2 - 1 : 0
  const ny = rows > 1 ? 1 - row / (rows - 1) * 2 : 0
  const panel = getTiledPanelMotion(stageOffset)
  const rowProgress = rows > 1 ? row / (rows - 1) : 0
  const rowArc = rowProgress * 2 - 1
  const columnProgress = columns > 1 ? column / (columns - 1) : 0.5
  const centerArc = 1 - Math.abs(columnProgress * 2 - 1)
  const interactionStrength = reducedMotion
    ? 0
    : 1 - smoothstep(0.08, 0.38, panel.breakaway)
  const idle = reducedMotion ? 0 : Math.sin(elapsed * 0.72 + column * 0.41 + row * 0.27) * 0.035
  const dx = nx - pointerX
  const dy = ny - pointerY
  const pointerDistance = Math.hypot(dx, dy)
  const pointerWave = reducedMotion
    ? 0
    : Math.exp(-pointerDistance * pointerDistance * 1.45) * interactionStrength
  const cursorAxis = dx + dy * 0.22
  const pointerSlice = reducedMotion
    ? 0
    : Math.tanh(cursorAxis * 10)
      * Math.exp(-cursorAxis * cursorAxis * 14)
      * Math.exp(-dy * dy * 0.35)
      * interactionStrength
  const pointerReach = reducedMotion
    ? 0
    : Math.exp(-pointerDistance * pointerDistance * 0.75) * interactionStrength
  const pointerFollowX = reducedMotion
    ? 0
    : pointerX * 0.32 * (0.45 + pointerReach * 0.55) * interactionStrength
  const staticTwist = reducedMotion
    ? 0
    : nx * ny * 0.16 + Math.sin(nx * 1.7 + ny * 2.4) * 0.055
  const staticRoll = reducedMotion
    ? 0
    : nx * ny * 0.07 + Math.sin(nx * 1.7 + ny * 2.4) * 0.02
  const horizontalCrown = centerArc * centerArc * panel.bend * 0.2
  const verticalCurl = Math.pow(rowProgress, 1.7) * centerArc * panel.bend * 0.24
  const edgeRecession = Math.abs(nx) * panel.bend * 0.35
  const curvature = horizontalCrown + verticalCurl - edgeRecession
  const assembly = smoothstep(0.1, 0.92, stageOffset) * Math.pow(rowProgress, 2.2)
  const direction = ((column + row) % 2 === 0 ? 1 : -1)
  const rowDelay = (1 - rowProgress) * 0.16
  const rowPass = smoothstep(0.18 + rowDelay, 0.82 + rowDelay, panel.cameraPass)
  const rowDetach = smoothstep(0.36 + rowDelay, 0.92 + rowDelay, panel.rowRelease)
  const tailSeed = Math.sin((column + 1) * 91.73 + (row + 1) * 47.17) * 43758.5453
  const tailVariance = tailSeed - Math.floor(tailSeed)
  const tailDepth = tailVariance > 0.24
    ? 17
    : -(3 + rowProgress * 5.2)

  return {
    x: nx * rowDetach * 0.34
      + nx * rowPass * rowProgress * 0.62
      + nx * panel.tail * (1.15 + tailVariance * 0.7)
      + nx * assembly * 0.22
      + pointerFollowX
      + pointerSlice * 0.07,
    y: -rowPass * (0.18 + rowProgress * 1.15)
      + (1 - rowProgress) * rowDetach * 0.24
      - rowArc * rowDetach * 1.3
      - panel.tail * (0.35 + rowProgress * 0.55)
      - assembly * 0.9
      + pointerY * 0.18 * pointerReach
      + staticTwist * 0.08
      + pointerSlice * 0.03,
    z: curvature
      + rowPass * (0.2 + rowProgress * 0.55 + centerArc * 0.12)
      + rowDetach * rowProgress * 0.85
      + panel.tail * panel.tail * panel.tail * tailDepth
      + staticTwist
      + pointerWave * 0.52
      - pointerSlice * 0.35
      + idle
      - assembly * 1.65,
    rotationX: reducedMotion
      ? 0
      : -ny * panel.bend * 0.16
        + pointerWave * dy * 0.5
        + pointerSlice * 0.08
        + rowDetach * (0.16 + rowProgress * 0.62)
        + rowDetach * (1 - rowProgress) * 0.5
        + panel.tail * (tailVariance - 0.5) * 0.42
        - assembly * 0.58,
    rotationY: reducedMotion
      ? 0
        : nx * panel.bend * 0.28
        + nx * rowDetach * 0.2
        + panel.tail * (tailVariance - 0.5) * 0.28
        - pointerSlice * 0.35
        + pointerX * pointerReach * 0.16,
    rotationZ: reducedMotion
      ? 0
      : staticRoll
        + nx * rowDetach * 0.06
        + panel.tail * (tailVariance - 0.5) * 0.26
        + pointerSlice * 0.03
        + direction * assembly * 0.045,
    scale: (1 + rowPass * 0.035 - assembly * 0.08 - panel.tail * tailVariance * 0.08)
      * (1 - panel.tail * 0.88),
    idle,
  }
}
