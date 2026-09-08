import { loadLandingFonts } from '../fonts'
import type { PricingPlan } from './pricingData'

export const PRICING_TEXTURE_WIDTH = 1024
export const PRICING_TEXTURE_HEIGHT = 1356

export type PricingTextureBounds = {
  left: number
  top: number
  right: number
  bottom: number
  width?: number
}

export type PricingTextureLayout = {
  safe: PricingTextureBounds
  art: PricingTextureBounds
  brand: { left: number; top: number }
  action: { right: number; top: number }
  name: { left: number; top: number }
  price: { left: number; top: number }
  audience: { left: number; top: number; width: number }
  commission: PricingTextureBounds
}

export type PricingCardTextureOptions = {
  canvas?: HTMLCanvasElement
}

const CARD_RADIUS = 32
const FONT_STACK = '"Manrope", "Helvetica Neue", Helvetica, sans-serif'
const TEXTURE_SAFE = { left: 72, right: 952, top: 70, bottom: 1288 }

type PlanArtPalette = {
  backdrop: [string, string, string]
  glow: string
  bright: string
  accent: string
  ring: string
  ribbon: string
}

const PLAN_ART_PALETTES: Record<PricingPlan['key'], PlanArtPalette> = {
  start: {
    backdrop: ['#071128', '#163670', '#5577ac'],
    glow: 'rgba(255, 237, 167, 0.72)',
    bright: 'rgba(255, 246, 205, 0.98)',
    accent: 'rgba(208, 164, 57, 0.62)',
    ring: 'rgba(255, 255, 255, 0.54)',
    ribbon: 'rgba(255, 255, 255, 0.28)',
  },
  pro: {
    backdrop: ['#071018', '#163e51', '#376074'],
    glow: 'rgba(67, 198, 216, 0.62)',
    bright: 'rgba(255, 245, 201, 0.98)',
    accent: 'rgba(213, 174, 75, 0.76)',
    ring: 'rgba(255, 255, 255, 0.44)',
    ribbon: 'rgba(72, 180, 210, 0.42)',
  },
  studio: {
    backdrop: ['#081326', '#1d3b68', '#4d6f9f'],
    glow: 'rgba(230, 205, 139, 0.44)',
    bright: 'rgba(239, 246, 255, 0.82)',
    accent: 'rgba(106, 157, 218, 0.3)',
    ring: 'rgba(224, 239, 255, 0.44)',
    ribbon: 'rgba(191, 219, 252, 0.18)',
  },
}

export function getPricingTextureLayout(): PricingTextureLayout {
  return {
    safe: TEXTURE_SAFE,
    art: { left: 0, right: PRICING_TEXTURE_WIDTH, top: 0, bottom: 560 },
    brand: { left: 72, top: 76 },
    action: { right: 952, top: 76 },
    name: { left: 72, top: 736 },
    price: { left: 72, top: 866 },
    audience: { left: 72, top: 980, width: 880 },
    commission: { left: 72, right: 952, top: 1210, bottom: 1288 },
  } as const
}

export async function createPricingCardCanvas(
  plan: PricingPlan,
  options: PricingCardTextureOptions = {},
): Promise<HTMLCanvasElement> {
  await loadLandingFonts()

  const canvas = options.canvas ?? createCanvasElement()
  canvas.width = PRICING_TEXTURE_WIDTH
  canvas.height = PRICING_TEXTURE_HEIGHT

  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D canvas is unavailable')

  const layout = getPricingTextureLayout()

  const { width, height } = canvas
  context.clearRect(0, 0, width, height)
  context.save()
  context.beginPath()
  roundedRectPath(context, 0, 0, width, height, CARD_RADIUS)
  context.clip()
  drawPricingBackground(context, plan)
  drawPricingArtwork(context, plan, layout)
  drawPricingTypography(context, plan, layout)
  context.restore()
  drawPricingBorder(context)

  return canvas
}

function createCanvasElement(): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new Error('Canvas creation requires a document or a provided canvas element')
  }

  return document.createElement('canvas')
}

