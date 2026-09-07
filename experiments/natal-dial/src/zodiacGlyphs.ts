export const ZODIAC_VECTOR_IDS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const

function strokeAries(context: CanvasRenderingContext2D) {
  context.moveTo(0, 0.46)
  context.lineTo(0, -0.06)
  context.moveTo(0, -0.06)
  context.bezierCurveTo(-0.08, -0.29, -0.18, -0.44, -0.34, -0.42)
  context.bezierCurveTo(-0.5, -0.4, -0.48, -0.13, -0.33, -0.09)
  context.moveTo(0, -0.06)
  context.bezierCurveTo(0.08, -0.29, 0.18, -0.44, 0.34, -0.42)
  context.bezierCurveTo(0.5, -0.4, 0.48, -0.13, 0.33, -0.09)
}

function strokeTaurus(context: CanvasRenderingContext2D) {
  context.moveTo(-0.31, -0.15)
  context.bezierCurveTo(-0.5, -0.23, -0.49, -0.43, -0.38, -0.46)
  context.moveTo(0.31, -0.15)
  context.bezierCurveTo(0.5, -0.23, 0.49, -0.43, 0.38, -0.46)
  context.moveTo(-0.3, -0.16)
  context.bezierCurveTo(-0.17, -0.06, 0.17, -0.06, 0.3, -0.16)
  context.moveTo(0.29, 0.16)
  context.arc(0, 0.16, 0.29, 0, Math.PI * 2)
}

function strokeGemini(context: CanvasRenderingContext2D) {
  context.moveTo(-0.35, -0.39)
  context.bezierCurveTo(-0.12, -0.31, 0.12, -0.31, 0.35, -0.39)
  context.moveTo(-0.35, 0.39)
  context.bezierCurveTo(-0.12, 0.31, 0.12, 0.31, 0.35, 0.39)
  context.moveTo(-0.24, -0.34)
  context.lineTo(-0.24, 0.34)
  context.moveTo(0.24, -0.34)
  context.lineTo(0.24, 0.34)
}

function strokeCancer(context: CanvasRenderingContext2D) {
  context.moveTo(-0.4, -0.13)
  context.bezierCurveTo(-0.18, -0.43, 0.19, -0.43, 0.4, -0.18)
  context.moveTo(0.4, 0.13)
  context.bezierCurveTo(0.18, 0.43, -0.19, 0.43, -0.4, 0.18)
  context.moveTo(0.31, -0.18)
  context.arc(0.21, -0.18, 0.1, 0, Math.PI * 2)
  context.moveTo(-0.11, 0.18)
  context.arc(-0.21, 0.18, 0.1, 0, Math.PI * 2)
}

function strokeLeo(context: CanvasRenderingContext2D) {
  context.moveTo(-0.02, 0.1)
  context.arc(-0.18, 0.1, 0.16, 0, Math.PI * 2)
  context.moveTo(-0.02, 0.09)
  context.bezierCurveTo(0.18, -0.02, 0.08, -0.35, 0.31, -0.37)
  context.bezierCurveTo(0.49, -0.39, 0.49, -0.16, 0.36, -0.1)
}

function strokeVirgo(context: CanvasRenderingContext2D) {
  context.moveTo(-0.42, 0.34)
  context.lineTo(-0.42, -0.31)
  context.bezierCurveTo(-0.42, -0.47, -0.18, -0.47, -0.18, -0.26)
  context.lineTo(-0.18, 0.29)
  context.moveTo(-0.18, -0.27)
  context.bezierCurveTo(-0.18, -0.45, 0.06, -0.45, 0.06, -0.24)
  context.lineTo(0.06, 0.28)
  context.moveTo(0.06, -0.24)
  context.bezierCurveTo(0.08, -0.43, 0.29, -0.42, 0.3, -0.22)
  context.bezierCurveTo(0.32, 0.04, 0.18, 0.28, 0.02, 0.42)
  context.moveTo(0.24, 0.12)
  context.bezierCurveTo(0.35, 0.21, 0.43, 0.25, 0.46, 0.23)
}

