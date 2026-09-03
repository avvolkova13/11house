import type { HeroCorridorMetrics } from './PageScrollCoordinator'

export type HeroHandoffPhase = 'tunnel' | 'covering' | 'story'

export const beginHeroHandoff = (phase: HeroHandoffPhase): HeroHandoffPhase => (
  phase === 'tunnel' ? 'covering' : phase
)

export const completeHeroHandoff = (phase: HeroHandoffPhase): HeroHandoffPhase => (
  phase === 'covering' ? 'story' : phase
)

export const getHeroRunwayEnd = (
  metrics: HeroCorridorMetrics,
  phase: HeroHandoffPhase,
) => phase === 'tunnel' ? metrics.travelEnd : metrics.corridorEnd
