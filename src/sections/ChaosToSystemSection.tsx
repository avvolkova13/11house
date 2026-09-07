import { useEffect, useRef } from 'react'
import { publicAsset } from '../assets'
import { getFragmentPosition, getSectionProgress } from './sectionMotion'

type FragmentConfig = {
  className: string
  src: string
  alt: string
  label: string
  note: string
  x: number
  y: number
  rotation: number
  depth: number
}

const fragments: FragmentConfig[] = [
  {
    className: 'system-fragment--calendar',
    src: publicAsset('assets/product-screenshots/eh-p01-calendar.png'),
    alt: 'Календарь ElevenHouse с подтверждённой записью',
    label: 'Запись',
    note: 'Ольга — 17:00',
    x: -470,
    y: -260,
    rotation: -7,
    depth: 0.92,
  },
  {
    className: 'system-fragment--client',
    src: publicAsset('assets/product-screenshots/eh-p02-clients.png'),
    alt: 'Список клиентов ElevenHouse',
    label: 'Клиент',
    note: 'Где её время рождения?',
    x: 460,
    y: -250,
    rotation: 6,
    depth: 0.88,
  },
  {
    className: 'system-fragment--payment',
    src: publicAsset('assets/product-screenshots/eh-p03-finance.png'),
    alt: 'Финансовый раздел ElevenHouse',
    label: 'Оплата',
    note: 'Оплатила?',
    x: -570,
    y: 80,
    rotation: 4,
    depth: 0.78,
  },
  {
    className: 'system-fragment--meeting',
    src: publicAsset('assets/product-screenshots/eh-p01-calendar.png'),
    alt: 'Панель входа в видеосессию ElevenHouse',
    label: 'Видеовстреча',
    note: 'Скинуть ссылку на созвон',
    x: 570,
    y: 90,
    rotation: -5,
    depth: 0.8,
  },
  {
    className: 'system-fragment--calculation',
    src: publicAsset('assets/product-screenshots/eh-p07-numerology.png'),
    alt: 'Нумерологический расчёт в ElevenHouse',
    label: 'Расчёт',
    note: 'Подготовка к сессии',
    x: -390,
    y: 330,
    rotation: -4,
    depth: 0.72,
  },
  {
    className: 'system-fragment--journal',
    src: publicAsset('assets/product-screenshots/eh-p09-journal.png'),
    alt: 'Запись клиента и ответ астролога в Астродневнике ElevenHouse',
    label: 'Заметка',
    note: 'Написать Кате через месяц',
    x: 390,
    y: 320,
    rotation: 5,
    depth: 0.74,
  },
  {
    className: 'system-fragment--document',
    src: publicAsset('assets/product-screenshots/eh-p04-funnel.png'),
    alt: 'Сценарий работы в редакторе воронок ElevenHouse',
    label: 'Сценарий',
    note: 'Что будет дальше',
    x: 20,
    y: -390,
    rotation: 2,
    depth: 0.66,
  },
]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function ChaosToSystemSection() {
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
      const reveal = clamp01((progress - 0.04) / 0.18)
      const chaos = 1 - clamp01((progress - 0.42) / 0.34)
      const fragmentsFade = 1 - clamp01((progress - 0.7) / 0.17)
      const workspaceReveal = clamp01((progress - 0.57) / 0.25)
      const finalReveal = clamp01((progress - 0.78) / 0.16)
      const compact = window.innerWidth <= 700

      section.style.setProperty('--system-progress', progress.toFixed(4))
      section.style.setProperty('--system-intro-opacity', String(1 - clamp01((progress - 0.18) / 0.2)))
      section.style.setProperty('--system-workspace-opacity', workspaceReveal.toFixed(4))
      section.style.setProperty('--system-final-opacity', finalReveal.toFixed(4))

      const nodes = section.querySelectorAll<HTMLElement>('[data-system-fragment]')
      nodes.forEach((node, index) => {
        const config = fragments[index]
        const scattered = getFragmentPosition(config.x, config.y, compact)
        const drift = chaos * reveal
        const orderedX = (index - (fragments.length - 1) / 2) * (compact ? 31 : 54)
        const orderedY = (index % 2 === 0 ? -1 : 1) * (compact ? 18 : 24)
        const x = scattered.x * drift + orderedX * (1 - chaos)
        const y = scattered.y * drift + orderedY * (1 - chaos)
        const scale = 0.72 + config.depth * 0.25 + (1 - chaos) * 0.08
        node.style.opacity = String(reveal * fragmentsFade)
        node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${config.rotation * chaos}deg) scale(${scale})`
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
    <section ref={sectionRef} className="system-transition" aria-labelledby="system-transition-title">
      <div className="system-transition__sticky">
        <div className="system-transition__atmosphere" aria-hidden="true" />
        <header className="system-transition__intro">
          <p>Хотя подождите.</p>
          <h2 id="system-transition-title">У вас ведь уже есть система.</h2>
          <p className="system-transition__intro-last">Вот она.</p>
        </header>

        <div className="system-transition__fragments" aria-label="Части практики в ElevenHouse">
          {fragments.map((fragment) => (
            <figure
              className={`system-fragment ${fragment.className}`}
              data-system-fragment
              key={fragment.label}
            >
              <div className="system-fragment__viewport">
                <img src={fragment.src} alt={fragment.alt} loading="lazy" />
              </div>
              <figcaption>
                <span>{fragment.label}</span>
                <small>{fragment.note}</small>
              </figcaption>
            </figure>
          ))}
        </div>

        <figure className="system-transition__workspace">
          <div className="system-transition__workspace-bar">
            <span>ELEVENHOUSE</span>
            <span>ASTROLOGER WORKSPACE</span>
          </div>
          <div className="system-transition__workspace-crop">
            <img
              src={publicAsset('assets/product-screenshots/eh-p05-products.png')}
              alt="Реальный каталог продуктов ElevenHouse"
              loading="lazy"
            />
          </div>
        </figure>

        <footer className="system-transition__final">
          <span aria-hidden="true">02</span>
          <p>Мы просто собрали вашу работу обратно.</p>
        </footer>
      </div>
    </section>
  )
}
