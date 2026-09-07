import { useEffect, useRef, type CSSProperties } from 'react'
import { publicAsset } from '../assets'
import { OnboardingPuzzle, type OnboardingPuzzleHandle } from './OnboardingPuzzle'
import { getSectionProgress } from './sectionMotion'
import { getProductCardState } from './productCardStackMotion'

export const onboardingSteps = [
  {
    index: '01',
    title: 'Зарегистрировались и заполнили профиль',
    caption: 'Профиль и данные практики собраны в одном рабочем пространстве.',
    src: publicAsset('assets/product-screenshots/eh-p02-clients.png'),
    alt: 'Рабочий кабинет ElevenHouse после регистрации',
    crop: 'profile',
  },
  {
    index: '02',
    title: 'Добавили услуги и опубликовали личную страницу',
    caption: 'Клиент сразу видит формат, стоимость и переходит к записи.',
    src: publicAsset('assets/product-screenshots/eh-p05-products.png'),
    alt: 'Каталог услуг ElevenHouse с опубликованными продуктами',
    crop: 'products',
  },
  {
    index: '03',
    title: 'Настроили запись, оплату и автоматизацию',
    caption: 'Время, предоплата и напоминания работают без ручной переписки.',
    src: publicAsset('assets/product-screenshots/eh-p01-calendar.png'),
    alt: 'Настроенная запись в календаре ElevenHouse',
    crop: 'booking',
  },
  {
    index: '04',
    title: 'Проводите консультации, а система напоминает клиентам и помогает возвращать их',
    caption: 'После консультации система помогает продолжить контакт и вернуть клиента.',
    src: publicAsset('assets/product-screenshots/eh-p04-funnel.png'),
    alt: 'Автоматическая воронка сопровождения в ElevenHouse',
    crop: 'automation',
  },
] as const

