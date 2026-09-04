import type { HeroCorridorMetrics, HeroScrollSnapshot } from './PageScrollCoordinator'
import { HERO_LAST_VISUAL_INDEX } from '../hero/heroNarrative'

export type HeroHandoffPhase = 'tunnel' | 'covering' | 'story'

export const beginHeroHandoff = (phase: HeroHandoffPhase): HeroHandoffPhase => (
  phase === 'tunnel' ? 'covering' : phase
)

export const completeHeroHandoff = (phase: HeroHandoffPhase): HeroHandoffPhase => (
  phase === 'covering' ? 'story' : phase
)

export const shouldBeginHeroHandoff = (
  snapshot: Pick<HeroScrollSnapshot, 'state' | 'scrollPosition' | 'travelProgress'>,
  metrics: HeroCorridorMetrics,
) => (metrics.travelEnd <= 1 || snapshot.travelProgress >= HERO_LAST_VISUAL_INDEX - 0.001)
  && (
    snapshot.state === 'EXITING'
    || (snapshot.state === 'EXIT_ARMED' && snapshot.scrollPosition >= metrics.settleEnd)
  )

export const getHeroRunwayEnd = (
  metrics: HeroCorridorMetrics,
  phase: HeroHandoffPhase,
) => phase === 'tunnel' ? metrics.settleEnd : metrics.corridorEnd