function strokeLibra(context: CanvasRenderingContext2D) {
  context.moveTo(-0.43, 0.28)
  context.lineTo(0.43, 0.28)
  context.moveTo(-0.43, 0.06)
  context.lineTo(-0.19, 0.06)
  context.bezierCurveTo(-0.18, -0.25, 0.18, -0.25, 0.19, 0.06)
  context.lineTo(0.43, 0.06)
}

function strokeScorpio(context: CanvasRenderingContext2D) {
  context.moveTo(-0.43, 0.32)
  context.lineTo(-0.43, -0.28)
  context.bezierCurveTo(-0.43, -0.44, -0.2, -0.44, -0.2, -0.24)
  context.lineTo(-0.2, 0.25)
  context.moveTo(-0.2, -0.24)
  context.bezierCurveTo(-0.2, -0.43, 0.03, -0.43, 0.03, -0.22)
  context.lineTo(0.03, 0.25)
  context.moveTo(0.03, -0.22)
  context.bezierCurveTo(0.04, -0.42, 0.26, -0.4, 0.27, -0.19)
  context.lineTo(0.27, 0.3)
  context.lineTo(0.45, 0.12)
  context.moveTo(0.27, 0.3)
  context.lineTo(0.45, 0.31)
}

function strokeSagittarius(context: CanvasRenderingContext2D) {
  context.moveTo(-0.37, 0.37)
  context.lineTo(0.38, -0.38)
  context.moveTo(0.08, -0.39)
  context.lineTo(0.39, -0.39)
  context.lineTo(0.39, -0.08)
  context.moveTo(-0.24, -0.05)
  context.lineTo(0.05, 0.24)
}

function strokeCapricorn(context: CanvasRenderingContext2D) {
  context.moveTo(-0.44, -0.34)
  context.bezierCurveTo(-0.27, -0.38, -0.2, -0.2, -0.16, 0.27)
  context.moveTo(-0.17, -0.28)
  context.bezierCurveTo(0.02, -0.42, 0.17, -0.28, 0.16, -0.03)
  context.lineTo(0.14, 0.25)
  context.bezierCurveTo(0.16, 0.44, 0.43, 0.4, 0.43, 0.18)
  context.bezierCurveTo(0.43, -0.01, 0.21, -0.03, 0.14, 0.1)
}

function strokeAquarius(context: CanvasRenderingContext2D) {
  for (const y of [-0.17, 0.17]) {
    context.moveTo(-0.45, y + 0.08)
    context.lineTo(-0.28, y - 0.08)
    context.lineTo(-0.1, y + 0.08)
    context.lineTo(0.08, y - 0.08)
    context.lineTo(0.27, y + 0.08)
    context.lineTo(0.45, y - 0.08)
  }
}

function strokePisces(context: CanvasRenderingContext2D) {
  context.moveTo(-0.08, -0.42)
  context.bezierCurveTo(-0.43, -0.24, -0.43, 0.24, -0.08, 0.42)
  context.moveTo(0.08, -0.42)
  context.bezierCurveTo(0.43, -0.24, 0.43, 0.24, 0.08, 0.42)
  context.moveTo(-0.37, 0)
  context.lineTo(0.37, 0)
}

const STROKES = [
  strokeAries,
  strokeTaurus,
  strokeGemini,
  strokeCancer,
  strokeLeo,
  strokeVirgo,
  strokeLibra,
  strokeScorpio,
  strokeSagittarius,
  strokeCapricorn,
  strokeAquarius,
  strokePisces,
] as const

export function drawZodiacGlyph(
  context: CanvasRenderingContext2D,
  index: number,
  x: number,
  y: number,
  size: number,
) {
  const stroke = STROKES[index]
  if (!stroke) throw new RangeError(`Unknown zodiac glyph index: ${index}`)

  context.save()
  context.translate(x, y)
  context.scale(size, size)
  context.beginPath()
  stroke(context)
  context.strokeStyle = '#f7f5ed'
  context.lineWidth = 0.066
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.shadowColor = 'rgba(247, 245, 237, 0.22)'
  context.shadowBlur = 0.035
  context.stroke()
  context.restore()
}
