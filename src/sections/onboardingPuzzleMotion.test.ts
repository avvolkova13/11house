import { describe, expect, it } from 'vitest'
import {
  PUZZLE_FRAGMENT_COUNT, getOnboardingPuzzlePosition, getPuzzleBackgroundPosition,
  getOnboardingFragmentState, getOnboardingCopyState, getOnboardingSurfaceState, sampleOnboardingScrub,
} from './onboardingPuzzleMotion'

describe('PRODUX-derived onboarding assembly', () => {
  it('keeps four forward and reversible step intervals', () => {
    expect(getOnboardingPuzzlePosition(0.375, 4)).toEqual({ stepIndex: 1, local: 0.5 })
    expect(getOnboardingPuzzlePosition(1, 4)).toEqual({ stepIndex: 3, local: 1 })
    expect(getOnboardingPuzzlePosition(-1, 4)).toEqual({ stepIndex: 0, local: 0 })
  })
  it('covers the complete seven-by-four image without a missing edge', () => {
    expect(PUZZLE_FRAGMENT_COUNT).toBe(28)
    expect(getPuzzleBackgroundPosition(0)).toEqual({ x: 0, y: 0 })
    expect(getPuzzleBackgroundPosition(27)).toEqual({ x: 100, y: 100 })
  })
  it('establishes six leading pieces before the remaining image assembles', () => {
    const states = Array.from({length:28}, (_,i)=>getOnboardingFragmentState(.12,i))
    expect(states.filter(s=>s.opacity > 0).length).toBe(6)
    expect(states.some(s=>s.z > 0)).toBe(true)
    expect(states.some(s=>s.z < -500 && s.opacity > 0)).toBe(true)
  })
  it('holds all four screens sharp, assembled and motionless', () => {
    for (let step=0;step<4;step++) for (const progress of [.52,.64,.78]) {
      for (let index=0;index<28;index++) expect(getOnboardingFragmentState(progress,index,step))
        .toEqual({x:0,y:0,z:0,scale:1,opacity:1,blur:0,rotateX:0,rotateY:0})
      expect(getOnboardingCopyState(progress)).toEqual({opacity:1,blur:0,y:0})
      expect(getOnboardingSurfaceState(progress)).toMatchObject({opacity:1,scale:1,assembled:1})
    }
  })
  it('changes images only across an invisible boundary, without central collapse', () => {
    expect(getOnboardingSurfaceState(1).opacity).toBe(0)
    expect(getOnboardingSurfaceState(0).opacity).toBe(0)
    expect(getOnboardingFragmentState(1,0)).toMatchObject({x:0,y:0,z:0,blur:0})
    expect(getOnboardingCopyState(1).opacity).toBe(0)
  })
  it('smooths wheel jumps in finite time and allows clean direction changes', () => {
    expect(sampleOnboardingScrub(.1,.8,0)).toBe(.1)
    expect(sampleOnboardingScrub(.1,.8,1500)).toBe(.8)
    const middle=sampleOnboardingScrub(.1,.8,300)
    expect(middle).toBeGreaterThan(.1)
    expect(middle).toBeLessThan(.8)
    expect(sampleOnboardingScrub(middle,.05,300)).toBeLessThan(middle)
    expect(sampleOnboardingScrub(middle,.05,1500)).toBe(.05)
  })
})
