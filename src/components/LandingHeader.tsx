import type { MouseEvent } from 'react'

type LandingHeaderProps = {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, target: string) => void
  destinations?: Readonly<Record<string, string>>
}

const navigation = [
  { label: 'Возможности', target: '#product-proof-title' },
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
        <a className="landing-header__login" href="https://app.elevenhouse.ai">Войти</a>
        <a className="landing-header__cta" href="https://app.elevenhouse.ai">Создать кабинет</a>
      </div>
    </header>
  )
}
