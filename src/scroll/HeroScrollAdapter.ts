import {
  PageScrollCoordinator,
  type HeroCorridorMetrics,
  type HeroScrollSnapshot,
} from './PageScrollCoordinator'
import { HERO_LAST_VISUAL_INDEX, HERO_STAGE_DISTANCE } from '../hero/heroNarrative'
import { HeroMotionTimeline, type HeroMotionSnapshot } from './HeroMotionTimeline'

export type HeroAdapterSnapshot = HeroScrollSnapshot & {
  heroDelta: number
  targetProgress: number
  holdingStage: number | null
}

type HeroScrollListener = (snapshot: HeroAdapterSnapshot) => void

export class HeroScrollAdapter {
  private readonly coordinator: PageScrollCoordinator
  private readonly timeline: HeroMotionTimeline
  private readonly listeners = new Set<HeroScrollListener>()
  private rawSnapshot: HeroScrollSnapshot
  private current: HeroAdapterSnapshot

  constructor(metrics: HeroCorridorMetrics, initialScrollPosition: number) {
    this.coordinator = new PageScrollCoordinator(metrics, initialScrollPosition)
    this.rawSnapshot = this.coordinator.snapshot
    const initialProgress = this.getTargetProgress(this.rawSnapshot)
    this.timeline = new HeroMotionTimeline(initialProgress)
    this.current = this.compose(this.rawSnapshot, this.timeline.snapshot, 0)
  }

  get snapshot() {
    return this.current
  }

  setMetrics(metrics: HeroCorridorMetrics) {
    this.coordinator.setMetrics(metrics)
    this.rawSnapshot = this.coordinator.snapshot
    this.timeline.setTarget(
      this.getTargetProgress(this.rawSnapshot),
      0,
      this.now(),
    )
    this.current = this.compose(this.rawSnapshot, this.timeline.snapshot, 0)
  }

  ingest(scrollPosition: number, now = this.now()) {
    this.rawSnapshot = this.coordinator.update(scrollPosition)
    this.timeline.setTarget(
      this.getTargetProgress(this.rawSnapshot),
      this.rawSnapshot.delta,
      now,
    )
    this.current = this.compose(this.rawSnapshot, this.timeline.snapshot, 0)
    this.publish()
    return this.current
  }

  advance(now = this.now()) {
    const previousHoldingStage = this.current.holdingStage
    const motion = this.timeline.advance(now)
    this.current = this.compose(
      { ...this.rawSnapshot, delta: 0 },
      motion,
      motion.progressDelta * HERO_STAGE_DISTANCE,
    )

    if (motion.progressDelta !== 0 || motion.holdingStage !== previousHoldingStage) {
      this.publish()
    }

    return this.current
  }

  subscribe(listener: HeroScrollListener) {
    this.listeners.add(listener)
    listener(this.current)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private getTargetProgress(snapshot: HeroScrollSnapshot) {
    if (snapshot.state === 'PRE_HERO') return 0
    if (snapshot.state === 'TRAVEL') return snapshot.travelProgress
    return HERO_LAST_VISUAL_INDEX
  }

  private compose(
    snapshot: HeroScrollSnapshot,
    motion: HeroMotionSnapshot,
    heroDelta: number,
  ): HeroAdapterSnapshot {
    return {
      ...snapshot,
      heroDelta,
      travelProgress: motion.progress,
      targetProgress: motion.targetProgress,
      holdingStage: motion.holdingStage,
    }
  }

  private publish() {
    this.listeners.forEach((listener) => listener(this.current))
  }

  private now() {
    return typeof performance === 'undefined' ? Date.now() : performance.now()
  }
}
