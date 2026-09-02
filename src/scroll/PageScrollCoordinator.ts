export type HeroScrollState =
  | 'PRE_HERO'
  | 'TRAVEL'
  | 'EXIT_ARMED'
  | 'EXITING'
  | 'BELOW_HERO'
  | 'REENTERING'

export type HeroCorridorMetrics = {
  travelEnd: number
  settleEnd: number
  corridorEnd: number
}

export type HeroScrollSnapshot = {
  state: HeroScrollState
  delta: number
  scrollPosition: number
  travelProgress: number
}

const MEANINGFUL_SCROLL_DELTA = 1

export const getHeroCorridorMetrics = (
  viewportWidth: number,
  viewportHeight: number,
  reducedMotion: boolean,
): HeroCorridorMetrics => {
  if (reducedMotion) {
    return {
      travelEnd: 1,
      settleEnd: 1,
      corridorEnd: 1 + Math.round(viewportHeight * 0.5),
    }
  }

  const travelEnd = HERO_STAGE_DISTANCE * HERO_LAST_STAGE_INDEX
  const settleEnd = travelEnd + Math.round(viewportHeight * 0.35)
  const handoffDistance = Math.round(viewportHeight * (viewportWidth <= 700 ? 0.5 : 0.7))

  return {
    travelEnd,
    settleEnd,
    corridorEnd: settleEnd + handoffDistance,
  }
}

const getInitialState = (
  scrollPosition: number,
  metrics: HeroCorridorMetrics,
): HeroScrollState => {
  if (scrollPosition <= 0) return 'PRE_HERO'
  if (scrollPosition >= metrics.corridorEnd) return 'BELOW_HERO'
  if (scrollPosition >= metrics.travelEnd) return 'EXIT_ARMED'
  return 'TRAVEL'
}

export class PageScrollCoordinator {
  private state: HeroScrollState
  private scrollPosition: number

  constructor(
    private metrics: HeroCorridorMetrics,
    initialScrollPosition: number,
  ) {
    this.scrollPosition = initialScrollPosition
    this.state = getInitialState(initialScrollPosition, metrics)
  }

  get snapshot(): HeroScrollSnapshot {
    return this.createSnapshot(0)
  }

  setMetrics(metrics: HeroCorridorMetrics) {
    this.metrics = metrics
    this.state = getInitialState(this.scrollPosition, metrics)
  }

  update(nextScrollPosition: number): HeroScrollSnapshot {
    const delta = nextScrollPosition - this.scrollPosition
    this.scrollPosition = nextScrollPosition

    if (nextScrollPosition <= 0) {
      this.state = 'PRE_HERO'
      return this.createSnapshot(delta)
    }

    if (nextScrollPosition >= this.metrics.corridorEnd) {
      this.state = 'BELOW_HERO'
      return this.createSnapshot(delta)
    }

    switch (this.state) {
      case 'PRE_HERO':
        this.state = nextScrollPosition >= this.metrics.travelEnd ? 'EXIT_ARMED' : 'TRAVEL'
        break
      case 'TRAVEL':
        if (nextScrollPosition >= this.metrics.travelEnd) this.state = 'EXIT_ARMED'
        break
      case 'EXIT_ARMED':
        if (nextScrollPosition < this.metrics.travelEnd && delta < 0) {
          this.state = 'TRAVEL'
        } else if (delta >= MEANINGFUL_SCROLL_DELTA) {
          this.state = 'EXITING'
        }
        break
      case 'EXITING':
        if (delta < 0) this.state = 'REENTERING'
        break
      case 'BELOW_HERO':
        if (delta < 0) this.state = 'REENTERING'
        break
      case 'REENTERING':
        if (nextScrollPosition < this.metrics.travelEnd) this.state = 'TRAVEL'
        break
    }

    return this.createSnapshot(delta)
  }

  private createSnapshot(delta: number): HeroScrollSnapshot {
    return {
      state: this.state,
      delta,
      scrollPosition: this.scrollPosition,
      travelProgress: Math.min(
        HERO_LAST_STAGE_INDEX,
        Math.max(0, this.scrollPosition / HERO_STAGE_DISTANCE),
      ),
    }
  }
}
import { HERO_LAST_STAGE_INDEX, HERO_STAGE_DISTANCE } from '../hero/heroNarrative'
