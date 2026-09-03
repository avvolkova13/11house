import {
  PageScrollCoordinator,
  type HeroCorridorMetrics,
  type HeroScrollSnapshot,
} from './PageScrollCoordinator'
import { HERO_LAST_VISUAL_INDEX } from '../hero/heroNarrative'

export type HeroAdapterSnapshot = HeroScrollSnapshot & {
  heroDelta: number
}

type HeroScrollListener = (snapshot: HeroAdapterSnapshot) => void

export class HeroScrollAdapter {
  private readonly coordinator: PageScrollCoordinator
  private readonly listeners = new Set<HeroScrollListener>()
  private current: HeroAdapterSnapshot

  constructor(metrics: HeroCorridorMetrics, initialScrollPosition: number) {
    this.coordinator = new PageScrollCoordinator(metrics, initialScrollPosition)
    this.current = this.adapt(this.coordinator.snapshot)
  }

  get snapshot() {
    return this.current
  }

  setMetrics(metrics: HeroCorridorMetrics) {
    this.coordinator.setMetrics(metrics)
    this.current = this.adapt(this.coordinator.snapshot)
  }

  ingest(scrollPosition: number) {
    this.current = this.adapt(this.coordinator.update(scrollPosition))
    this.listeners.forEach((listener) => listener(this.current))
    return this.current
  }

  subscribe(listener: HeroScrollListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private adapt(snapshot: HeroScrollSnapshot): HeroAdapterSnapshot {
    const ownsTravel = snapshot.state === 'TRAVEL'
    const travelProgress = snapshot.state === 'PRE_HERO'
      ? 0
      : ownsTravel
        ? snapshot.travelProgress
        : HERO_LAST_VISUAL_INDEX
    return {
      ...snapshot,
      heroDelta: ownsTravel ? snapshot.delta : 0,
      travelProgress,
    }
  }
}