/** Diffuse the source once, so tiny copy never turns into repeated sharp echoes. */
export function createPricingReflectionCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = createCanvasElement()
  canvas.width = PRICING_TEXTURE_WIDTH / 2
  canvas.height = PRICING_TEXTURE_HEIGHT / 2
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D canvas is unavailable')
  context.filter = 'blur(4px)'
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

function drawPricingBackground(context: CanvasRenderingContext2D, plan: PricingPlan): void {
  const { width, height } = context.canvas
  const palette = PLAN_ART_PALETTES[plan.key]

  context.save()
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#080f1d'
  context.fillRect(0, 0, width, height)

  const baseGlow = context.createLinearGradient(0, 0, width, 650)
  baseGlow.addColorStop(0, palette.backdrop[0])
  baseGlow.addColorStop(0.55, palette.backdrop[1])
  baseGlow.addColorStop(1, palette.backdrop[2])
  context.globalAlpha = plan.key === 'studio' ? 0.82 : 0.72
  context.fillStyle = baseGlow
  context.fillRect(0, 0, width, 650)

  const vignette = context.createRadialGradient(width * 0.52, height * 0.26, 20, width * 0.52, height * 0.26, width * 0.8)
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.04)')
  vignette.addColorStop(0.52, 'rgba(255, 255, 255, 0.015)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.32)')
  context.globalAlpha = 1
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)

  const lowerWash = context.createLinearGradient(0, 410, 0, height)
  lowerWash.addColorStop(0, 'rgba(10, 12, 19, 0)')
  lowerWash.addColorStop(0.34, 'rgba(10, 12, 19, 0.18)')
  lowerWash.addColorStop(0.58, 'rgba(9, 11, 17, 0.9)')
  lowerWash.addColorStop(1, '#090b11')
  context.fillStyle = lowerWash
  context.fillRect(0, 0, width, height)
  context.restore()
}

function drawPricingArtwork(
  context: CanvasRenderingContext2D,
  plan: PricingPlan,
  layout: PricingTextureLayout,
): void {
  const palette = PLAN_ART_PALETTES[plan.key]
  const { width } = context.canvas
  const { bottom } = layout.art

  context.save()
  context.beginPath()
  roundedRectPath(context, 0, 0, width, bottom, 0)
  context.clip()

  const field = context.createLinearGradient(0, 0, width, bottom)
  field.addColorStop(0, palette.backdrop[0])
  field.addColorStop(0.45, palette.backdrop[1])
  field.addColorStop(1, palette.backdrop[2])
  context.fillStyle = field
  context.fillRect(0, 0, width, bottom)

  context.save()
  context.scale(1, bottom / 650)
  switch (plan.key) {
    case 'start':
      drawStartArtwork(context, palette)
      break
    case 'pro':
      drawProArtwork(context, palette)
      break
    case 'studio':
      drawStudioArtwork(context, palette)
      break
  }
  context.restore()

  const sheen = context.createLinearGradient(0, 0, 0, bottom)
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.015)')
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.fillStyle = sheen
  context.fillRect(0, 0, width, bottom)
  context.restore()
}

function drawStartArtwork(context: CanvasRenderingContext2D, palette: PlanArtPalette): void {
  drawAuroraField(context, palette)
}

function drawProArtwork(context: CanvasRenderingContext2D, palette: PlanArtPalette): void {
  drawLiquidLens(context, palette)
}

function drawStudioArtwork(context: CanvasRenderingContext2D, palette: PlanArtPalette): void {
  drawChromaticRibbon(context, palette)
}

