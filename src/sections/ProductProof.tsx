import { useEffect, useRef, type CSSProperties } from 'react'
import { getScenePosition, getSectionProgress } from './sectionMotion'

const productScenes = [
  {
    index: '01',
    eyebrow: 'Услуги и личная страница',
    title: 'Клиент видит понятный формат и сразу переходит к записи.',
    copy: 'Консультации, курсы и сопровождение собраны в одном каталоге — с ценой, составом и статусом публикации.',
    src: '/assets/product-screenshots/eh-p05-products.png',
    alt: 'Каталог реальных продуктов ElevenHouse',
    crop: 'products',
  },
  {
    index: '02',
    eyebrow: 'Расчёты и профессиональный контекст',
    title: 'Данные клиента превращаются в основу для разбора.',
    copy: 'Результат расчёта остаётся рядом с клиентом и становится отправной точкой для вашей интерпретации.',
    src: '/assets/product-screenshots/eh-p07-numerology.png',
    alt: 'Рассчитанная нумерология в ElevenHouse',
    crop: 'numerology',
  },
  {
    index: '03',
    eyebrow: 'Запись и консультация',
    title: 'От выбора времени — сразу к встрече.',
    copy: 'Клиент, время, формат и ссылка на консультацию собраны в одной подтверждённой записи.',
    src: '/assets/product-screenshots/eh-p01-calendar.png',
    alt: 'Подтверждённая видеоконсультация в календаре ElevenHouse',
    crop: 'calendar',
  },
]

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function ProductProof() {
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
      const progress = reducedMotion ? 1 : getSectionProgress(rect.top, rect.height, window.innerHeight)
      const { index, local } = getScenePosition(progress, productScenes.length)
      section.style.setProperty('--proof-progress', progress.toFixed(4))

      section.querySelectorAll<HTMLElement>('[data-proof-scene]').forEach((node, sceneIndex) => {
        let opacity = sceneIndex === index ? 1 : 0
        if (sceneIndex === index && local > 0.78 && index < productScenes.length - 1) opacity = 1 - ((local - 0.78) / 0.22)
        if (sceneIndex === index + 1 && local > 0.78) opacity = (local - 0.78) / 0.22
        node.style.setProperty('--proof-opacity', clamp01(opacity).toFixed(4))
        node.style.setProperty('--proof-depth', `${(sceneIndex - index) * 90}px`)
      })

      section.querySelectorAll<HTMLElement>('[data-proof-step]').forEach((node, stepIndex) => {
        node.dataset.active = stepIndex === index ? 'true' : 'false'
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
        <header className="product-proof__heading">
          <span>04 · Возможности</span>
          <h2 id="product-proof-title">От построения карты до оплаты —<br />один рабочий процесс.</h2>
        </header>

        <div className="product-proof__steps" aria-hidden="true">
          {productScenes.map((scene, index) => (
            <div data-proof-step data-active={index === 0 ? 'true' : 'false'} key={scene.index}>
              <span>{scene.index}</span><i />
            </div>
          ))}
        </div>

        <div className="product-proof__stage">
          {productScenes.map((scene, index) => (
            <article
              className={`proof-scene proof-scene--${scene.crop}`}
              data-proof-scene
              key={scene.index}
              style={{ '--proof-opacity': index === 0 ? 1 : 0 } as CSSProperties}
            >
              <div className="proof-scene__copy">
                <span>{scene.index} / {scene.eyebrow}</span>
                <h3>{scene.title}</h3>
                <p>{scene.copy}</p>
              </div>
              <figure className="proof-scene__frame">
                <figcaption><span>app.elevenhouse.ai</span><span>реальный интерфейс</span></figcaption>
                <div><img src={scene.src} alt={scene.alt} loading="lazy" /></div>
              </figure>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
