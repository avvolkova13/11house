import { useEffect, useRef, useState } from 'react'
import { AccessFragment } from './AccessFragment'
import { featureChoices, type FeatureId } from './SourceFragments'
import { FeatureWalkthrough } from './FeatureWalkthrough'
import { Icon } from './SourceIcons'
import './sourceFragments.css'
import './productExperience.css'
import './textBackplates.css'

export function ProductExperience({ reducedMotion, onNavigate }: { reducedMotion: boolean; onNavigate: (target: string) => void }) {
  const [selected, setSelected] = useState<FeatureId | null>(null)
  const [visited, setVisited] = useState<FeatureId[]>([])
  const title = useRef<HTMLHeadingElement>(null)
  const selectionChanged = useRef(false)
  const feature = featureChoices.find((item) => item.id === selected)

  const choose = (id: FeatureId | null) => {
    selectionChanged.current = true
    setSelected(id)
    if (id) setVisited((items) => items.includes(id) ? items : [...items, id])
  }
  useEffect(() => {
    if (!selectionChanged.current) return
    selectionChanged.current = false
    title.current?.focus({ preventScroll: true })
    // On narrow screens a card may be far down the menu. Bring the selected fragment into view.
    document.querySelector('#journey-workspace')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
  }, [selected, reducedMotion])

  return <>
    <section className="eh-experience eh-experience--access" id="journey-access" data-chapter="access" aria-labelledby="access-title" tabIndex={-1}>
      <header className="eh-experience__heading"><p className="eh-journey__eyebrow">ЗНАКОМСТВО С ELEVENHOUSE</p><h2 id="access-title">Всё начинается с вас</h2></header>
      <AccessFragment reducedMotion={reducedMotion} onEnter={() => onNavigate('#journey-workspace')} />
    </section>
    <section className="eh-experience eh-experience--features" id="journey-workspace" data-chapter="workspace" aria-labelledby="features-title" tabIndex={-1}>
      <header className={`eh-experience__heading${feature ? ' eh-experience__heading--feature' : ''}`}>
        {feature ? <button type="button" className="eh-experience__back" onClick={() => choose(null)}><Icon.chevL size={15} /> Все возможности</button> : <p className="eh-journey__eyebrow">ВАША ПРАКТИКА В ELEVENHOUSE</p>}
        <h2 id="features-title" ref={title} tabIndex={-1}>{feature ? feature.title : 'Что посмотрим сначала?'}</h2>
        {!feature && <p>Выберите то, что интересно именно вам.</p>}
      </header>
      {feature ? <div className="eh-experience__selected" key={feature.id}>
        <FeatureWalkthrough feature={feature.id} reducedMotion={reducedMotion} onExplore={() => choose(null)} />
      </div> : <div className="eh-experience__choices">{featureChoices.map((item, index) => { const IC = Icon[item.icon]; return <button type="button" key={item.id} className="eh-experience__choice" onClick={() => choose(item.id)} aria-label={`Посмотреть: ${item.title}`}><span className="eh-experience__choice-top"><IC size={25} /><span>{visited.includes(item.id) ? <Icon.check size={15} /> : String(index + 1).padStart(2, '0')}</span></span><strong>{item.title}</strong><span className="eh-experience__choice-bottom"><span>{item.detail}</span><Icon.arrowUR size={17} /></span></button> })}</div>}
      <a className="eh-experience__continue" href="#journey-commercial" onClick={(event) => { event.preventDefault(); onNavigate('#journey-commercial') }}>Тарифы <span aria-hidden="true">↓</span></a>
    </section>
  </>
}
