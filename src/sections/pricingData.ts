export type PricingPlan = {
  key: 'start' | 'pro' | 'studio'
  name: string
  price: string
  period: string
  audience: string
  commission: string
  capacityTitle: string
  capacityDetail: string
  includesLabel: string
  limits: string[]
  features: string[]
  cardPoints: string[]
}

export const pricingPlans: PricingPlan[] = [
  {
    key: 'start',
    name: 'Старт',
    price: '0 ₽',
    period: 'навсегда',
    audience: 'Попробовать платформу, запустить личную страницу и сделать первые продажи.',
    commission: '8%',
    capacityTitle: '30 записей в месяц',
    capacityDetail: '20 AI-действий в месяц · 1 воронка · 1 пользователь',
    includesLabel: 'Базовые инструменты',
    cardPoints: [
      'Натальная карта и нумерология',
      'CRM, календарь и онлайн-запись',
      'Личная страница и PDF-отчёты',
      'Единые сообщения и справочник',
    ],
    limits: ['30 записей в месяц', '20 AI-действий в месяц', '1 воронка', '1 пользователь'],
    features: [
      'Натальная карта и нумерология',
      'Базовый движок и PDF-отчёты',
      'Личная страница записи',
      'Календарь и онлайн-запись',
      'CRM с историей клиентов',
      'Единые сообщения и справочник',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '1 990 ₽',
    period: 'в месяц',
    audience: 'Активная практика с регулярными клиентами.',
    commission: '4%',
    capacityTitle: 'Без ограничений',
    capacityDetail: 'Записи · AI · воронки · продукты',
    includesLabel: 'Всё из Старт, плюс',
    cardPoints: [
      'Все системы расчётов',
      'Продукты без лимита, пакеты',
      'Автоматизации, группы и вебинары',
      'Контент, подписки и Астродневник',
      'Автопостинг и астро-триггеры',
      'Видео, записи сессий и аналитика',
    ],
    limits: ['Записи без ограничений', 'AI без ограничений', 'Воронки без ограничений', 'Продукты без ограничений'],
    features: [
      'Все системы расчётов',
      'Конструктор продуктов и пакетов',
      'Автоматизации, группы и вебинары',
      'AI-разборы, контент и астро-триггеры',
      'Подписки, автопостинг и Астродневник',
      'Видео, записи сессий и аналитика',
    ],
  },
  {
    key: 'studio',
    name: 'Studio',
    price: '4 990 ₽',
    period: 'в месяц',
    audience: 'Команда, собственный бренд или школа.',
    commission: '2%',
    capacityTitle: 'До 5 астрологов',
    capacityDetail: 'Все возможности Pro для команды',
    includesLabel: 'Всё из Pro, плюс',
    cardPoints: [
      'Несколько специалистов в кабинете',
      'Свой бренд без логотипов ElevenHouse',
      'API для сайта и других сервисов',
      'Приоритетная поддержка',
    ],
    limits: ['Всё из Pro', 'Команда до 5 астрологов'],
    features: [
      'Несколько специалистов в кабинете',
      'Свой бренд без логотипов ElevenHouse',
      'API для сайта и других сервисов',
      'Приоритетная поддержка',
    ],
  },
]

export const pricingActionLabel = (plan: PricingPlan) => plan.key === 'start' ? 'Начать бесплатно' : `Выбрать ${plan.name}`
export const pricingRegistrationUrl = 'https://app.elevenhouse.ai/auth?mode=register'
