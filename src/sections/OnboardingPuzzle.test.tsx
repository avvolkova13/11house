import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { OnboardingPuzzle, type OnboardingPuzzleHandle } from './OnboardingPuzzle'

const steps = Array.from({ length: 4 }, (_, index) => ({
  index: `0${index + 1}`,
  title: `Шаг ${index + 1}`,
  caption: `Польза ${index + 1}`,
  src: `/screen-${index + 1}.png`,
  alt: `Экран ${index + 1}`,
  crop: `crop-${index + 1}`,
}))

describe('OnboardingPuzzle', () => {
  it('renders one 28-piece desktop puzzle and four centered copy states', () => {
    const html = renderToStaticMarkup(
      <OnboardingPuzzle ref={createRef<OnboardingPuzzleHandle>()} steps={steps} />,
    )

    expect(html.match(/data-puzzle-fragment=/g)).toHaveLength(28)
    expect(html.match(/data-onboarding-copy=/g)).toHaveLength(4)
    expect(html).toContain('data-onboarding-puzzle="true"')
    expect(html).toContain('--puzzle-background-x:100%')
    expect(html).toContain('--puzzle-background-y:100%')
    expect(html).not.toContain('01 / 04')
    expect(html).toContain('<h3><span>01</span>Шаг 1</h3>')
  })

  it('keeps a complete semantic static sequence for mobile and reduced motion', () => {
    const html = renderToStaticMarkup(<OnboardingPuzzle steps={steps} />)

    expect(html.match(/class="onboarding-puzzle__static-step/g)).toHaveLength(4)
    expect(html).toContain('class="onboarding-puzzle__static"')
    steps.forEach((step) => {
      expect(html).toContain(step.title)
      expect(html).toContain(step.caption)
      expect(html).toContain(`alt="${step.alt}"`)
    })
  })

  it('uses one imperative render surface instead of React state per scroll frame', () => {
    const source = Object.values(
      import.meta.glob('./OnboardingPuzzle.tsx', { eager: true, query: '?raw', import: 'default' }),
    )[0] as string

    expect(source).toContain('useImperativeHandle')
    expect(source).toContain('getOnboardingPuzzlePosition')
    expect(source).toContain('getOnboardingFragmentState')
    expect(source).toContain('getOnboardingSurfaceState')
    expect(source).toContain('sampleOnboardingScrub')
    expect(source).toContain("root.style.setProperty('--puzzle-image'")
    expect(source).toContain("root.style.setProperty('--puzzle-assembled-opacity'")
    expect(source).not.toContain('onboarding-puzzle__focus-glow')
    expect(source).toContain('window.cancelAnimationFrame(frame)')
    expect(source).toContain('observer.disconnect()')
    expect(source).toContain('asset.decode()')
    expect(source).toContain("node.style.setProperty('--puzzle-rotate-x'")
    expect(source).toContain('getOnboardingFragmentState(position.local, index, position.stepIndex)')
    expect(source).not.toContain('useState(')
  })
})
