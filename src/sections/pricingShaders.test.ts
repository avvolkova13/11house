import { describe, expect, it } from 'vitest'

import {
  pricingFragmentShader,
  pricingReflectionFragmentShader,
  pricingReflectionVertexShader,
  pricingVertexShader,
} from './pricingShaders'

describe('pricing rigid-turn shaders', () => {
  it('projects an undeformed plane and derives its camera-facing amount', () => {
    expect(pricingVertexShader).toContain('vUv = uv;')
    expect(pricingVertexShader).toContain('modelViewMatrix * vec4(position, 1.0)')
    expect(pricingVertexShader).toContain('normalMatrix * vec3(0.0, 0.0, 1.0)')
    expect(pricingVertexShader).not.toContain('uFold')
    expect(pricingVertexShader).not.toContain('uWave')
    expect(pricingVertexShader).not.toContain('uPinch')
    expect(pricingVertexShader).not.toContain('deformPosition')
  })

  it('keeps copy readable on the back face during the 360 degree turn', () => {
    expect(pricingFragmentShader).toContain('gl_FrontFacing')
    expect(pricingFragmentShader).toContain('1.0 - vUv.x')
    expect(pricingFragmentShader).toContain('uniform float uVelocity')
    expect(pricingFragmentShader).toContain('varying float vFacing')
    expect(pricingFragmentShader).not.toContain('uChroma')
    expect(pricingFragmentShader).not.toContain('vCurvature')
    expect(pricingFragmentShader).toContain('float roundedBoxMask')
    expect(pricingFragmentShader).toContain('float cornerMask')
    expect(pricingFragmentShader).toContain('base.a * cornerMask')
  })

  it('anchors the optical extension to the card yaw and curls it outwards', () => {
    expect(pricingReflectionVertexShader).toContain('uniform float uCardYaw')
    expect(pricingReflectionVertexShader).toContain('uniform float uReflectionSide')
    expect(pricingReflectionVertexShader).toContain('sin(uCardYaw)')
    expect(pricingReflectionVertexShader).not.toContain('uTime')
    expect(pricingReflectionVertexShader).not.toContain('ripple')
  })

  it('mirrors opposite source edges with outward blur and dispersion', () => {
    expect(pricingReflectionFragmentShader).toContain('uReflectionSide > 0.0 ? 1.0 - sourceDepth : sourceDepth')
    expect(pricingReflectionFragmentShader).toContain('vReflectionFacing')
    expect(pricingReflectionFragmentShader).toContain('float blurRadius')
    expect(pricingReflectionFragmentShader).toContain('float chromaticShift')
    expect(pricingReflectionFragmentShader).not.toContain('causticBands')
    expect(pricingReflectionFragmentShader).not.toContain('uTime')
  })

  it('converts both custom fragment outputs into the renderer output color space', () => {
    for (const fragmentShader of [pricingFragmentShader, pricingReflectionFragmentShader]) {
      const outputIndex = fragmentShader.lastIndexOf('gl_FragColor')
      const colorSpaceIndex = fragmentShader.lastIndexOf('#include <colorspace_fragment>')

      expect(outputIndex).toBeGreaterThan(-1)
      expect(colorSpaceIndex).toBeGreaterThan(outputIndex)
    }
  })
})
