import { useEffect, useRef, type CSSProperties } from 'react'
import { getSectionProgress, getStoryPosition } from './sectionMotion'

const scenes = [
  {
    key: 'choice',
    marker: '3.1',
    label: 'Выбрала вас',
    title: 'Анна выбирает подходящий формат работы.',
    copy: 'Консультация, разбор, курс, астродневник — выбор начинается с реальных продуктов ElevenHouse.',
    note: 'Подтверждено: каталог продуктов. Стоп до checkout.',
    src: '/assets/product-screenshots/eh-p05-products.png',
    alt: 'Реальный каталог продуктов ElevenHouse',
  },
  {
    key: 'context',
    marker: '3.2',
    label: 'Один контекст',
    title: 'Один человек. Несколько частей работы. Один контекст.',
    copy: 'Запись, профессиональный расчёт и сопровождение занимают свои места вокруг клиента — без обещания автоматической синхронизации.',
    note: 'Подтверждены связи с клиентом; автоматическая цепочка не заявляется.',
    src: '/assets/product-screenshots/eh-p01-calendar.png',
    alt: 'Календарь ElevenHouse с выбранной записью',
  },
  {
    key: 'prepare',
    marker: '3.3',
    label: 'Вы готовитесь',
    title: 'Подготовка — в рабочем расчёте.',
    copy: 'Рабочий расчёт остаётся внутри того же пространства и сохраняет точную геометрию продукта.',
    note: 'В кадре: подтверждённая рассчитанная Нумерология. Human Design не моделируется.',
    src: '/assets/product-screenshots/eh-p07-numerology.png',
    alt: 'Рассчитанная Нумерология в ElevenHouse',
  },
  {
    key: 'session',
    marker: '3.4',
    label: '10:00',
    title: '10:00. Анна уже здесь.',
    copy: 'Календарь, запись, клиент и ссылка на встречу собраны в одном подтверждённом состоянии.',
    note: 'На реальном экране — Елена Смирнова: representative state. Стоп на «Войти в сессию».',
    src: '/assets/product-screenshots/eh-p01-calendar.png',
    alt: 'Подтверждённая видеоконсультация в календаре ElevenHouse',
  },
  {
    key: 'continue',
    marker: '3.5',
    label: '11:00. Всё?',
    title: '11:00. Всё? Не обязательно.',
    copy: 'Работа может продолжаться после или между встречами — в приватном общем контексте.',
    note: 'Астродневник показан как отдельный подтверждённый сценарий сопровождения.',
    src: '/assets/product-screenshots/eh-p09-journal.png',
    alt: 'Клиентская запись и ответ астролога в Астродневнике ElevenHouse',
  },
  {
    key: 'scenario',
    marker: '3.6',
    label: 'Сценарий работы',
    title: 'А что будет дальше — можно продумать заранее.',
    copy: 'Редактор позволяет собрать дальнейшую логику из реальных узлов продукта.',
    note: 'Partially blocked: execution story и продолжение обрезанного требования не достраиваются.',
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
          <h2 id="client-story-title" tabIndex={-1}>Давайте проведём через ElevenHouse одного клиента.</h2>
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
