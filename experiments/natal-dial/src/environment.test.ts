import { describe, expect, it } from 'vitest'
import { getPreviewPhase, getReducedMotionPreference } from './environment'

describe('environment preferences', () => {
  it('honors the operating-system preference', () => {
    expect(getReducedMotionPreference(true, '', false)).toBe(true)
  })

  it('allows a development query override without leaking it to production', () => {
    expect(getReducedMotionPreference(false, '?reduced-motion', true)).toBe(true)
    expect(getReducedMotionPreference(false, '?reduced-motion', false)).toBe(false)
  })

  it('accepts deterministic development phases and rejects invalid values', () => {
    expect(getPreviewPhase('', true)).toBeNull()
    expect(getPreviewPhase('?foo=bar', true)).toBeNull()
    expect(getPreviewPhase('?phase=0.25', true)).toBe(0.25)
    expect(getPreviewPhase('?phase=1', true)).toBe(1)
    expect(getPreviewPhase('?phase=-0.1', true)).toBeNull()
    expect(getPreviewPhase('?phase=nope', true)).toBeNull()
    expect(getPreviewPhase('?phase=0.25', false)).toBeNull()
  })
})
