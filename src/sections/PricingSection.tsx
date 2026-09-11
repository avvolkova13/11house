import { useCallback, useEffect, useRef, useState } from 'react'

import { PricingOrbit } from './PricingOrbit'
import { parsePricingFrameOverride } from './PricingWebGLStage'
import {
  PRICING_HOLD_MS,
  PRICING_TRANSITION_MS,
  beginPricingTransition,
  completePricingTransition,
  createPricingMotionState,
} from './pricingMotion'
import { pricingPlans } from './pricingData'
import type { PricingPlan } from './pricingData'
import './pricingCompact.css'

export type PricingInputModality = 'keyboard' | 'pointer'

const pricingPlanKeys = pricingPlans.map((plan) => plan.key)

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [motionState, setMotionState] = useState(createPricingMotionState)
  const [isInView, setIsInView] = useState(false)
  const [isFocusInside, setIsFocusInside] = useState(false)
  const [isPointerInside, setIsPointerInside] = useState(false)
  const [inputModality, setInputModality] = useState<PricingInputModality>('pointer')
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const selectedPlan = pricingPlans.find((plan) => plan.key === motionState.activeKey) ?? pricingPlans[1]
  const isKeyboardFocusPaused = isFocusInside && inputModality === 'keyboard'
  const hasDevelopmentFrameOverride = import.meta.env.DEV
    && typeof window !== 'undefined'
    && parsePricingFrameOverride(window.location.search) !== null
  const isAutoPaused = !isInView
    || isPointerInside
    || isKeyboardFocusPaused
    || !isDocumentVisible
    || prefersReducedMotion
    || hasDevelopmentFrameOverride

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    if (!('IntersectionObserver' in window)) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '18% 0px', threshold: 0.05 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(document.visibilityState !== 'hidden')
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const handleGlobalPointerDown = () => setInputModality('pointer')
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
        setInputModality('keyboard')
      }
    }

    window.addEventListener('pointerdown', handleGlobalPointerDown)
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

  useEffect(() => {
    if (motionState.phase !== 'holding' || isAutoPaused) return

    const timeoutId = window.setTimeout(() => {
      setMotionState((current) => beginPricingTransition(current, pricingPlanKeys))
    }, PRICING_HOLD_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isAutoPaused, motionState.phase, motionState.sequence])

  useEffect(() => {
    if (motionState.phase !== 'transitioning') return

    if (prefersReducedMotion) {
      setMotionState((current) => completePricingTransition(current))
      return
    }

    const timeoutId = window.setTimeout(() => {
      setMotionState((current) => completePricingTransition(current))
    }, PRICING_TRANSITION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [motionState.phase, motionState.sequence, prefersReducedMotion])

  const selectPlan = useCallback((key: PricingPlan['key']) => {
    setMotionState((current) => {
      if (prefersReducedMotion && current.phase === 'holding' && current.activeKey !== key) {
        return createPricingMotionState(key)
      }

      return beginPricingTransition(current, pricingPlanKeys, key)
    })
  }, [prefersReducedMotion])

  const settleAfterPricingFallback = useCallback(() => {
    setMotionState((current) => current.phase === 'transitioning'
      ? completePricingTransition(current)
      : current)
  }, [])

  return (
    <section className="pricing-section" id="pricing" aria-labelledby="pricing-title" ref={sectionRef}>
      <header className="pricing-section__heading">
        <h2 id="pricing-title">Начните бесплатно</h2>
        <p className="pricing-section__subtitle">Расширяйте возможности по мере роста</p>
        <p>Выберите объём инструментов под текущую практику. Pro остаётся основным тарифом для регулярной работы.</p>
      </header>

      <div
        className="pricing-motion-stage"
        data-auto-paused={isAutoPaused ? 'true' : 'false'}
        onPointerOver={(event) => setIsPointerInside((event.target as HTMLElement).closest('.pricing-card-action') !== null)}
        onPointerLeave={() => setIsPointerInside(false)}
        onFocusCapture={() => setIsFocusInside(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusInside(false)
        }}
      >
        <PricingOrbit
          plans={pricingPlans}
          motionState={motionState}
          inView={isInView}
          prefersReducedMotion={prefersReducedMotion}
          onSelect={selectPlan}
          onFallback={settleAfterPricingFallback}
        />

        <div className="pricing-plan-switcher" aria-label="Выбор тарифа">
          {pricingPlans.map((plan) => (
            <button
              type="button"
              aria-pressed={motionState.activeKey === plan.key}
              data-plan={plan.key}
              onClick={() => selectPlan(plan.key)}
              key={plan.key}
            >
              {plan.name}
              {plan.key === 'pro' && <span className="pricing-plan-switcher__recommendation">Рекомендуем</span>}
            </button>
          ))}
        </div>
      </div>

      <p className="pricing-section__status" aria-live="polite">Выбран тариф {selectedPlan.name}</p>

    </section>
  )
}
