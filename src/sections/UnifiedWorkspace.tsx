import { useState } from 'react'

const workspaceSurfaces = [
  { key: 'calendar', label: 'Календарь', detail: 'Запись и встреча', src: '/assets/product-screenshots/eh-p01-calendar.png', alt: 'Календарь ElevenHouse' },
  { key: 'clients', label: 'Клиенты', detail: 'База и статусы', src: '/assets/product-screenshots/eh-p02-clients.png', alt: 'Раздел клиентов ElevenHouse' },
  { key: 'finance', label: 'Финансы', detail: 'Баланс и операции', src: '/assets/product-screenshots/eh-p03-finance.png', alt: 'Раздел финансов ElevenHouse в нулевом состоянии' },
  { key: 'funnels', label: 'Воронки', detail: 'Сценарии работы', src: '/assets/product-screenshots/eh-p04-funnel.png', alt: 'Редактор воронок ElevenHouse' },
  { key: 'products', label: 'Продукты', detail: 'Услуги и пакеты', src: '/assets/product-screenshots/eh-p05-products.png', alt: 'Каталог продуктов ElevenHouse' },
  { key: 'journal', label: 'Астродневник', detail: 'Контекст между встречами', src: '/assets/product-screenshots/eh-p09-journal.png', alt: 'Астродневник ElevenHouse' },
]

export function UnifiedWorkspace() {
  const [activeKey, setActiveKey] = useState(workspaceSurfaces[0].key)
  const activeIndex = workspaceSurfaces.findIndex((surface) => surface.key === activeKey)
  const active = workspaceSurfaces[activeIndex]

  return (
    <section className="unified-workspace" aria-labelledby="workspace-title">
      <header className="unified-workspace__heading">
        <span>06 · Один кабинет</span>
        <h2 id="workspace-title">Вместо шести вкладок —<br />одна практика.</h2>
        <p>Клиент не распадается на запись, платёж, расчёт и переписку. Рабочий контекст остаётся внутри ElevenHouse.</p>
      </header>

      <div className="unified-workspace__layout">
        <nav className="unified-workspace__index" aria-label="Разделы ElevenHouse">
          {workspaceSurfaces.map((surface, index) => (
            <button
              aria-pressed={surface.key === active.key}
              data-active={surface.key === active.key ? 'true' : 'false'}
              key={surface.key}
              onClick={() => setActiveKey(surface.key)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{surface.label}</strong>
              <small>{surface.detail}</small>
            </button>
          ))}
        </nav>

        <div className="unified-workspace__viewer">
          <div className="unified-workspace__counter"><span>{String(activeIndex + 1).padStart(2, '0')}</span> / 06</div>
          <figure key={active.key}>
            <figcaption><span>ELEVENHOUSE / {active.label}</span><span>{active.detail}</span></figcaption>
            <div><img src={active.src} alt={active.alt} /></div>
          </figure>
        </div>
      </div>
    </section>
  )
}
