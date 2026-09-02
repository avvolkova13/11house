import { describe, expect, it } from 'vitest'
import { getFragmentPosition, getSectionProgress, getStoryPosition } from './sectionMotion'

describe('getSectionProgress', () => {
  it('starts at zero when the sticky story enters the viewport', () => {
    expect(getSectionProgress(0, 3200, 800)).toBe(0)
  })

  it('maps the available sticky travel to a normalized progress value', () => {
    expect(getSectionProgress(-1200, 3200, 800)).toBe(0.5)
  })

  it('clamps before entry and after the section has completed', () => {
    expect(getSectionProgress(400, 3200, 800)).toBe(0)
    expect(getSectionProgress(-3000, 3200, 800)).toBe(1)
  })

  it('avoids division by zero for short static sections', () => {
    expect(getSectionProgress(-100, 800, 800)).toBe(1)
  })
})

describe('getFragmentPosition', () => {
  it('preserves the wide-screen composition', () => {
    expect(getFragmentPosition(470, -260, false)).toEqual({ x: 470, y: -260 })
  })

  it('compresses the scatter into the mobile viewport', () => {
    expect(getFragmentPosition(470, -260, true)).toEqual({ x: 150.4, y: -130 })
  })
})

describe('getStoryPosition', () => {
  it('maps normalized progress across six scenes', () => {
    expect(getStoryPosition(0, 6)).toEqual({ index: 0, local: 0 })
    expect(getStoryPosition(0.25, 6)).toEqual({ index: 1, local: 0.5 })
    expect(getStoryPosition(0.75, 6)).toEqual({ index: 4, local: 0.5 })
  })

  it('keeps the final scene selected at progress one', () => {
    expect(getStoryPosition(1, 6)).toEqual({ index: 5, local: 1 })
  })

  it('clamps overscroll in both directions', () => {
    expect(getStoryPosition(-0.2, 6)).toEqual({ index: 0, local: 0 })
    expect(getStoryPosition(1.3, 6)).toEqual({ index: 5, local: 1 })
  })
})
