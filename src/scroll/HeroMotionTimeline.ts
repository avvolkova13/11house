import { HERO_LAST_VISUAL_INDEX } from '../hero/heroNarrative'

export const HERO_TEXT_HOLD_MS = 900
export const HERO_PRODUCT_HOLD_MS = 1300
export const HERO_FINALE_HOLD_MS = 1100

const FAST_SCROLL_DELTA_PX = 180
const MOTION_RESPONSE = 11
const TARGET_PULL = 5.8
const MAX_PROGRESS_SPEED = 3.15
const MAX_FRAME_SECONDS = 1 / 30
const SETTLE_EPSILON = 0.0005
const GATE_ARRIVAL_EPSILON = 0.0025
const IDLE_SNAP_DELAY_MS = 180

const clamp = (value: number, min: number, max: number) => (
  Math.min(max, Math.max(min, value))
)

const getHoldDuration = (stage: number) => {
  if (stage === 1 || stage === 2) return HERO_TEXT_HOLD_MS
  if (stage >= 3 && stage <= 5) return HERO_PRODUCT_HOLD_MS
  if (stage === 6) return HERO_FINALE_HOLD_MS
  return 0
}

export type HeroMotionSnapshot = {
  progress: number
  progressDelta: number
  targetProgress: number
  holdingStage: number | null
}

export class HeroMotionTimeline {
  private progress: number
  private targetProgress: number
  private rawTargetProgress: number
  private velocity = 0
  private lastFrameTime: number | null = null
  private holdingStage: number | null = null
  private holdUntil = 0
  private gatedDirection = 0
  private heldStages = new Set<number>()
  private lastInputTime = 0
  private pendingIdleSnap = false

  constructor(initialProgress: number) {
    const initial = clamp(initialProgress, 0, HERO_LAST_VISUAL_INDEX)
    this.progress = initial
    this.targetProgress = initial
    this.rawTargetProgress = initial
  }

  get snapshot(): HeroMotionSnapshot {
    return this.createSnapshot(0)
  }

  setTarget(targetProgress: number, inputDelta: number, now: number) {
    const isFastIntent = Math.abs(inputDelta) >= FAST_SCROLL_DELTA_PX
    const requestedTarget = clamp(targetProgress, 0, HERO_LAST_VISUAL_INDEX)
    this.rawTargetProgress = requestedTarget
    const requestedDirection = Math.sign(requestedTarget - this.progress)
    const snappedTarget = requestedDirection > 0
      ? Math.max(Math.round(requestedTarget), Math.ceil(this.progress + SETTLE_EPSILON))
      : Math.min(Math.round(requestedTarget), Math.floor(this.progress - SETTLE_EPSILON))
    let nextTarget = isFastIntent && requestedDirection !== 0
      ? clamp(snappedTarget, 0, HERO_LAST_VISUAL_INDEX)
      : requestedTarget

    if (inputDelta > 0 && nextTarget < this.progress) nextTarget = this.progress
    if (inputDelta < 0 && nextTarget > this.progress) nextTarget = this.progress
    const direction = Math.sign(nextTarget - this.progress)
    let releasedStage: number | null = null

    if (this.holdingStage !== null && direction !== 0 && direction !== this.gatedDirection) {
      releasedStage = this.holdingStage
      this.holdingStage = null
      this.holdUntil = 0
      this.velocity = 0
    }

    if (isFastIntent && direction !== 0) {
      if (direction !== this.gatedDirection) {
        this.heldStages.clear()
        if (releasedStage !== null) this.heldStages.add(releasedStage)
      }
      this.gatedDirection = direction
    } else if (direction !== this.gatedDirection && Math.abs(nextTarget - this.progress) < 0.7) {
      this.gatedDirection = 0
      this.heldStages.clear()
    }

    this.targetProgress = nextTarget

    if (inputDelta !== 0) {
      this.lastInputTime = now
      this.pendingIdleSnap = !isFastIntent
    }

    if (this.lastFrameTime !== null && now < this.lastFrameTime) {
      this.lastFrameTime = now
    }
  }

  advance(now: number): HeroMotionSnapshot {
    if (this.lastFrameTime === null) {
      this.lastFrameTime = now
      return this.createSnapshot(0)
    }

    const previousProgress = this.progress
    const elapsed = Math.max(0, (now - this.lastFrameTime) / 1000)
    this.lastFrameTime = now

    if (
      this.pendingIdleSnap
      && this.holdingStage === null
      && now - this.lastInputTime >= IDLE_SNAP_DELAY_MS
    ) {
      this.targetProgress = clamp(
        Math.round(this.rawTargetProgress),
        0,
        HERO_LAST_VISUAL_INDEX,
      )
      this.pendingIdleSnap = false
    }

    if (this.holdingStage !== null) {
      if (now < this.holdUntil) return this.createSnapshot(0)
      this.holdingStage = null
    }

    const gateStage = this.getNextGateStage()
    const motionTarget = gateStage ?? this.targetProgress
    const difference = motionTarget - this.progress
    if (Math.abs(difference) <= SETTLE_EPSILON) {
      this.progress = motionTarget
      this.velocity = 0
      if (gateStage !== null) {
        this.beginHold(gateStage, now)
      } else {
        this.gatedDirection = 0
        this.heldStages.clear()
      }
      return this.createSnapshot(this.progress - previousProgress)
    }

    const dt = Math.min(elapsed, MAX_FRAME_SECONDS)
    const desiredVelocity = clamp(
      difference * TARGET_PULL,
      -MAX_PROGRESS_SPEED,
      MAX_PROGRESS_SPEED,
    )
    const response = 1 - Math.exp(-MOTION_RESPONSE * dt)
    this.velocity += (desiredVelocity - this.velocity) * response

    let nextProgress = this.progress + this.velocity * dt
    if (
      (difference > 0 && nextProgress > motionTarget)
      || (difference < 0 && nextProgress < motionTarget)
    ) {
      nextProgress = motionTarget
      this.velocity = 0
    }

    this.progress = nextProgress
    if (gateStage !== null && Math.abs(this.progress - gateStage) <= GATE_ARRIVAL_EPSILON) {
      this.progress = gateStage
      this.velocity = 0
      this.beginHold(gateStage, now)
      return this.createSnapshot(this.progress - previousProgress)
    }

    return this.createSnapshot(this.progress - previousProgress)
  }

  private getNextGateStage() {
    if (this.gatedDirection > 0) {
      for (let stage = 1; stage <= 6; stage += 1) {
        if (
          stage > this.progress - GATE_ARRIVAL_EPSILON
          && stage <= this.targetProgress + GATE_ARRIVAL_EPSILON
          && !this.heldStages.has(stage)
        ) return stage
      }
    }

    if (this.gatedDirection < 0) {
      for (let stage = 6; stage >= 1; stage -= 1) {
        if (
          stage < this.progress + GATE_ARRIVAL_EPSILON
          && stage >= this.targetProgress - GATE_ARRIVAL_EPSILON
          && !this.heldStages.has(stage)
        ) return stage
      }
    }

    return null
  }

  private beginHold(stage: number, now: number) {
    const holdDuration = getHoldDuration(stage)
    if (holdDuration === 0) return
    this.holdingStage = stage
    this.holdUntil = now + holdDuration
    this.heldStages.add(stage)
  }

  private createSnapshot(progressDelta: number): HeroMotionSnapshot {
    return {
      progress: this.progress,
      progressDelta,
      targetProgress: this.targetProgress,
      holdingStage: this.holdingStage,
    }
  }
}
