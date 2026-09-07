import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react'

import {
  PUZZLE_FRAGMENT_COUNT,
  getOnboardingCopyState,
  getOnboardingFragmentState,
  getOnboardingHandoffState,
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

type PuzzleRootStyle = CSSProperties & {
  '--puzzle-image': string
  '--puzzle-lens-opacity'?: string
  '--puzzle-lens-scale'?: string
  '--puzzle-lens-blur'?: string
}

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
  const activeStepRef = useRef(0)

  useImperativeHandle(forwardedRef, () => ({
    render(progress: number) {
      const root = rootRef.current
      if (!root || steps.length === 0) return

      const position = getOnboardingPuzzlePosition(progress, steps.length)
      const copy = getOnboardingCopyState(position.local)
      const handoff = getOnboardingHandoffState(position.local, position.stepIndex)

      if (activeStepRef.current !== position.stepIndex || !root.dataset.puzzleReady) {
        activeStepRef.current = position.stepIndex
        root.dataset.puzzleReady = 'true'
        root.dataset.puzzleStep = steps[position.stepIndex].index
        root.style.setProperty('--puzzle-image', `url("${steps[position.stepIndex].src}")`)
        root.querySelectorAll<HTMLElement>('[data-onboarding-copy]').forEach((node, index) => {
          node.dataset.active = index === position.stepIndex ? 'true' : 'false'
        })
      }

      root.style.setProperty('--puzzle-copy-opacity', copy.opacity.toFixed(4))
      root.style.setProperty('--puzzle-copy-blur', `${copy.blur.toFixed(3)}px`)
      root.style.setProperty('--puzzle-copy-y', `${copy.y.toFixed(3)}px`)
      root.style.setProperty('--puzzle-lens-opacity', handoff.opacity.toFixed(4))
      root.style.setProperty('--puzzle-lens-scale', handoff.scale.toFixed(4))
      root.style.setProperty('--puzzle-lens-blur', `${handoff.blur.toFixed(3)}px`)

      root.querySelectorAll<HTMLElement>('[data-puzzle-fragment]').forEach((node, index) => {
        const fragment = getOnboardingFragmentState(position.local, index, position.stepIndex)
        node.style.setProperty('--puzzle-x', `${fragment.x.toFixed(3)}%`)
        node.style.setProperty('--puzzle-y', `${fragment.y.toFixed(3)}%`)
        node.style.setProperty('--puzzle-z', `${fragment.z.toFixed(3)}px`)
        node.style.setProperty('--puzzle-scale', fragment.scale.toFixed(4))
        node.style.setProperty('--puzzle-opacity', fragment.opacity.toFixed(4))
        node.style.setProperty('--puzzle-blur', `${fragment.blur.toFixed(3)}px`)
        node.style.setProperty('--puzzle-rotate-x', `${fragment.rotateX.toFixed(3)}deg`)
        node.style.setProperty('--puzzle-rotate-y', `${fragment.rotateY.toFixed(3)}deg`)
      })
    },
  }), [steps])

  if (steps.length === 0) return null

  const rootStyle: PuzzleRootStyle = {
    '--puzzle-image': `url("${steps[0].src}")`,
    '--puzzle-lens-opacity': '0',
    '--puzzle-lens-scale': '0.82',
    '--puzzle-lens-blur': '18px',
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
          <span className="onboarding-puzzle__focus-glow" />
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
