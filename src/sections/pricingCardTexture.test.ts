// @ts-expect-error Vitest runs in Node, while the app tsconfig intentionally omits Node types.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { pricingPlans } from './pricingData'
import {
  PRICING_TEXTURE_HEIGHT,
  PRICING_TEXTURE_WIDTH,
  getPricingTextureLayout,
} from './pricingCardTexture'

const source = readFileSync(new URL('./pricingCardTexture.ts', import.meta.url), 'utf8')

describe('pricing card texture layout', () => {
  it('allows room for full-height artwork and native content', () => {
    expect(PRICING_TEXTURE_WIDTH).toBe(1024)
    expect(PRICING_TEXTURE_HEIGHT).toBe(1800)
    expect(getPricingTextureLayout().art.bottom).toBe(560)
    expect(source).not.toContain('context.fillText(')
  })

  it('keeps all readable content inside safe bounds', () => {
    const layout = getPricingTextureLayout()
    expect(layout.safe.left).toBeGreaterThanOrEqual(64)
    expect(layout.safe.right).toBeLessThanOrEqual(960)
    expect(layout.commission.bottom).toBeLessThanOrEqual(1292)
    expect(layout.art.bottom).toBeLessThan(layout.name.top)
  })

  it('clips the complete card to a visible premium radius', () => {
    expect(source).toContain('const CARD_RADIUS = 32')
    expect(source).toContain('roundedRectPath(context, 0, 0, width, height, CARD_RADIUS)')
    expect(source).toContain('context.clip()')
  })

  it('fits every plan checklist above its action within the existing card bounds', () => {
    const layout = getPricingTextureLayout()
    for (const plan of pricingPlans) {
      const lastLineBottom = layout.points.top + (plan.cardPoints.length - 1) * layout.points.lineHeight + 40
      expect(lastLineBottom).toBeLessThan(layout.button.top)
    }
    expect(layout.button.left).toBe(layout.safe.left)
    expect(layout.button.right).toBe(layout.safe.right)
    expect(layout.button.bottom).toBeLessThanOrEqual(layout.safe.bottom)
  })

  it('uses a distinct abstract gradient composition for every plan', () => {
    expect(source).toContain('drawChromaticRibbon')
    expect(source).toContain('drawLiquidLens')
    expect(source).toContain('drawAuroraField')
    expect(source).toContain("context.globalCompositeOperation = 'screen'")
  })
})