export const productScenes = [
  {
    index: '01',
    eyebrow: 'Карта и AI-черновик',
    title: 'Начинайте разбор с готовой основы, а не с пустого листа.',
    copy: 'Расчёт хранится в кабинете, а AI готовит первый черновик по вашим трактовкам — вам остаётся проверить и дополнить его.',
    src: publicAsset('assets/product-screenshots/eh-p07-numerology.png'),
    alt: 'Экран расчёта нумерологии в ElevenHouse',
    crop: 'numerology',
  },
  {
    index: '02',
    eyebrow: 'Клиенты и история',
    title: 'Продолжайте работу с того места, на котором остановились.',
    copy: 'Контакты, статус и рабочий контекст клиента остаются рядом — ничего не приходится восстанавливать по перепискам.',
    src: publicAsset('assets/product-screenshots/eh-p02-clients.png'),
    alt: 'Раздел клиентов ElevenHouse',
    crop: 'clients',
  },
  {
    index: '03',
    eyebrow: 'Услуги и личная страница',
    title: 'Клиент понимает формат и сразу переходит к записи.',
    copy: 'Консультации, курсы и сопровождение собраны в одном каталоге — с ценой, составом и статусом публикации.',
    src: publicAsset('assets/product-screenshots/eh-p05-products.png'),
    alt: 'Каталог реальных продуктов ElevenHouse',
    crop: 'products',
  },
  {
    index: '04',
    eyebrow: 'Запись и оплаты',
    title: 'Встреча подтверждена, а оплата не теряется в переписке.',
    copy: 'Клиент выбирает время, получает подтверждение и оплачивает услугу внутри одного связного процесса.',
    src: publicAsset('assets/product-screenshots/eh-p01-calendar.png'),
    secondarySrc: publicAsset('assets/product-screenshots/eh-p03-finance.png'),
    alt: 'Подтверждённая консультация и финансы в ElevenHouse',
    crop: 'calendar',
  },
  {
    index: '05',
    eyebrow: 'Аналитика',
    title: 'Видите деньги и динамику практики без ручных таблиц.',
    copy: 'Продажи, комиссии, выплаты и история операций собраны в одном финансовом контуре.',
    src: publicAsset('assets/product-screenshots/eh-p03-finance.png'),
    alt: 'Финансовая аналитика ElevenHouse',
    crop: 'finance',
  },
] as const

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function ProductProof() {
  const sectionRef = useRef<HTMLElement>(null)
  const onboardingPuzzleRef = useRef<OnboardingPuzzleHandle>(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('reduced-motion'))
    section.dataset.motion = reducedMotion ? 'reduced' : 'full'

    const render = () => {
      frameRef.current = 0
      const rect = section.getBoundingClientRect()
      const progress = reducedMotion ? 1 : getSectionProgress(rect.top, rect.height, window.innerHeight)
      const onboardingProgress = clamp01(progress / 0.42)
      const processProgress = clamp01((progress - 0.4) / 0.6)
      const compact = window.innerWidth <= 900

      section.style.setProperty('--proof-progress', processProgress.toFixed(4))
      section.style.setProperty('--onboarding-opacity', (1 - clamp01((progress - 0.4) / 0.035)).toFixed(4))
      section.style.setProperty('--process-opacity', clamp01((progress - 0.4) / 0.035).toFixed(4))
      section.style.setProperty('--process-heading-opacity', (1 - clamp01((processProgress - 0.035) / 0.13)).toFixed(4))

      onboardingPuzzleRef.current?.render(onboardingProgress)

      section.querySelectorAll<HTMLElement>('[data-proof-card]').forEach((node, cardIndex) => {
        const card = getProductCardState(processProgress, cardIndex, productScenes.length, compact)
        node.style.setProperty('--card-x', `${card.x.toFixed(2)}px`)
        node.style.setProperty('--card-y', `${card.y.toFixed(2)}px`)
        node.style.setProperty('--card-rotation', `${card.rotation.toFixed(3)}deg`)
        node.style.setProperty('--card-scale', card.scale.toFixed(4))
        node.style.setProperty('--card-opacity', card.opacity.toFixed(4))
        node.style.setProperty('--card-blur', `${card.blur.toFixed(3)}px`)
        node.style.zIndex = `${card.zIndex}`
      })
    }

    const queueRender = () => {
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(render)
    }
    render()
    window.addEventListener('scroll', queueRender, { passive: true })
    window.addEventListener('resize', queueRender, { passive: true })
    return () => {
      window.removeEventListener('scroll', queueRender)
      window.removeEventListener('resize', queueRender)
      window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <section className="product-proof" ref={sectionRef} aria-labelledby="product-proof-title">
      <div className="product-proof__sticky">
        <div className="product-proof__onboarding-chapter">
          <header className="product-proof__heading">
            <h2 id="product-proof-title">Настройте кабинет за четыре шага</h2>
          </header>

          <OnboardingPuzzle ref={onboardingPuzzleRef} steps={onboardingSteps} />
        </div>

        <div className="product-proof__process-chapter">
          <header className="product-proof__process-heading">
            <span>Один связный процесс</span>
            <h2>От построения карты до оплаты —<br />один рабочий процесс.</h2>
          </header>

          <div className="proof-card-stack">
            {productScenes.map((scene, index) => (
              <article
                className={`proof-card proof-card--${scene.crop}`}
                data-proof-card
                key={scene.index}
                style={{
                  '--card-x': `${index % 2 === 0 ? 360 : -360}px`,
                  '--card-y': '-260px',
                  '--card-rotation': `${index % 2 === 0 ? 9 : -9}deg`,
                  '--card-scale': 1.1,
                  '--card-opacity': 0,
                  '--card-blur': '5px',
                  zIndex: index + 1,
                } as CSSProperties}
              >
                <div className="proof-card__media" aria-hidden="true">
                  <img src={scene.src} alt="" loading="lazy" />
                  {'secondarySrc' in scene && (
                    <img className="proof-card__secondary" src={scene.secondarySrc} alt="" loading="lazy" />
                  )}
                </div>
                <div className="proof-card__tint" aria-hidden="true" />
                <div className="proof-card__edge" aria-hidden="true" />
                <div className="proof-card__content">
                  <div className="proof-card__top">
                    <span className="proof-card__number">({scene.index})</span>
                    <span className="proof-card__eyebrow">{scene.eyebrow}</span>
                  </div>
                  <h3 className="proof-card__title">{scene.title}</h3>
                  <p className="proof-card__footer">{scene.copy}</p>
                </div>
                <img className="proof-card__source" src={scene.src} alt={scene.alt} loading="lazy" />
              </article>
            ))}
          </div>

          <p className="product-proof__more">
            А ещё внутри: астрокалендарь, воронки, контент и подписки, справочник и дополнительные системы расчётов.
          </p>
        </div>
      </div>
    </section>
  )
}
