import type { PricingPlaneSample } from './pricingWebglMotion'

/** The same perspective as the WebGL plane, applied to native HTML copy. */
export function projectPricingDomCard(sample: PricingPlaneSample, viewportWidth: number, viewportHeight: number, cameraZ: number, cardWidth: number, cardHeight: number, domWidth: number): number[] {
  const domHeight = domWidth * cardHeight / cardWidth
  const focal = viewportHeight / (2 * Math.tan(36 * Math.PI / 360))
  const unit = cardWidth / domWidth * sample.scale
  // Keep the back face readable during the existing full turn.
  const facing = Math.cos(sample.rotationY) < 0 ? -1 : 1
  const a = unit * Math.cos(sample.rotationY) * facing
  const k = unit * Math.sin(sample.rotationY) * facing
  const d = cameraZ - sample.z - k * domWidth / 2
  const cx = viewportWidth / 2
  const cy = viewportHeight / 2
  return [
    (cx * k + focal * a) / d, cy * k / d, 0, k / d,
    0, focal * unit / d, 0, 0,
    0, 0, 1, 0,
    cx + focal * (sample.x - a * domWidth / 2) / d,
    cy - focal * unit * domHeight / 2 / d, 0, 1,
  ]
}

/** Rear-arc copy yields to foreground cards instead of painting over their text. */
export function getPricingDomOpacity(sample: PricingPlaneSample): number {
  const visibility = Math.max(0, Math.min(1, (1.12 - Math.abs(sample.orbitPosition)) / .12))
  return sample.opacity * visibility * visibility * (3 - 2 * visibility)
}
