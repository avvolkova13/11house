import { useCallback, useRef, useState, type CSSProperties } from 'react'

import {
  getPricingCardRole,
  PRICING_TRANSITION_MS,
} from './pricingMotion'
import type { PricingMotionState } from './pricingMotion'
import type { PricingPlan } from './pricingData'
import { pricingActionLabel, pricingRegistrationUrl } from './pricingData'
import { PRICING_TEXTURE_HEIGHT, PRICING_TEXTURE_WIDTH } from './pricingCardTexture'
import {
  PRICING_CAMERA_FRAMING_SCALE,
  getPricingHoldFrame,
} from './PricingWebGLScene'
import { PricingWebGLStage } from './PricingWebGLStage'

type PricingOrbitProps = {
  plans: PricingPlan[]
  motionState: PricingMotionState
  inView: boolean
  prefersReducedMotion: boolean
  onSelect: (key: PricingPlan['key']) => void
  onFallback?: () => void
}

const PRICING_CONTACT_SHADOW_OFFSET_PX = 8

export function PricingOrbit({
  plans,
  motionState,
  inView,
  prefersReducedMotion,
  onSelect,
  onFallback,
}: PricingOrbitProps) {
  const [fallback, setFallback] = useState(false)
  const controlElements = useRef<Array<HTMLButtonElement | null>>([])
  const projectionObserverRef = useRef<ResizeObserver | null>(null)
  const reportFallback = useCallback(() => {
    controlElements.current.forEach((control) => {
      if (!control) return
      for (const property of ['transform', 'width', 'height', 'left', 'top', 'transform-origin']) control.style.removeProperty(property)
    })
    setFallback(true)
    onFallback?.()
  }, [onFallback])
  const planKeys = plans.map((plan) => plan.key)
  const cardElements = useRef<Array<HTMLElement | null>>([])
  const updateCardFrame = useCallback((index: number, transform: string, width: number, opacity: number, depth: number) => {
    const element = cardElements.current[index]
    if (!element) return
    element.style.transform = transform
    element.style.width = `${width}px`
    element.style.opacity = `${opacity}`
    element.style.zIndex = `${Math.round((depth + 3) * 100)}`
    element.style.visibility = 'visible'
    const control = controlElements.current[index]
    if (control) {
      control.style.transform = transform
      control.style.transformOrigin = '0 0'
      control.style.left = '0'
      control.style.top = '0'
      control.style.width = `${width}px`
      control.style.height = `${width * PRICING_TEXTURE_HEIGHT / PRICING_TEXTURE_WIDTH}px`
    }
  }, [])
  const sceneStyle = {
    '--pricing-transition-duration': `${PRICING_TRANSITION_MS}ms`,
    '--pricing-camera-framing-scale': PRICING_CAMERA_FRAMING_SCALE,
  } as CSSProperties
  const attachOrbit = useCallback((element: HTMLDivElement | null) => {
    projectionObserverRef.current?.disconnect()
    projectionObserverRef.current = null
    if (!element) return

    const updateProjection = (width: number, height: number) => {
      const frame = getPricingHoldFrame(width, height)
      element.style.setProperty('--pricing-active-hit-width', `${frame.width}px`)
      element.style.setProperty('--pricing-active-hit-height', `${frame.height}px`)
      // Space the visible card, not the empty camera framing around it.
      element.style.setProperty('--pricing-frame-inset', `${Math.max(0, (height - frame.height) / 2)}px`)
      element.parentElement?.style.setProperty('--pricing-frame-inset', `${Math.max(0, (height - frame.height) / 2)}px`)
      element.style.setProperty(
        '--pricing-contact-shadow-top',
        `calc(50% + ${frame.height / 2 + PRICING_CONTACT_SHADOW_OFFSET_PX}px)`,
      )
    }

    updateProjection(element.clientWidth, element.clientHeight)
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      updateProjection(
        entry?.contentRect.width || element.clientWidth,
        entry?.contentRect.height || element.clientHeight,
      )
    })
    observer.observe(element)
    projectionObserverRef.current = observer
  }, [])

  return (
    <div
      ref={attachOrbit}
      className="pricing-orbit"
      data-in-view={inView ? 'true' : 'false'}
      data-motion-phase={motionState.phase}
      data-motion-direction={motionState.direction}
      data-motion-sequence={motionState.sequence}
      style={sceneStyle}
    >
      <PricingWebGLStage
        plans={plans}
        motionState={motionState}
        inView={inView}
        prefersReducedMotion={prefersReducedMotion}
        onFallback={reportFallback}
        onCardFrame={updateCardFrame}
      />

      <div className="pricing-orbit__controls" aria-label="Выбор тарифа">
        {plans.map((plan, index) => {
          const role = getPricingCardRole(plan.key, motionState, planKeys)
          const isSelected = motionState.activeKey === plan.key

          return (
            <button
              ref={(element) => { controlElements.current[index] = element }}
              className="pricing-orbit-hit-area"
              data-card-role={role}
              data-plan={plan.key}
              data-selected={isSelected ? 'true' : 'false'}
              type="button"
              aria-label={`Подробнее о тарифе ${plan.name}`}
              aria-pressed={isSelected}
              disabled={motionState.phase === 'transitioning'}
              onClick={() => onSelect(plan.key)}
              key={plan.key}
            />
          )
        })}
      </div>

      <div className="pricing-native-layer" hidden={fallback}>
        {plans.map((plan, index) => (
          <article className="pricing-native-card" data-plan={plan.key} data-active={motionState.phase === 'holding' && motionState.activeKey === plan.key} aria-label={`Тариф ${plan.name}`} key={plan.key}
            ref={(element) => { cardElements.current[index] = element }}
            style={{ aspectRatio: `${PRICING_TEXTURE_WIDTH} / ${PRICING_TEXTURE_HEIGHT}` }}>
            <span className="pricing-native-brand">ELEVENHOUSE</span>
            {plan.key === 'pro' && <span className="pricing-recommendation">Рекомендуем</span>}
            <div className="pricing-native-capacity"><strong>{plan.capacityTitle}</strong><span>{plan.capacityDetail}</span></div>
            <div className="pricing-native-body">
              <header className="pricing-native-heading">
                <h3>{plan.name}</h3>
                <div className="pricing-native-price"><strong>{plan.price}</strong><small>{plan.period}</small></div>
              </header>
              <p className="pricing-native-audience">{plan.audience}</p>
              <p className="pricing-native-commission"><span>Комиссия с продаж</span><strong>{plan.commission}</strong></p>
              <p className="pricing-includes-label">{plan.includesLabel}</p>
              <ul>{plan.cardPoints.map((point) => <li key={point}>{point}</li>)}</ul>
              <a className="pricing-card-action" href={pricingRegistrationUrl}
                tabIndex={motionState.phase === 'holding' && motionState.activeKey === plan.key ? 0 : -1}
                style={{ pointerEvents: motionState.phase === 'holding' && motionState.activeKey === plan.key ? 'auto' : 'none' }}>
                {pricingActionLabel(plan)}
              </a>
            </div>
          </article>
        ))}
      </div>

      <div
        className="pricing-orbit-fallback"
        data-visible={fallback ? 'true' : 'false'}
        aria-hidden={!fallback}
        hidden={!fallback}
      >
        {plans.map((plan) => (
          <article
            className={`pricing-orbit-fallback__card pricing-orbit-fallback__card--${plan.key}`}
            data-card-role={getPricingCardRole(plan.key, motionState, planKeys)}
            aria-hidden={motionState.activeKey !== plan.key}
            key={plan.key}
          >
            <span>ElevenHouse</span>
            {plan.key === 'pro' && <span className="pricing-fallback-recommendation">Рекомендуем</span>}
            <h3>{plan.name}</h3>
            <strong>{plan.price}</strong>
            <small>{plan.period}</small>
            <p>{plan.audience}</p>
            <p className="pricing-fallback-capacity"><strong>{plan.capacityTitle}</strong><br />{plan.capacityDetail}</p>
            <footer>
              <span>Комиссия</span>
              <strong>{plan.commission}</strong>
            </footer>
            <p className="pricing-includes-label">{plan.includesLabel}</p>
            <ul>{plan.cardPoints.map((point) => <li key={point}>{point}</li>)}</ul>
            <a className="pricing-fallback-action" href={pricingRegistrationUrl} tabIndex={fallback && motionState.activeKey === plan.key ? 0 : -1}>{pricingActionLabel(plan)}</a>
          </article>
        ))}
      </div>
    </div>
  )
}
