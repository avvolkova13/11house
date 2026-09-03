export type HeroNarrativeStage = {
  title: string
  mode: 'fragment' | 'product' | 'finale'
  screenshot?: string
  productLabel?: string
  productDetail?: string
}

export const HERO_NARRATIVE_STAGES: readonly HeroNarrativeStage[] = [
  { title: 'Вся ваша практика', mode: 'fragment' },
  { title: 'В одном пространстве', mode: 'fragment' },
  { title: 'ElevenHouse', mode: 'fragment' },
  {
    title: 'Хотя подождите.',
    mode: 'product',
    screenshot: '/assets/product-screenshots/eh-p05-products.png',
    productLabel: 'Продукты',
    productDetail: 'Форматы, услуги и продажи',
  },
  {
    title: 'У вас ведь уже есть система.',
    mode: 'product',
    screenshot: '/assets/product-screenshots/eh-p01-calendar.png',
    productLabel: 'Календарь',
    productDetail: 'Записи и работа с клиентами',
  },
  {
    title: 'Вот она.',
    mode: 'product',
    screenshot: '/assets/product-screenshots/eh-p04-funnel.png',
    productLabel: 'Воронки',
    productDetail: 'Связанный сценарий практики',
  },
  {
    title: 'Мы просто собрали вашу работу обратно.',
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

export const getProductStageMotion = (stageOffset: number): ProductStageMotion => {
  const distance = Math.abs(stageOffset)
  const arrival = 1 - smoothstep(0.12, 0.92, distance)
  const incoming = stageOffset > 0

  return {
    opacity: distance < 0.001 ? 1 : arrival,
    scale: distance < 0.001 ? 1 : 0.42 + arrival * 0.58,
    translateY: (incoming ? 1 : -1) * (1 - arrival) * 18,
    rotateX: (incoming ? 1 : -1) * (1 - arrival) * 9,
    rotateY: (incoming ? -1 : 1) * (1 - arrival) * 5,
  }
}

export const getTunnelMix = (progress: number) => smoothstep(4.72, 6, progress)
export const getTunnelPresentation = (progress: number) => smoothstep(5.92, 6.32, progress)
export const getTunnelDive = (progress: number) => smoothstep(6, HERO_LAST_VISUAL_INDEX, progress)
export const getTunnelCtaReveal = (progress: number, enabled = true) => (
  enabled ? smoothstep(8.45, 8.9, progress) : 0
)
