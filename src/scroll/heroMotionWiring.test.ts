import { describe, expect, it } from 'vitest'

import appSource from '../App.tsx?raw'
import journeySource from '../journey/JourneyLanding.tsx?raw'
import heroSource from '../components/CosmicHero.tsx?raw'
import sceneSource from '../cosmic/CosmicScene.ts?raw'

describe('Hero motion wiring', () => {
  it('advances the scene adapter independently of interface steps', () => {
    expect(appSource).toContain('<JourneyLanding />')
    expect(journeySource).toContain('scrollAdapter.advance(frameTime)')
    expect(heroSource).toContain('snapshot.travelProgress')
    expect(sceneSource).toContain('snapshot.travelProgress')
  })

  it('uses one coherent masked-letter reveal instead of random fragments', () => {
    expect(heroSource).not.toContain('getFragmentStyle')
    expect(heroSource).toContain('hero-title-letter__inner')
    expect(heroSource).toContain('getHeroTitleLetterDelay')
    expect(heroSource).toContain('shouldRevealHeroTitle')
    expect(heroSource).toContain('--hero-letter-delay')
  })

  it('lets the product imagery show through the titles', () => {
    expect(heroSource).toContain("mixBlendMode: 'difference'")
  })

  it('places the registration action inside the finale focal point', () => {
    expect(heroSource).toContain('className="hero-finale__action"')
    expect(heroSource).toContain('href="https://app.elevenhouse.ai"')
    expect(heroSource).toContain('Бесплатно без банковской карты')
  })
})
