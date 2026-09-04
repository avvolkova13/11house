// @ts-expect-error Vitest runs in Node, while the app tsconfig intentionally omits Node types.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import heroSource from '../components/CosmicHero.tsx?raw'

const stylesSource = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')

describe('hero entry integration', () => {
  it('exposes the entry lifecycle to the scoped Hero boundary', () => {
    expect(heroSource).toContain("from '../cosmic/heroEntryMotion'")
    expect(heroSource).toContain('data-intro={entryPhase}')
    expect(heroSource).toContain('firstFrame = window.requestAnimationFrame')
    expect(heroSource).toContain('secondFrame = window.requestAnimationFrame')
    expect(heroSource).toContain('getHeroEntryPhaseAfterMount(reducedMotion, window.scrollY)')
    expect(heroSource).toContain("window.addEventListener('pageshow', onPageShow)")
    expect(heroSource).toContain("window.removeEventListener('pageshow', onPageShow)")
  })

  it('keeps the choreography scoped to the Hero entry state', () => {
    expect(stylesSource).toContain('.cosmic-runway[data-intro="preparing"]')
    expect(stylesSource).toContain('.cosmic-runway[data-intro="entering"]')
    expect(stylesSource).toContain('@keyframes hero-entry-field')
    expect(stylesSource).toContain('1180ms 120ms')
    expect(stylesSource).toContain('1080ms 480ms')
    expect(stylesSource).not.toContain('body[data-intro')
  })

  it('does not render a page counter in the Hero', () => {
    expect(heroSource).not.toContain('hero-copy__progress')
    expect(stylesSource).not.toContain('.hero-copy__progress')
  })
})
