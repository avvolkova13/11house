export type HeroEntryPhase = 'preparing' | 'entering' | 'settled'

export const HERO_ENTRY_DURATION_MS = 2100

export const getInitialHeroEntryPhase = (
  reducedMotion: boolean,
  scrollY: number,
): HeroEntryPhase => reducedMotion || scrollY > 0 ? 'settled' : 'preparing'

export const getHeroEntryPhaseAfterMount = (
  reducedMotion: boolean,
  scrollY: number,
): HeroEntryPhase => (
  getInitialHeroEntryPhase(reducedMotion, scrollY) === 'preparing'
    ? 'entering'
    : 'settled'
)

export const getHeroEntryPhaseAfterPageShow = (
  phase: HeroEntryPhase,
  persisted: boolean,
): HeroEntryPhase => persisted ? 'settled' : phase

export const shouldSettleHeroEntry = (
  phase: HeroEntryPhase,
  startScrollY: number,
  currentScrollY: number,
) => phase !== 'settled' && Math.abs(currentScrollY - startScrollY) >= 1
