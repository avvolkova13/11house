import type { MouseEvent } from 'react'
import wordmark from '../assets/brand/eleven-house-stacked.svg'
import monogram from '../assets/brand/eh-monogram-gold.svg'
import './brand.css'

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
        <picture className="eh-brand-header">
          <source media="(max-width: 700px)" srcSet={monogram} />
          <img src={wordmark} alt="ElevenHouse" width="1131" height="682" />
        </picture>
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
