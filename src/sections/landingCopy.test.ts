import { describe, expect, it } from 'vitest'

import heroNarrativeSource from '../hero/heroNarrative.ts?raw'
import heroComponentSource from '../components/CosmicHero.tsx?raw'
const readRaw = (source: Record<string, unknown>) => Object.values(source)[0] as string
const componentSource = Object.values(
  import.meta.glob('../components/*.tsx', { eager: true, query: '?raw', import: 'default' }),
).join('\n')

const sectionSource = [
  readRaw(import.meta.glob('./OneClientStory.tsx', { eager: true, query: '?raw', import: 'default' })),
  readRaw(import.meta.glob('./ProductProof.tsx', { eager: true, query: '?raw', import: 'default' })),
  readRaw(import.meta.glob('./AiRoutine.tsx', { eager: true, query: '?raw', import: 'default' })),
  readRaw(import.meta.glob('./UnifiedWorkspace.tsx', { eager: true, query: '?raw', import: 'default' })),
  readRaw(import.meta.glob('./PricingSection.tsx', { eager: true, query: '?raw', import: 'default' })),
  readRaw(import.meta.glob('./FaqSection.tsx', { eager: true, query: '?raw', import: 'default' })),
  readRaw(import.meta.glob('./FinalCta.tsx', { eager: true, query: '?raw', import: 'default' })),
].join('\n')

const faqSource = readRaw(import.meta.glob('./FaqSection.tsx', { eager: true, query: '?raw', import: 'default' }))
const clientStorySource = readRaw(
  import.meta.glob('./OneClientStory.tsx', { eager: true, query: '?raw', import: 'default' }),
)
const pricingSectionSource = readRaw(
  import.meta.glob('./PricingSection.tsx', { eager: true, query: '?raw', import: 'default' }),
)
const pricingOrbitSource = readRaw(
  import.meta.glob('./PricingOrbit.tsx', { eager: true, query: '?raw', import: 'default' }),
)

describe('marketing brief copy contract', () => {
  it('uses the category-first Hero message and registration CTA', () => {
    expect(heroNarrativeSource).toContain("title: 'Вся практика астролога'")
    expect(heroNarrativeSource).toContain("title: 'в одном кабинете'")
    expect(heroNarrativeSource).toContain("title: 'ElevenHouse'")
    expect(heroComponentSource).toContain('Создать кабинет')
    expect(heroComponentSource).toContain('Бесплатно без банковской карты')
  })

  it('includes the approved desktop and mobile header navigation', () => {
    const headerCopy = [
      'Возможности',
      'Как работает',
      'Тарифы',
      'FAQ',
      'RU',
      'EN',
      'Войти',
      'Создать кабинет бесплатно',
    ]

    headerCopy.forEach((copy) => expect(componentSource).toContain(copy))
    expect(componentSource).toContain('aria-label="Основная навигация"')
  })

  it('uses the approved benefit-first section headings', () => {
    const headings = [
      'От построения карты до оплаты —<br />один рабочий процесс.',
      'AI берёт рутину на себя.<br />Последнее слово — за вами.',
      'Один кабинет вместо<br />нескольких сервисов.',
      'Начните бесплатно.<br />Расширяйте возможности по мере роста.',
      'Частые вопросы.',
      'Соберите практику<br />в одном кабинете.',
    ]

    headings.forEach((heading) => expect(sectionSource).toContain(heading))
  })

  it('keeps the Hero finale split and uses the approved client-story heading', () => {
    expect(heroComponentSource).toContain('hero-finale__part--start')
    expect(heroComponentSource).toContain('hero-finale__part--end')
    expect(heroComponentSource).toMatch(/больше\s*<br \/>\s*на консультацию/)
    expect(heroComponentSource).not.toContain('Больше времени на консультации')
    expect(clientStorySource).not.toContain('client-story__title-part')
    expect(clientStorySource).not.toContain('client-story__header')
    expect(clientStorySource).toContain('Больше времени на клиентов. Меньше — на рутину.')
  })

  it('compares the five workflow stages and labels researched benchmarks honestly', () => {
    const stages = [
      'Сбор данных',
      'Построение карты',
      'Подготовка разбора',
      'Запись и оплата',
      'Повторный контакт',
    ]

    expect(clientStorySource).toContain('Ручной режим')
    expect(clientStorySource).toContain('ElevenHouse')
    stages.forEach((stage) => expect(clientStorySource).toContain(stage))
    expect(clientStorySource.match(/≈5 минут/g) ?? []).toHaveLength(2)
    expect(clientStorySource).toContain('−40%')
    expect(clientStorySource).toContain('https://pmc.ncbi.nlm.nih.gov/articles/PMC5709849/')
    expect(clientStorySource).toContain('https://journals.sagepub.com/doi/10.3233/SHTI260505')
    expect(clientStorySource).toContain('https://economics.mit.edu/sites/default/files/inline-files/Noy_Zhang_1.pdf')
    expect(clientStorySource).toContain(
      'Ориентиры основаны на исследованиях цифрового ввода данных, онлайн-записи и AI-подготовки текста. Фактическая экономия зависит от процесса специалиста.',
    )
    expect(clientStorySource).not.toContain('Ориентиры экономии')
    expect(clientStorySource).not.toContain('data-client-scene')
    expect(clientStorySource).not.toContain('client-story__rail')
    expect(clientStorySource).not.toContain('Клиент Анна')
  })

  it('contains all eight risk-closing FAQ questions', () => {
    const faqQuestions = [
      'Я не дружу с техникой — справлюсь?',
      'Можно ли перенести существующих клиентов?',
      'Где хранятся клиентские данные?',
      'Как подключаются и выводятся оплаты?',
      'Что происходит с моими материалами и трактовками?',
      'AI напишет разбор за меня — это этично?',
      'Можно ли работать без AI?',
      'Что останется после отмены тарифа?',
    ]

    faqQuestions.forEach((question) => expect(sectionSource).toContain(question))
    expect(faqSource.match(/question:/g) ?? []).toHaveLength(8)
  })

  it('uses the cinematic pricing orbit with stable plan details', () => {
    expect(pricingSectionSource).toContain('<PricingOrbit')
    expect(pricingSectionSource).toContain('pricing-details')
    expect(pricingSectionSource).not.toContain('pricing-section__plans')
    expect(pricingOrbitSource).toContain('pricing-orbit__reflection--top')
    expect(pricingOrbitSource).toContain('pricing-orbit__reflection--bottom')
  })
})
