import type { HeroAdapterSnapshot } from '../scroll/HeroScrollAdapter'

type SceneTarget = { sceneProgress: number; flightPosition: number }
type Listener = (snapshot: HeroAdapterSnapshot) => void

/** Keeps scene inertia independent of the document's readable interface states. */
export class JourneySceneAdapter {
  private listeners = new Set<Listener>()
  private current: SceneTarget = { sceneProgress: 0, flightPosition: 0 }
  private target: SceneTarget = { sceneProgress: 0, flightPosition: 0 }
  private lastTime: number | null = null
  private delta = 0

  get snapshot(): HeroAdapterSnapshot {
    return {
      state: this.current.sceneProgress === 0 ? 'PRE_HERO' : 'TRAVEL',
      delta: this.delta,
      scrollPosition: this.current.flightPosition,
      travelProgress: this.current.sceneProgress,
      heroDelta: this.delta,
      targetProgress: this.target.sceneProgress,
      holdingStage: null,
    }
  }

  restore(target: SceneTarget) {
    this.current = { ...target }
    this.target = { ...target }
    this.delta = 0
    this.lastTime = null
    this.publish()
  }

  setTarget(target: SceneTarget) { this.target = { ...target } }

  advance(now: number) {
    const dt = this.lastTime === null ? 0 : Math.max(0, Math.min((now - this.lastTime) / 1000, 1 / 30))
    this.lastTime = now
    const alpha = 1 - Math.exp(-11 * dt)
    const previous = this.current.flightPosition
    const previousProgress = this.current.sceneProgress
    this.current.flightPosition += (this.target.flightPosition - this.current.flightPosition) * alpha
    this.current.sceneProgress += (this.target.sceneProgress - this.current.sceneProgress) * alpha
    if (Math.abs(this.target.flightPosition - this.current.flightPosition) < 0.01) this.current.flightPosition = this.target.flightPosition
    if (Math.abs(this.target.sceneProgress - this.current.sceneProgress) < 0.00001) this.current.sceneProgress = this.target.sceneProgress
    this.delta = this.current.flightPosition - previous
    if (this.delta !== 0 || previousProgress !== this.current.sceneProgress) this.publish()
    return this.snapshot
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => { this.listeners.delete(listener) }
  }

  private publish() {
    const snapshot = this.snapshot
    this.listeners.forEach((listener) => listener(snapshot))
  }
}