function drawAuroraField(context: CanvasRenderingContext2D, palette: PlanArtPalette): void {
  context.save()
  context.globalCompositeOperation = 'screen'

  drawGlow(context, 744, 158, 300, palette.glow, 0.88)
  drawGlow(context, 582, 310, 260, 'rgba(105, 157, 231, 0.78)', 0.64)
  drawGlow(context, 812, 204, 76, palette.bright, 0.98)
  drawGlow(context, 312, 476, 84, 'rgba(233, 241, 255, 0.72)', 0.82)

  const veil = context.createLinearGradient(16, 520, 980, 38)
  veil.addColorStop(0, 'rgba(67, 117, 205, 0)')
  veil.addColorStop(0.3, 'rgba(119, 161, 226, 0.38)')
  veil.addColorStop(0.62, 'rgba(245, 248, 255, 0.3)')
  veil.addColorStop(0.84, palette.ribbon)
  veil.addColorStop(1, 'rgba(255, 223, 145, 0)')
  context.fillStyle = veil
  context.beginPath()
  context.moveTo(-90, 590)
  context.bezierCurveTo(130, 380, 296, 505, 492, 340)
  context.bezierCurveTo(670, 190, 748, 20, 1100, 74)
  context.lineTo(1100, 266)
  context.bezierCurveTo(802, 208, 730, 398, 518, 492)
  context.bezierCurveTo(292, 594, 110, 502, -90, 648)
  context.closePath()
  context.fill()

  context.globalAlpha = 0.6
  context.strokeStyle = palette.ring
  context.lineWidth = 3
  for (let index = 0; index < 3; index += 1) {
    context.beginPath()
    context.moveTo(-30, 516 + index * 28)
    context.bezierCurveTo(230, 332 + index * 17, 430, 520 - index * 24, 610, 302 - index * 18)
    context.bezierCurveTo(740, 152 - index * 14, 866, 120 + index * 18, 1050, 134 + index * 26)
    context.stroke()
  }

  context.restore()
}

function drawLiquidLens(context: CanvasRenderingContext2D, palette: PlanArtPalette): void {
  context.save()
  context.globalCompositeOperation = 'screen'

  drawGlow(context, 534, 244, 350, palette.glow, 0.9)
  drawGlow(context, 304, 356, 150, 'rgba(49, 213, 223, 0.8)', 0.9)
  drawGlow(context, 770, 310, 150, palette.accent, 0.84)

  const liquid = context.createLinearGradient(220, 88, 840, 462)
  liquid.addColorStop(0, 'rgba(210, 248, 247, 0.8)')
  liquid.addColorStop(0.28, 'rgba(91, 210, 224, 0.62)')
  liquid.addColorStop(0.55, 'rgba(35, 111, 156, 0.26)')
  liquid.addColorStop(0.78, 'rgba(229, 198, 96, 0.55)')
  liquid.addColorStop(1, 'rgba(255, 236, 178, 0.06)')
  context.fillStyle = liquid
  context.beginPath()
  context.moveTo(260, 178)
  context.bezierCurveTo(344, 68, 564, 72, 672, 152)
  context.bezierCurveTo(796, 244, 794, 410, 622, 458)
  context.bezierCurveTo(486, 496, 272, 418, 218, 306)
  context.bezierCurveTo(184, 238, 210, 202, 260, 178)
  context.closePath()
  context.fill()

  const innerLens = context.createRadialGradient(466, 210, 12, 492, 250, 210)
  innerLens.addColorStop(0, 'rgba(255, 255, 238, 0.96)')
  innerLens.addColorStop(0.18, 'rgba(193, 246, 238, 0.64)')
  innerLens.addColorStop(0.58, 'rgba(72, 177, 197, 0.2)')
  innerLens.addColorStop(1, 'rgba(18, 72, 105, 0)')
  context.fillStyle = innerLens
  context.beginPath()
  context.ellipse(500, 258, 244, 174, -0.18, 0, Math.PI * 2)
  context.fill()

  context.globalAlpha = 0.62
  context.strokeStyle = palette.ring
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(270, 180)
  context.bezierCurveTo(386, 92, 598, 92, 692, 180)
  context.bezierCurveTo(782, 264, 742, 396, 608, 430)
  context.stroke()

  context.globalAlpha = 0.3
  context.strokeStyle = palette.ribbon
  context.lineWidth = 14
  context.beginPath()
  context.moveTo(174, 408)
  context.bezierCurveTo(354, 272, 548, 478, 850, 184)
  context.stroke()

  drawGlow(context, 484, 226, 78, palette.bright, 1)
  context.restore()
}

