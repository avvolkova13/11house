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

describe('marketing brief copy contract', () => {
  it('uses the category-first Hero message and registration CTA', () => {
    expect(heroNarrativeSource).toContain("title: 'Вся практика астролога'")
    expect(heroNarrativeSource).toContain("title: 'в одном кабинете'")
    expect(heroNarrativeSource).toContain("title: 'ElevenHouse'")
    expect(heroComponentSource).toContain('Создать кабинет бесплатно')
    expect(heroComponentSource).toContain('Без банковской карты.')
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
      'Больше времени на клиентов. Меньше — на рутину.',
      'От построения карты до оплаты —<br />один рабочий процесс.',
      'AI берёт рутину на себя.<br />Последнее слово — за вами.',
      'Один кабинет вместо<br />нескольких сервисов.',
      'Начните бесплатно.<br />Расширяйте возможности по мере роста.',
      'Частые вопросы.',
      'Соберите практику<br />в одном кабинете.',
    ]

    headings.forEach((heading) => expect(sectionSource).toContain(heading))
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
})
