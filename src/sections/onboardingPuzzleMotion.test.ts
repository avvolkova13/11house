import { describe, expect, it } from 'vitest'

import {
  PUZZLE_FRAGMENT_COUNT,
  getOnboardingCopyState,
  getOnboardingFragmentState,
  getOnboardingHandoffState,
  getOnboardingPuzzlePosition,
  getPuzzleBackgroundPosition,
} from './onboardingPuzzleMotion'

describe('onboardingPuzzleMotion', () => {
  it('maps progress into four reversible step intervals', () => {
    expect(getOnboardingPuzzlePosition(0, 4)).toEqual({ stepIndex: 0, local: 0 })
    expect(getOnboardingPuzzlePosition(0.375, 4)).toEqual({ stepIndex: 1, local: 0.5 })
    expect(getOnboardingPuzzlePosition(1, 4)).toEqual({ stepIndex: 3, local: 1 })
    expect(getOnboardingPuzzlePosition(-1, 4)).toEqual({ stepIndex: 0, local: 0 })
  })

  it('builds a complete seven-by-four image atlas', () => {
    expect(PUZZLE_FRAGMENT_COUNT).toBe(28)
    expect(getPuzzleBackgroundPosition(0)).toEqual({ x: 0, y: 0 })
    expect(getPuzzleBackgroundPosition(6)).toEqual({ x: 100, y: 0 })
    expect(getPuzzleBackgroundPosition(27)).toEqual({ x: 100, y: 100 })
  })

  it('starts dispersed, assembles crisply, then resolves into a central focus', () => {
    const start = getOnboardingFragmentState(0, 0)
    const hold = getOnboardingFragmentState(0.72, 0)
    const exit = getOnboardingFragmentState(1, 0)

    expect(start.opacity).toBe(0)
    expect(start.blur).toBe(40)
    expect(hold).toMatchObject({ x: 0, y: 0, z: 0, scale: 1, opacity: 1, blur: 0 })
    expect(exit).toMatchObject({ x: 300, y: 150, z: -520, scale: 0.52, opacity: 0.28, blur: 22 })
  })

  it('hands consecutive screens through identical blurred geometry', () => {
    const outgoing = getOnboardingFragmentState(1, 27, 0)
    const incoming = getOnboardingFragmentState(0, 27, 1)

    expect(outgoing).toEqual(incoming)
    expect(incoming).toMatchObject({ x: -300, y: -150, z: -520, opacity: 0.28, blur: 22 })
  })

  it('creates a brief depth lift before the screen contracts', () => {
    const hold = getOnboardingFragmentState(0.72, 10, 1)
    const lift = getOnboardingFragmentState(0.855, 10, 1)
    const focus = getOnboardingFragmentState(1, 10, 1)

    expect(lift.z).toBeGreaterThan(hold.z)
    expect(lift.scale).toBeGreaterThan(1)
    expect(focus.z).toBeLessThan(hold.z)
    expect(focus.blur).toBeGreaterThan(20)
  })

  it('fires a restrained lens pulse only around the handoff', () => {
    expect(getOnboardingHandoffState(0.55)).toEqual({ opacity: 0, scale: 0.82, blur: 18 })
    expect(getOnboardingHandoffState(0.9).opacity).toBeGreaterThan(0.5)
    expect(getOnboardingHandoffState(1)).toEqual({ opacity: 0.34, scale: 0.58, blur: 28 })
    expect(getOnboardingHandoffState(0, 1)).toEqual(getOnboardingHandoffState(1, 0))
  })

  it('stagger-resolves fragments and copy around the readable hold', () => {
    expect(getOnboardingFragmentState(0.2, 2).opacity)
      .toBeGreaterThan(getOnboardingFragmentState(0.2, 27).opacity)
    expect(getOnboardingCopyState(0).opacity).toBe(0)
    expect(getOnboardingCopyState(0.72)).toMatchObject({ opacity: 1, blur: 0, y: 0 })
    expect(getOnboardingCopyState(1).opacity).toBe(0)
  })

  it('clamps invalid fragment indices to the atlas bounds', () => {
    expect(getPuzzleBackgroundPosition(-3)).toEqual(getPuzzleBackgroundPosition(0))
    expect(getPuzzleBackgroundPosition(99)).toEqual(getPuzzleBackgroundPosition(27))
    expect(getOnboardingFragmentState(0.5, 99)).toEqual(getOnboardingFragmentState(0.5, 27))
  })
})