function drawChromaticRibbon(context: CanvasRenderingContext2D, palette: PlanArtPalette): void {
  context.save()
  context.globalCompositeOperation = 'screen'

  drawGlow(context, 274, 100, 264, palette.bright, 0.74)
  drawGlow(context, 754, 270, 220, palette.glow, 0.92)
  drawGlow(context, 640, 414, 132, palette.accent, 0.84)

  const ribbon = context.createLinearGradient(134, 36, 916, 540)
  ribbon.addColorStop(0, 'rgba(248, 249, 242, 0.88)')
  ribbon.addColorStop(0.24, 'rgba(203, 217, 242, 0.68)')
  ribbon.addColorStop(0.53, 'rgba(91, 130, 194, 0.72)')
  ribbon.addColorStop(0.78, 'rgba(225, 197, 111, 0.66)')
  ribbon.addColorStop(1, 'rgba(244, 231, 192, 0.12)')
  context.fillStyle = ribbon
  context.beginPath()
  context.moveTo(-80, 174)
  context.bezierCurveTo(250, -18, 418, 54, 518, 170)
  context.bezierCurveTo(666, 342, 824, 166, 1032, 224)
  context.lineTo(1032, 484)
  context.bezierCurveTo(818, 396, 664, 548, 482, 372)
  context.bezierCurveTo(340, 234, 218, 304, -80, 422)
  context.closePath()
  context.fill()

  const fold = context.createLinearGradient(216, 460, 830, 70)
  fold.addColorStop(0, 'rgba(22, 63, 126, 0.08)')
  fold.addColorStop(0.5, 'rgba(239, 244, 255, 0.42)')
  fold.addColorStop(1, 'rgba(117, 151, 210, 0.05)')
  context.fillStyle = fold
  context.beginPath()
  context.moveTo(-80, 496)
  context.bezierCurveTo(322, 316, 490, 506, 620, 258)
  context.bezierCurveTo(710, 86, 854, 54, 1052, 122)
  context.lineTo(1052, 272)
  context.bezierCurveTo(842, 210, 770, 208, 648, 408)
  context.bezierCurveTo(472, 626, 274, 414, -80, 598)
  context.closePath()
  context.fill()

  context.globalAlpha = 0.68
  context.strokeStyle = palette.ring
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(-80, 286)
  context.bezierCurveTo(294, 100, 450, 146, 568, 282)
  context.bezierCurveTo(694, 424, 820, 254, 1040, 310)
  context.stroke()
  context.restore()
}

function drawPricingTypography(
  context: CanvasRenderingContext2D,
  plan: PricingPlan,
  layout: PricingTextureLayout,
): void {
  const { width, height } = context.canvas
  context.save()
  const contentWash = context.createLinearGradient(0, layout.art.bottom, 0, height)
  contentWash.addColorStop(0, '#0c1423')
  contentWash.addColorStop(1, '#080e1a')
  context.fillStyle = contentWash
  context.fillRect(0, layout.art.bottom, width, height - layout.art.bottom)

  context.fillStyle = 'rgba(255, 255, 255, 0.7)'
  context.font = `650 30px ${FONT_STACK}`
  context.textBaseline = 'top'
  drawTrackedText(context, 'ELEVENHOUSE', layout.brand.left, layout.brand.top, 3)

  context.fillStyle = '#f8f6f0'
  context.font = `500 104px ${FONT_STACK}`
  context.textBaseline = 'alphabetic'
  context.fillText(plan.name, layout.name.left, layout.name.top)

  context.fillStyle = '#f8f6f0'
  context.font = `600 64px ${FONT_STACK}`
  context.textBaseline = 'alphabetic'
  context.fillText(plan.price, layout.price.left, layout.price.top)

  context.fillStyle = '#b9c7db'
  context.font = `500 34px ${FONT_STACK}`
  context.textBaseline = 'top'
  context.fillText(plan.period, layout.price.left, layout.price.top + 24)

  context.fillStyle = '#d4deec'
  context.font = `450 42px ${FONT_STACK}`
  context.textBaseline = 'top'
  drawWrappedText(context, plan.audience, layout.audience.left, layout.audience.top, layout.audience.width, 56)

  context.strokeStyle = 'rgba(248, 246, 240, 0.16)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(layout.commission.left, layout.commission.top)
  context.lineTo(layout.commission.right, layout.commission.top)
  context.stroke()

  context.fillStyle = '#b9c7db'
  context.font = `500 32px ${FONT_STACK}`
  context.fillText('Комиссия с продаж', layout.commission.left, layout.commission.top + 28)

  context.fillStyle = '#e0b64e'
  context.font = `600 44px ${FONT_STACK}`
  context.textBaseline = 'top'
  context.textAlign = 'right'
  context.fillText(plan.commission, layout.commission.right, layout.commission.top + 18)

  context.restore()
}

