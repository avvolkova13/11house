import type { MouseEvent } from 'react'

type LandingHeaderProps = {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, target: string) => void
  destinations?: Readonly<Record<string, string>>
}

const navigation = [
  { label: 'Возможности', target: '#product-proof-title' },
  { label: 'Как работает', target: '#ai-routine-title' },
  { label: 'Тарифы', target: '#pricing-title' },
  { label: 'FAQ', target: '#faq-title' },
]

export function LandingHeader({ onNavigate, destinations }: LandingHeaderProps) {
  return (
    <header className="landing-header">
      <a className="landing-header__brand" href="#top" aria-label="ElevenHouse — на главную">
        <span>ELEVEN</span>
        <strong>HOUSE</strong>
      </a>

      <nav aria-label="Основная навигация" className="landing-header__nav">
        {navigation.map((item) => (
          <a href={destinations?.[item.target] ?? item.target} key={item.label} onClick={(event) => onNavigate(event, destinations?.[item.target] ?? item.target)}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="landing-header__actions">
        <div className="landing-header__languages" aria-label="Переключатель языков">
          <button type="button" aria-pressed="true">RU</button>
          <button type="button" aria-pressed="false">EN</button>
        </div>
        <a className="landing-header__login" href="https://app.elevenhouse.ai">Войти</a>
        <a className="landing-header__cta" href="https://app.elevenhouse.ai" aria-label="Создать кабинет бесплатно"><span>Создать кабинет бесплатно</span><span className="landing-header__cta-short" hidden>Создать кабинет</span></a>
      </div>
    </header>
  )
}
