import { publicAsset } from '../assets'

export type HeroNarrativeStage = {
  title: string
  mode: 'fragment' | 'product' | 'finale'
  screenshot?: string
  productLabel?: string
  productDetail?: string
}

export const HERO_NARRATIVE_STAGES: readonly HeroNarrativeStage[] = [
  { title: 'Вся практика астролога', mode: 'fragment' },
  { title: 'в одном кабинете', mode: 'fragment' },
  { title: 'ElevenHouse', mode: 'fragment' },
  {
    title: 'Карты и клиенты',
    mode: 'product',
    screenshot: publicAsset('assets/product-screenshots/eh-products-tiles.png'),
    productLabel: 'Продукты',
    productDetail: 'Форматы, услуги и продажи',
  },
  {
    title: 'Запись и оплаты',
    mode: 'product',
    screenshot: publicAsset('assets/product-screenshots/eh-calendar-tiles.png'),
    productLabel: 'Календарь',
    productDetail: 'Записи и работа с клиентами',
  },
  {
    title: 'AI-помощник',
    mode: 'product',
    screenshot: publicAsset('assets/product-screenshots/eh-numerology-tiles.png'),
    productLabel: 'Нумерология',
    productDetail: 'Расчёты и портрет клиента',
  },
  {
    title: 'Меньше времени на рутину — больше на консультацию.',
    mode: 'finale',
  },
] as const

export const HERO_STAGE_DISTANCE = 760
export const HERO_LAST_STAGE_INDEX = HERO_NARRATIVE_STAGES.length - 1
export const HERO_LAST_VISUAL_INDEX = HERO_LAST_STAGE_INDEX + 3

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const progress = clamp01((value - edge0) / (edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

export const clampHeroProgress = (progress: number) => (
  Math.min(HERO_LAST_STAGE_INDEX, Math.max(0, progress))
)

export const getLinearStageOffset = (progress: number, index: number) => (
  index - clampHeroProgress(progress)
)

export type ProductStageMotion = {
  opacity: number
  scale: number
  translateY: number
  rotateX: number
  rotateY: number
}

const getDeferredArrival = (distance: number) => (
  1 - smoothstep(0.07, 0.2, distance)
)

export const getProductStageMotion = (
  stageOffset: number,
  deferIncoming = false,
): ProductStageMotion => {
  const distance = Math.abs(stageOffset)
  const incoming = stageOffset > 0
  const arrival = incoming && deferIncoming
    ? getDeferredArrival(distance)
    : 1 - smoothstep(0.12, 0.92, distance)

  return {
    opacity: distance < 0.001 ? 1 : arrival,
    scale: distance < 0.001 ? 1 : 0.42 + arrival * 0.58,
    translateY: (incoming ? 1 : -1) * (1 - arrival) * 18,
    rotateX: (incoming ? 1 : -1) * (1 - arrival) * 9,
    rotateY: (incoming ? -1 : 1) * (1 - arrival) * 5,
  }
}

export const getFinaleStageOpacity = (stageOffset: number) => {
  const distance = Math.abs(stageOffset)
  if (distance < 0.001) return 1
  return stageOffset > 0
    ? getDeferredArrival(distance)
    : 1 - smoothstep(0.08, 0.72, distance)
}

export const getTunnelMix = (progress: number) => smoothstep(4.72, 6, progress)
export const getTunnelPresentation = (progress: number) => smoothstep(5.92, 6.32, progress)
export const getTunnelDive = (progress: number) => smoothstep(6, HERO_LAST_VISUAL_INDEX, progress)