function drawPricingBorder(context: CanvasRenderingContext2D): void {
  const { width, height } = context.canvas

  context.save()
  context.beginPath()
  roundedRectPath(context, 1.5, 1.5, width - 3, height - 3, CARD_RADIUS)
  context.strokeStyle = 'rgba(176, 207, 239, 0.22)'
  context.lineWidth = 1.5
  context.stroke()

  context.beginPath()
  roundedRectPath(context, 2.5, 2.5, width - 5, height - 5, CARD_RADIUS - 1)
  context.strokeStyle = 'rgba(119, 161, 210, 0.16)'
  context.lineWidth = 1
  context.stroke()
  context.restore()
}

function drawGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number,
): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, applyOpacity(color, opacity))
  gradient.addColorStop(0.12, applyOpacity(color, opacity * 0.76))
  gradient.addColorStop(0.45, applyOpacity(color, opacity * 0.22))
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  context.save()
  context.fillStyle = gradient
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function applyOpacity(color: string, opacity: number): string {
  const alpha = Math.min(1, Math.max(0, opacity))

  if (color.startsWith('rgba(')) {
    return color.replace(/rgba\(([^)]+),\s*[0-9.]+\)/, `rgba($1, ${alpha})`)
  }

  if (color.startsWith('rgb(')) {
    return color.replace(/rgb\(([^)]+)\)/, `rgba($1, ${alpha})`)
  }

  return color
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: CanvasTextAlign = 'left',
): void {
  context.save()
  context.textAlign = 'left'

  const letters = Array.from(text)
  if (align === 'right') {
    const totalWidth = letters.reduce((sum, letter, index) => {
      const width = context.measureText(letter).width
      return sum + width + (index === letters.length - 1 ? 0 : spacing)
    }, 0)
    let cursor = x - totalWidth
    for (const letter of letters) {
      context.fillText(letter, cursor, y)
      cursor += context.measureText(letter).width + spacing
    }
  } else {
    let cursor = x
    for (const letter of letters) {
      context.fillText(letter, cursor, y)
      cursor += context.measureText(letter).width + spacing
    }
  }

  context.restore()
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const lines = wrapText(context, text, maxWidth)

  for (let index = 0; index < lines.length; index += 1) {
    context.fillText(lines[index], x, y + index * lineHeight)
  }
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/)
  if (words.length === 0) return []

  const lines: string[] = []
  let currentLine = words[0]

  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${currentLine} ${words[index]}`
    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate
      continue
    }

    lines.push(currentLine)
    currentLine = words[index]
  }

  lines.push(currentLine)
  return lines
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2)
  context.moveTo(x + r, y)
  context.lineTo(x + width - r, y)
  context.quadraticCurveTo(x + width, y, x + width, y + r)
  context.lineTo(x + width, y + height - r)
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  context.lineTo(x + r, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - r)
  context.lineTo(x, y + r)
  context.quadraticCurveTo(x, y, x + r, y)
}
