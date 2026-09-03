import { useEffect, useRef, type CSSProperties } from 'react'
import { getSectionProgress, getStoryPosition } from './sectionMotion'

const scenes = [
  {
    key: 'choice',
    marker: '3.1',
    label: 'Собрали услуги',
    title: 'Начните с формата, который уже можно продать.',
    copy: 'Консультация, разбор, курс или сопровождение — соберите предложение и разместите его на личной странице.',
    note: 'Клиент сразу видит формат, стоимость и следующий шаг.',
    src: '/assets/product-screenshots/eh-p05-products.png',
    alt: 'Реальный каталог продуктов ElevenHouse',
  },
  {
    key: 'context',
    marker: '3.2',
    label: 'Открыли запись',
    title: 'Клиент выбирает время — вы видите весь контекст.',
    copy: 'Запись, клиент и история работы остаются в одном кабинете.',
    note: 'Календарь, онлайн-запись и CRM доступны уже на тарифе «Старт».',
    src: '/assets/product-screenshots/eh-p01-calendar.png',
    alt: 'Календарь ElevenHouse с выбранной записью',
  },
  {
    key: 'prepare',
    marker: '3.3',
    label: 'Подготовили расчёт',
    title: 'Расчёт готов там же, где данные клиента.',
    copy: 'Натальная карта и нумерология доступны на «Старте»; остальные системы открываются на платных тарифах.',
    note: 'Меньше переключений между сервисами — больше времени на интерпретацию.',
    src: '/assets/product-screenshots/eh-p07-numerology.png',
    alt: 'Рассчитанная Нумерология в ElevenHouse',
  },
  {
    key: 'session',
    marker: '3.4',
    label: 'Провели встречу',
    title: 'Консультация начинается из календаря.',
    copy: 'Клиент, время и ссылка на встречу собраны в одной записи.',
    note: 'Видеоконсультации и запись сессий входят в платные тарифы.',
    src: '/assets/product-screenshots/eh-p01-calendar.png',
    alt: 'Подтверждённая видеоконсультация в календаре ElevenHouse',
  },
  {
    key: 'continue',
    marker: '3.5',
    label: 'Продолжили работу',
    title: 'После консультации контакт не теряется.',
    copy: 'В Астродневнике клиент оставляет записи, а вы отвечаете в общем приватном контексте.',
    note: 'Сопровождение продолжается между встречами без разрозненных переписок.',
    src: '/assets/product-screenshots/eh-p09-journal.png',
    alt: 'Клиентская запись и ответ астролога в Астродневнике ElevenHouse',
  },
  {
    key: 'scenario',
    marker: '3.6',
    label: 'Передали рутину AI',
    title: 'Сценарий ведёт клиента, AI готовит основу.',
    copy: 'Система собирает данные рождения, строит карту, готовит черновик разбора, принимает оплату и возвращает клиента.',
    note: 'AI работает по вашим трактовкам и в вашем тоне. Последнее слово всегда за вами.',
    src: '/assets/product-screenshots/eh-p04-funnel.png',
    alt: 'Черновик сценария в редакторе воронок ElevenHouse',
  },
]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function OneClientStory() {
  const sectionRef = useRef<HTMLElement>(null)
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
      const progress = reducedMotion
        ? 1
        : getSectionProgress(rect.top, rect.height, window.innerHeight)
      const { index, local } = getStoryPosition(progress, scenes.length)

      section.dataset.scene = String(index)
      section.style.setProperty('--client-story-progress', progress.toFixed(4))
      section.style.setProperty('--client-scene-progress', local.toFixed(4))

      section.querySelectorAll<HTMLElement>('[data-client-scene]').forEach((node, sceneIndex) => {
        let opacity = sceneIndex === index ? 1 : 0
        if (sceneIndex === index && local > 0.82 && index < scenes.length - 1) {
          opacity = 1 - (local - 0.82) / 0.18
        }
        if (sceneIndex === index + 1 && local > 0.82) opacity = (local - 0.82) / 0.18

        node.style.setProperty('--client-scene-opacity', clamp01(opacity).toFixed(4))
        node.style.setProperty('--client-scene-offset', `${(sceneIndex - index) * 42}px`)
      })

      section.querySelectorAll<HTMLElement>('[data-client-step]').forEach((node, stepIndex) => {
        node.dataset.active = stepIndex === index ? 'true' : 'false'
        node.dataset.passed = stepIndex < index ? 'true' : 'false'
      })
    }

    const queueRender = () => {
      if (frameRef.current) return
      frameRef.current = window.requestAnimationFrame(render)
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
    <section ref={sectionRef} className="client-story" aria-labelledby="client-story-title">
      <div className="client-story__sticky">
        <header className="client-story__header">
          <span>03 · Один клиент внутри ElevenHouse</span>
          <h2 id="client-story-title" tabIndex={-1}>От первого продукта — к работе с постоянным клиентом.</h2>
        </header>

        <div className="client-story__anchor" aria-label="Клиент Анна">
          <span>Клиент</span>
          <strong>Анна</strong>
        </div>

        <nav className="client-story__rail" aria-label="Этапы работы с клиентом">
          {scenes.map((scene, index) => (
            <div data-client-step data-active={index === 0 ? 'true' : 'false'} key={scene.key}>
              <span>{scene.marker}</span>
              <p>{scene.label}</p>
            </div>
          ))}
        </nav>

        <div className="client-story__stage">
          {scenes.map((scene, index) => (
            <article
              className={`client-scene client-scene--${scene.key}`}
              data-client-scene
              style={{ '--client-scene-opacity': index === 0 ? 1 : 0 } as CSSProperties}
              key={scene.key}
            >
              <div className="client-scene__copy">
                <span>{scene.marker} · {scene.label}</span>
                <h3>{scene.title}</h3>
                <p>{scene.copy}</p>
                <small>{scene.note}</small>
              </div>

              <figure className="client-scene__product">
                <div className="client-scene__product-bar">
                  <span>ELEVENHOUSE</span>
                  <span>{scene.label}</span>
                </div>
                <div className="client-scene__crop">
                  <img src={scene.src} alt={scene.alt} loading="lazy" />
                </div>
              </figure>

              {scene.key === 'context' && (
                <div className="client-scene__contexts" aria-label="Подтверждённые рабочие контексты клиента">
                  <figure><img src="/assets/product-screenshots/eh-p07-numerology.png" alt="Нумерология" /></figure>
                  <figure><img src="/assets/product-screenshots/eh-p09-journal.png" alt="Астродневник" /></figure>
                </div>
              )}
            </article>
          ))}
        </div>

        <footer className="client-story__footer">
          <span>Один человек</span>
          <div><i /></div>
          <span>Один контекст</span>
        </footer>
      </div>
    </section>
  )
}
