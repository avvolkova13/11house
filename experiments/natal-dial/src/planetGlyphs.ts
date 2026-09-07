export const PLANET_VECTOR_IDS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const

type Stroke = (context: CanvasRenderingContext2D) => void

function circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.moveTo(x + radius, y)
  context.arc(x, y, radius, 0, Math.PI * 2)
}

const strokeSun: Stroke = (context) => {
  circle(context, 0, 0, 0.34)
  circle(context, 0, 0, 0.045)
}

const strokeMoon: Stroke = (context) => {
  context.moveTo(0.22, -0.39)
  context.bezierCurveTo(-0.35, -0.27, -0.35, 0.27, 0.22, 0.39)
  context.bezierCurveTo(-0.06, 0.19, -0.06, -0.19, 0.22, -0.39)
}

const strokeMercury: Stroke = (context) => {
  circle(context, 0, -0.06, 0.23)
  context.moveTo(-0.22, -0.24)
  context.bezierCurveTo(-0.15, -0.46, 0.15, -0.46, 0.22, -0.24)
  context.moveTo(0, 0.17)
  context.lineTo(0, 0.47)
  context.moveTo(-0.16, 0.34)
  context.lineTo(0.16, 0.34)
}

const strokeVenus: Stroke = (context) => {
  circle(context, 0, -0.11, 0.27)
  context.moveTo(0, 0.16)
  context.lineTo(0, 0.47)
  context.moveTo(-0.17, 0.33)
  context.lineTo(0.17, 0.33)
}

const strokeMars: Stroke = (context) => {
  circle(context, -0.1, 0.1, 0.27)
  context.moveTo(0.1, -0.1)
  context.lineTo(0.42, -0.42)
  context.moveTo(0.17, -0.42)
  context.lineTo(0.42, -0.42)
  context.lineTo(0.42, -0.17)
}

const strokeJupiter: Stroke = (context) => {
  context.moveTo(-0.36, -0.17)
  context.bezierCurveTo(-0.03, -0.48, 0.24, -0.34, 0.07, -0.02)
  context.lineTo(-0.22, 0.31)
  context.lineTo(0.33, 0.31)
  context.moveTo(0.2, -0.45)
  context.lineTo(0.2, 0.47)
}

const strokeSaturn: Stroke = (context) => {
  context.moveTo(-0.22, -0.46)
  context.lineTo(-0.22, 0.44)
  context.moveTo(-0.42, -0.25)
  context.lineTo(0.02, -0.25)
  context.moveTo(-0.2, -0.02)
  context.bezierCurveTo(0.28, -0.23, 0.4, 0.06, 0.11, 0.43)
}

const strokeUranus: Stroke = (context) => {
  circle(context, 0, 0.27, 0.13)
  context.moveTo(0, -0.42)
  context.lineTo(0, 0.14)
  context.moveTo(-0.37, -0.35)
  context.lineTo(-0.37, 0.1)
  context.lineTo(0.37, 0.1)
  context.lineTo(0.37, -0.35)
}

const strokeNeptune: Stroke = (context) => {
  context.moveTo(-0.39, -0.3)
  context.bezierCurveTo(-0.3, 0.02, -0.14, 0.11, 0, 0.12)
  context.bezierCurveTo(0.14, 0.11, 0.3, 0.02, 0.39, -0.3)
  context.moveTo(-0.39, -0.3)
  context.lineTo(-0.24, -0.19)
  context.moveTo(-0.39, -0.3)
  context.lineTo(-0.42, -0.1)
  context.moveTo(0.39, -0.3)
  context.lineTo(0.24, -0.19)
  context.moveTo(0.39, -0.3)
  context.lineTo(0.42, -0.1)
  context.moveTo(0, -0.42)
  context.lineTo(0, 0.47)
  context.moveTo(-0.18, 0.32)
  context.lineTo(0.18, 0.32)
}

const strokePluto: Stroke = (context) => {
  circle(context, 0, -0.26, 0.18)
  context.moveTo(-0.32, -0.05)
  context.bezierCurveTo(-0.27, 0.23, 0.27, 0.23, 0.32, -0.05)
  context.moveTo(0, 0.17)
  context.lineTo(0, 0.47)
  context.moveTo(-0.18, 0.33)
  context.lineTo(0.18, 0.33)
}

const strokeReferenceCircle: Stroke = (context) => circle(context, 0, 0, 0.34)

const strokeReferenceTriangle: Stroke = (context) => {
  context.moveTo(0, -0.42)
  context.lineTo(0.39, 0.34)
  context.lineTo(-0.39, 0.34)
  context.closePath()
}

const strokeReferenceCross: Stroke = (context) => {
  context.moveTo(-0.4, 0)
  context.lineTo(0.4, 0)
  context.moveTo(0, -0.4)
  context.lineTo(0, 0.4)
}

const STROKES: readonly Stroke[] = [
  strokeReferenceCircle,
  strokeReferenceTriangle,
  strokeReferenceCross,
  strokeReferenceCircle,
  strokeReferenceTriangle,
  strokeReferenceCross,
  strokeReferenceCircle,
  strokeReferenceTriangle,
  strokeReferenceCross,
  strokeReferenceCircle,
]

export function drawPlanetGlyph(
  context: CanvasRenderingContext2D,
  index: number,
  x: number,
  y: number,
  size: number,
) {
  const stroke = STROKES[index]
  if (!stroke) throw new RangeError(`Unknown planet glyph index: ${index}`)

  context.save()
  context.translate(x, y)
  context.scale(size, size)
  context.beginPath()
  stroke(context)
  context.strokeStyle = '#f7f5ed'
  context.lineWidth = 0.07
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.shadowColor = 'rgba(247, 245, 237, 0.28)'
  context.shadowBlur = 0.035
  context.stroke()
  context.restore()
}
