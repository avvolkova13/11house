import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  type CSSProperties,
} from 'react'

import {
  PUZZLE_FRAGMENT_COUNT,
  getOnboardingCopyState,
  getOnboardingFragmentState,
  getOnboardingSurfaceState,
  sampleOnboardingScrub,
  getOnboardingPuzzlePosition,
  getPuzzleBackgroundPosition,
} from './onboardingPuzzleMotion'

export type OnboardingPuzzleStep = {
  index: string
  title: string
  caption: string
  src: string
  alt: string
  crop: string
}

export type OnboardingPuzzleHandle = {
  render: (progress: number) => void
}

type PuzzleRootStyle = CSSProperties & { '--puzzle-image': string }

type PuzzleFragmentStyle = CSSProperties & {
  '--puzzle-background-x': string
  '--puzzle-background-y': string
  '--puzzle-x': string
  '--puzzle-y': string
  '--puzzle-z': string
  '--puzzle-scale': string
  '--puzzle-opacity': string
  '--puzzle-blur': string
  '--puzzle-rotate-x': string
  '--puzzle-rotate-y': string
}

const puzzleFragments = Array.from({ length: PUZZLE_FRAGMENT_COUNT }, (_, index) => index)

export const OnboardingPuzzle = forwardRef<OnboardingPuzzleHandle, {
  steps: readonly OnboardingPuzzleStep[]
}>(function OnboardingPuzzle({ steps }, forwardedRef) {
  const rootRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef(0)
  const scheduleRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const puzzle = rootRef.current?.closest('.onboarding-puzzle')
    if (!puzzle) return

    const steps = [...puzzle.querySelectorAll<HTMLElement>('.onboarding-puzzle__static-step')]
    if (steps.length === 0) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !('IntersectionObserver' in window)) {
      steps.forEach((step) => { step.dataset.mobileVisible = 'true' })
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.mobileVisible = 'true'
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: '0px 0px -14% 0px', threshold: 0.14 })

    steps.forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || steps.length === 0) return
    const fragments = [...root.querySelectorAll<HTMLElement>('[data-puzzle-fragment]')]
    const copies = [...root.querySelectorAll<HTMLElement>('[data-onboarding-copy]')]
    const image = root.querySelector<HTMLImageElement>('.onboarding-puzzle__assembled')!
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ready = new Set<number>()
    const loaders = new Map<number, HTMLImageElement>()
    let frame = 0
    let visible = false
    let disposed = false
    let initialized = false
    let progress = 0
    let from = 0
    let target = 0
    let startedAt = 0
    let activeStep = -1
    let lastLocal = -1

    const stop = () => {
      window.cancelAnimationFrame(frame)
      frame = 0
      root.dataset.puzzleAnimating = 'false'
    }
    const schedule = () => {
      if (!disposed && visible && !frame && document.visibilityState !== 'hidden'
        && window.innerWidth > 900 && !media.matches
        && root.closest('.product-proof')?.getAttribute('data-motion') !== 'reduced') {
        root.dataset.puzzleAnimating = 'true'
        frame = window.requestAnimationFrame(tick)
      }
    }
    const preload = (index: number) => {
      if (index < 0 || index >= steps.length || loaders.has(index)) return
      const asset = new Image()
      loaders.set(index, asset)
      const finish = () => { if (!disposed) { ready.add(index); schedule() } }
      asset.onload = () => { void asset.decode().catch(() => {}).then(finish) }
      asset.onerror = finish
      asset.src = steps[index].src
    }
    const paint = (value: number) => {
      const position = getOnboardingPuzzlePosition(value, steps.length)
      preload(position.stepIndex)
      preload(position.stepIndex + 1)
      if (!ready.has(position.stepIndex)) return
      if (activeStep !== position.stepIndex) {
        activeStep = position.stepIndex
        root.dataset.puzzleStep = steps[activeStep].index
        root.style.setProperty('--puzzle-image', `url("${steps[activeStep].src}")`)
        image.src = steps[activeStep].src
        copies.forEach((node, index) => { node.dataset.active = index === activeStep ? 'true' : 'false' })
        lastLocal = -1
      }
      if (lastLocal === position.local) return
      const copy = getOnboardingCopyState(position.local)
      const surface = getOnboardingSurfaceState(position.local)
      root.style.setProperty('--puzzle-copy-opacity', String(copy.opacity))
      root.style.setProperty('--puzzle-copy-blur', `${copy.blur}px`)
      root.style.setProperty('--puzzle-copy-y', `${copy.y}px`)
      root.style.setProperty('--puzzle-surface-opacity', String(surface.opacity))
      root.style.setProperty('--puzzle-surface-scale', String(surface.scale))
      root.style.setProperty('--puzzle-assembled-opacity', String(surface.assembled))
      root.dataset.puzzleAssembled = surface.assembled === 1 ? 'true' : 'false'
      // Once assembled, a single decoded image replaces the composited tile edges.
      if (surface.assembled < 1) fragments.forEach((node, index) => {
        const fragment = getOnboardingFragmentState(position.local, index, position.stepIndex)
        node.style.setProperty('--puzzle-x', `${fragment.x}%`)
        node.style.setProperty('--puzzle-y', `${fragment.y}%`)
        node.style.setProperty('--puzzle-z', `${fragment.z}px`)
        node.style.setProperty('--puzzle-scale', String(fragment.scale))
        node.style.setProperty('--puzzle-opacity', String(fragment.opacity))
        node.style.setProperty('--puzzle-blur', `${fragment.blur}px`)
        node.style.setProperty('--puzzle-rotate-x', `${fragment.rotateX}deg`)
        node.style.setProperty('--puzzle-rotate-y', `${fragment.rotateY}deg`)
      })
      lastLocal = position.local
    }
    const tick = (now: number) => {
      frame = 0
      progress = sampleOnboardingScrub(from, target, now - startedAt)
      if (!initialized) {
        initialized = true
        from = target = progress = targetRef.current
        startedAt = now
      } else if (Math.abs(targetRef.current - target) > 0.000001) {
        from = progress
        target = targetRef.current
        startedAt = now
      }
      paint(progress)
      if (Math.abs(progress - target) > 0.000001) schedule()
      else root.dataset.puzzleAnimating = 'false'
    }
    scheduleRef.current = schedule
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
      else { stop(); initialized = false }
    }, { rootMargin: '300px 0px' })
    observer.observe(root)
    const refresh = () => { stop(); initialized = false; lastLocal = -1; schedule() }
    const visibility = () => { if (document.visibilityState === 'hidden') stop(); else refresh() }
    window.addEventListener('resize', refresh)
    media.addEventListener('change', refresh)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      disposed = true
      stop()
      scheduleRef.current = null
      observer.disconnect()
      loaders.forEach(asset => { asset.onload = null; asset.onerror = null })
      loaders.clear()
      window.removeEventListener('resize', refresh)
      media.removeEventListener('change', refresh)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [steps])

  useImperativeHandle(forwardedRef, () => ({
    render(progress: number) {
      const next = Math.min(1, Math.max(0, progress))
      if (Math.abs(next - targetRef.current) <= 0.000001) return
      targetRef.current = next
      scheduleRef.current?.()
    },
  }), [])

  if (steps.length === 0) return null

  const rootStyle: PuzzleRootStyle = {
    '--puzzle-image': `url("${steps[0].src}")`,
  }

  return (
    <div className="onboarding-puzzle">
      <div
        className="onboarding-puzzle__desktop"
        data-onboarding-puzzle="true"
        data-puzzle-step={steps[0].index}
        ref={rootRef}
        style={rootStyle}
      >
        <ol className="onboarding-puzzle__copy-list">
          {steps.map((step, index) => (
            <li
              className="onboarding-puzzle__copy"
              data-active={index === 0 ? 'true' : 'false'}
              data-onboarding-copy={step.index}
              key={step.index}
            >
              <header>
                <h3><span>{step.index}</span>{step.title}</h3>
              </header>
              <p>{step.caption}</p>
              <span className="onboarding-puzzle__sr">{step.alt}</span>
            </li>
          ))}
        </ol>

        <div className="onboarding-puzzle__media" aria-hidden="true">
          <div className="onboarding-puzzle__grid">
            {puzzleFragments.map((fragmentIndex) => {
              const position = getPuzzleBackgroundPosition(fragmentIndex)
              const fragment = getOnboardingFragmentState(0, fragmentIndex)
              const style: PuzzleFragmentStyle = {
                '--puzzle-background-x': `${position.x}%`,
                '--puzzle-background-y': `${position.y}%`,
                '--puzzle-x': `${fragment.x}%`,
                '--puzzle-y': `${fragment.y}%`,
                '--puzzle-z': `${fragment.z}px`,
                '--puzzle-scale': `${fragment.scale}`,
                '--puzzle-opacity': `${fragment.opacity}`,
                '--puzzle-blur': `${fragment.blur}px`,
                '--puzzle-rotate-x': `${fragment.rotateX}deg`,
                '--puzzle-rotate-y': `${fragment.rotateY}deg`,
              }

              return (
                <span
                  data-puzzle-fragment={fragmentIndex}
                  key={fragmentIndex}
                  style={style}
                />
              )
            })}
          </div>
          <img className="onboarding-puzzle__assembled" src={steps[0].src} alt="" decoding="async" />
        </div>
      </div>

      <ol className="onboarding-puzzle__static">
        {steps.map((step, index) => (
          <li className={`onboarding-puzzle__static-step onboarding-puzzle__static-step--${step.crop}`} key={step.index}>
            <header>
              <h3><span>{step.index}</span>{step.title}</h3>
            </header>
            <figure>
              <img src={step.src} alt={step.alt} loading={index === 0 ? 'eager' : 'lazy'} />
              <figcaption>{step.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ol>
    </div>
  )
})
