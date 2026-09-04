import { describe, expect, it } from 'vitest'
import {
  HERO_ENTRY_DURATION_MS,
  getHeroEntryPhaseAfterMount,
  getHeroEntryPhaseAfterPageShow,
  getInitialHeroEntryPhase,
  shouldSettleHeroEntry,
} from './heroEntryMotion'

describe('hero entry motion', () => {
  it('starts preparing only at the top with full motion', () => {
    expect(getInitialHeroEntryPhase(false, 0)).toBe('preparing')
    expect(getInitialHeroEntryPhase(false, 1)).toBe('settled')
    expect(getInitialHeroEntryPhase(true, 0)).toBe('settled')
  })

  it('settles on the first real scroll delta', () => {
    expect(shouldSettleHeroEntry('entering', 0, 0)).toBe(false)
    expect(shouldSettleHeroEntry('entering', 0, 1)).toBe(true)
    expect(shouldSettleHeroEntry('settled', 0, 20)).toBe(false)
  })

  it('uses the approved total duration', () => {
    expect(HERO_ENTRY_DURATION_MS).toBe(2100)
  })

  it('enters only when the restored scroll position is still at the top', () => {
    expect(getHeroEntryPhaseAfterMount(false, 0)).toBe('entering')
    expect(getHeroEntryPhaseAfterMount(false, 120)).toBe('settled')
    expect(getHeroEntryPhaseAfterMount(true, 0)).toBe('settled')
  })

  it('settles an unfinished intro restored from the back-forward cache', () => {
    expect(getHeroEntryPhaseAfterPageShow('preparing', true)).toBe('settled')
    expect(getHeroEntryPhaseAfterPageShow('entering', true)).toBe('settled')
    expect(getHeroEntryPhaseAfterPageShow('entering', false)).toBe('entering')
    expect(getHeroEntryPhaseAfterPageShow('settled', true)).toBe('settled')
  })
})
