import { useCallback, useRef, useState, type CSSProperties } from 'react'

import {
  getPricingCardRole,
  PRICING_TRANSITION_MS,
} from './pricingMotion'
import type { PricingMotionState } from './pricingMotion'
import type { PricingPlan } from './pricingData'
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
  const projectionObserverRef = useRef<ResizeObserver | null>(null)
  const reportFallback = useCallback(() => {
    setFallback(true)
    onFallback?.()
  }, [onFallback])
  const planKeys = plans.map((plan) => plan.key)
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
      />

      <div className="pricing-orbit__controls" aria-label="Выбор тарифа">
        {plans.map((plan) => {
          const role = getPricingCardRole(plan.key, motionState, planKeys)
          const isSelected = motionState.activeKey === plan.key

          return (
            <button
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
            key={plan.key}
          >
            <span>ElevenHouse</span>
            <h3>{plan.name}</h3>
            <strong>{plan.price}</strong>
            <small>{plan.period}</small>
            <p>{plan.audience}</p>
            <footer>
              <span>Комиссия</span>
              <strong>{plan.commission}</strong>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
