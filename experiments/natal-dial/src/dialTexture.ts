import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  SRGBColorSpace,
} from 'three'
import { NATAL_CHART, type NatalBody } from './natalData'
import { toPolarPoint } from './natalGeometry'
import { drawPlanetGlyph, PLANET_VECTOR_IDS } from './planetGlyphs'
import { ZODIAC_VECTOR_IDS } from './zodiacGlyphs'

export const PLANET_MARKER_SIZE_RATIO = 0.034

const SIGN_NAMES = [
  'Овен',
  'Телец',
  'Близнецы',
  'Рак',
  'Лев',
  'Дева',
  'Весы',
  'Скорпион',
  'Стрелец',
  'Козерог',
  'Водолей',
  'Рыбы',
] as const
const HOUSES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const
const BODY_NAMES: Readonly<Record<NatalBody['id'], string>> = {
  sun: 'Солнце',
  moon: 'Луна',
  mercury: 'Меркурий',
  venus: 'Венера',
  mars: 'Марс',
  jupiter: 'Юпитер',
  saturn: 'Сатурн',
  uranus: 'Уран',
  neptune: 'Нептун',
  pluto: 'Плутон',
}

export type DialAtlas = Readonly<{
  texture: CanvasTexture
  canvas: HTMLCanvasElement
}>

export function getAtlasLabels() {
  return {
    zodiac: [...ZODIAC_VECTOR_IDS],
    visibleZodiac: [] as const,
    houses: [...HOUSES],
    bodies: [...PLANET_VECTOR_IDS],
  }
}

function formatPosition(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360
  const absoluteMinutes = Math.round(normalized * 60) % (360 * 60)
  const signIndex = Math.floor(absoluteMinutes / (30 * 60))
  const withinSignMinutes = absoluteMinutes % (30 * 60)
  const degrees = Math.floor(withinSignMinutes / 60)
  const minutes = withinSignMinutes % 60
  return `${degrees}°${String(minutes).padStart(2, '0')}′ ${SIGN_NAMES[signIndex]}`
}

export function buildAccessibleSummary(): string {
  const bodies = NATAL_CHART.bodies
    .map((body) => `${BODY_NAMES[body.id]} — ${formatPosition(body.longitude)}${body.retrograde ? ', ретроградный' : ''}`)
    .join('; ')

  return `${NATAL_CHART.localLabel}. Тропический зодиак, равнодомная система. Асцендент — ${formatPosition(NATAL_CHART.ascendant)}. ${bodies}.`
}

function canvasPoint(longitude: number, radius: number, center: number) {
  const point = toPolarPoint(longitude, radius)
  return { x: center + point.x, y: center - point.y }
}

export function createDialAtlas(size = 2048): DialAtlas {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')

  if (!context) throw new Error('Canvas 2D context is unavailable')

  const center = size / 2

  context.clearRect(0, 0, size, size)
  context.lineCap = 'round'
  context.lineJoin = 'round'

  NATAL_CHART.bodies.forEach((body, index) => {
    const point = canvasPoint(body.longitude, size * 0.337, center)
    drawPlanetGlyph(context, index, point.x, point.y, size * PLANET_MARKER_SIZE_RATIO)
  })

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.needsUpdate = true

  return { texture, canvas }
}
