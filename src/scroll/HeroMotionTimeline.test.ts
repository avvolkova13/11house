import { describe, expect, it } from 'vitest'
import {
  HERO_FINALE_HOLD_MS,
  HERO_PRODUCT_HOLD_MS,
  HERO_TEXT_HOLD_MS,
  HeroMotionTimeline,
} from './HeroMotionTimeline'

const advanceUntilHold = (
  timeline: HeroMotionTimeline,
  expectedStage: number,
  startTime = 0,
) => {
  let time = startTime
  let snapshot = timeline.advance(time)

  for (let frame = 0; frame < 360 && snapshot.holdingStage !== expectedStage; frame += 1) {
    time += 16
    snapshot = timeline.advance(time)
  }

  return { snapshot, time }
}

describe('HeroMotionTimeline', () => {
  it('smooths a large scroll target instead of teleporting to raw progress', () => {
    const timeline = new HeroMotionTimeline(0)
    timeline.setTarget(3.4, 1200, 0)

    timeline.advance(0)
    const firstFrame = timeline.advance(16)

    expect(firstFrame.progress).toBeGreaterThan(0)
    expect(firstFrame.progress).toBeLessThan(0.2)
    expect(firstFrame.progress).toBeLessThan(firstFrame.targetProgress)
  })

  it('holds a text scene for 900ms during fast scrolling', () => {
    const timeline = new HeroMotionTimeline(0)
    timeline.setTarget(2.6, 1200, 0)

    const { snapshot, time } = advanceUntilHold(timeline, 1)

    expect(snapshot.progress).toBe(1)
    expect(snapshot.holdingStage).toBe(1)
    expect(timeline.advance(time + HERO_TEXT_HOLD_MS - 1).progress).toBe(1)
    expect(timeline.advance(time + HERO_TEXT_HOLD_MS + 17).progress).toBeGreaterThan(1)
  })

  it('decelerates into a held scene instead of hard-clamping at speed', () => {
    const timeline = new HeroMotionTimeline(0)
    timeline.setTarget(2.6, 1200, 0)
    timeline.advance(0)

    const movingDeltas: number[] = []
    for (let time = 16; time <= 4000; time += 16) {
      const snapshot = timeline.advance(time)
      if (snapshot.holdingStage === 1) break
      if (snapshot.progressDelta > 0) movingDeltas.push(snapshot.progressDelta)
    }

    const peakDelta = Math.max(...movingDeltas)
    const arrivalDelta = movingDeltas.at(-1) ?? peakDelta
    expect(arrivalDelta).toBeLessThan(peakDelta * 0.6)
  })

  it('holds assembled product scenes longer than text scenes', () => {
    const timeline = new HeroMotionTimeline(2.35)
    timeline.setTarget(4.2, 1100, 0)

    const { snapshot, time } = advanceUntilHold(timeline, 3)

    expect(snapshot.progress).toBe(3)
    expect(timeline.advance(time + HERO_PRODUCT_HOLD_MS - 1).progress).toBe(3)
    expect(timeline.advance(time + HERO_PRODUCT_HOLD_MS + 17).progress).toBeGreaterThan(3)
  })

  it('holds the finale before releasing the tunnel flight', () => {
    const timeline = new HeroMotionTimeline(5.3)
    timeline.setTarget(7.4, 1200, 0)

    const { snapshot, time } = advanceUntilHold(timeline, 6)

    expect(snapshot.progress).toBe(6)
    expect(timeline.advance(time + HERO_FINALE_HOLD_MS - 1).progress).toBe(6)
    expect(timeline.advance(time + HERO_FINALE_HOLD_MS + 17).progress).toBeGreaterThan(6)
  })

  it('does not force a pause during deliberate slow scrolling', () => {
    const timeline = new HeroMotionTimeline(0.8)
    timeline.setTarget(1.25, 72, 0)

    let time = 0
    let crossedStage = false
    let held = false
    for (let frame = 0; frame < 240; frame += 1) {
      time += 16
      const snapshot = timeline.advance(time)
      crossedStage ||= snapshot.progress > 1
      held ||= snapshot.holdingStage !== null
    }

    expect(crossedStage).toBe(true)
    expect(held).toBe(false)
  })

  it('softly settles slow scroll on the nearest scene after input becomes idle', () => {
    const timeline = new HeroMotionTimeline(1)
    timeline.setTarget(1.42, 80, 0)

    timeline.advance(0)
    const activeScroll = timeline.advance(96)
    expect(activeScroll.targetProgress).toBe(1.42)

    let settled = timeline.advance(240)
    for (let time = 256; time <= 2200; time += 16) settled = timeline.advance(time)

    expect(settled.targetProgress).toBe(1)
    expect(settled.progress).toBe(1)
    expect(settled.holdingStage).toBeNull()
  })

  it('lands a fast fling on a complete scene instead of between scenes', () => {
    const timeline = new HeroMotionTimeline(0)
    timeline.setTarget(4.736, 3600, 0)

    let snapshot = timeline.advance(0)
    for (let time = 16; time <= 14000; time += 16) {
      snapshot = timeline.advance(time)
    }

    expect(snapshot.targetProgress).toBe(5)
    expect(snapshot.progress).toBe(5)
    expect(snapshot.holdingStage).toBeNull()
  })

  it('does not move backward when forward native scroll catches up with a snapped scene', () => {
    const timeline = new HeroMotionTimeline(0)
    timeline.setTarget(1.58, 1200, 0)

    let snapshot = timeline.advance(0)
    for (let time = 16; time <= 6000; time += 16) snapshot = timeline.advance(time)
    expect(snapshot.progress).toBe(2)

    timeline.setTarget(1.65, 54, 6016)
    snapshot = timeline.advance(6032)

    expect(snapshot.targetProgress).toBe(2)
    expect(snapshot.progress).toBe(2)
  })

  it('releases a hold immediately when the user reverses direction', () => {
    const timeline = new HeroMotionTimeline(2.4)
    timeline.setTarget(4.2, 1200, 0)
    const { time } = advanceUntilHold(timeline, 3)

    timeline.setTarget(1.5, -1200, time + 100)
    const reversed = timeline.advance(time + 116)

    expect(reversed.holdingStage).toBeNull()
    expect(reversed.progress).toBeLessThan(3)
  })
})
