import type {
  PricingMotionDirection,
  PricingMotionPhase,
} from './pricingMotion'

export type PricingFrameOverride = {
  direction: PricingMotionDirection
  progress: number
}

export type PricingFrameGate = {
  phase: PricingMotionPhase
  inView: boolean
  documentVisible: boolean
  reducedMotion: boolean
  fallback: boolean
  frameOverride?: PricingFrameOverride | null
}

export function shouldRunPricingFrame(input: PricingFrameGate): boolean {
  return input.inView
    && input.documentVisible
    && !input.reducedMotion
    && !input.fallback
    && input.frameOverride == null
}

export type PricingRenderMode = 'pending' | 'webgl' | 'fallback'

export function getPricingRenderMode(input: {
  initialized: boolean
  contextLost: boolean
  fallback?: boolean
}): PricingRenderMode {
  if (input.contextLost || input.fallback) return 'fallback'
  return input.initialized ? 'webgl' : 'pending'
}
