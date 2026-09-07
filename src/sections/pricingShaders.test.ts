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

  it('deforms only the reflected surfaces into travelling water ripples', () => {
    expect(pricingReflectionVertexShader).toContain('uniform float uPhase')
    expect(pricingReflectionVertexShader).toContain('uniform float uTime')
    expect(pricingReflectionVertexShader).toContain('uniform float uReflectionSide')
    expect(pricingReflectionVertexShader).toContain('float rippleA')
    expect(pricingReflectionVertexShader).toContain('float rippleB')
    expect(pricingReflectionVertexShader).toContain('displaced.y +=')
    expect(pricingReflectionVertexShader).not.toContain('uFold')
  })

  it('builds a narrow caustic waterline instead of a blurred oval shadow', () => {
    expect(pricingReflectionFragmentShader).toContain('uniform float uTrail')
    expect(pricingReflectionFragmentShader).toContain('uniform float uPhase')
    expect(pricingReflectionFragmentShader).toContain('uniform float uTime')
    expect(pricingReflectionFragmentShader).toContain('uniform float uReflectionSide')
    expect(pricingReflectionFragmentShader).toContain('1.0 - vUv.y')
    expect(pricingReflectionFragmentShader).toContain('gl_FrontFacing')
    expect(pricingReflectionFragmentShader).toContain('float horizontalMask')
    expect(pricingReflectionFragmentShader).toContain('float verticalMask')
    expect(pricingReflectionFragmentShader).toContain('float causticBands')
    expect(pricingReflectionFragmentShader).toContain('float waterlineWidth')
    expect(pricingReflectionFragmentShader).toContain('float waterlineMask')
    expect(pricingReflectionFragmentShader).toContain('float mirrorGlow')
    expect(pricingReflectionFragmentShader).toContain('float edgeTaper')
    expect(pricingReflectionFragmentShader).toContain('float causticPresence')
    expect(pricingReflectionFragmentShader).toContain('float ambientPhase')
    expect(pricingReflectionFragmentShader).toContain('float chromaticShift')
    expect(pricingReflectionFragmentShader).toContain('float shoreWave')
    expect(pricingReflectionFragmentShader).not.toContain('float portalMask')
    expect(pricingReflectionFragmentShader).not.toContain('float ringMask')
    expect(pricingReflectionFragmentShader).toContain('uVelocity')
    expect(pricingReflectionFragmentShader).not.toContain('uChroma')
    expect(pricingReflectionFragmentShader).not.toContain('vCurvature')
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
