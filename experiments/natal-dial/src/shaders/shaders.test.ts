import { describe, expect, it } from 'vitest'
import { DIAL_FRAGMENT_SHADER } from './dial'
import { GLASS_FRAGMENT_SHADER } from './glass'
import { COMPOSITE_FRAGMENT_SHADER } from './composite'
import { GRID_FRAGMENT_SHADER } from './grid'

describe('shader contracts', () => {
  it('keeps the dial as an independent texture-producing pass', () => {
    expect(DIAL_FRAGMENT_SHADER).toContain('uniform sampler2D uAtlas')
    expect(DIAL_FRAGMENT_SHADER).toContain('uOuterRotationA')
    expect(DIAL_FRAGMENT_SHADER).toContain('uHouseRotation')
    expect(DIAL_FRAGMENT_SHADER).toContain('projectDialSpace')
    expect(DIAL_FRAGMENT_SHADER).toContain('projectOuterSpace')
    expect(DIAL_FRAGMENT_SHADER).toContain('uniform float uLayer')
    expect(DIAL_FRAGMENT_SHADER).toContain('uniform float uOuterArcIndex')
    expect(DIAL_FRAGMENT_SHADER).toContain('gl_FragColor = vec4(color, alpha)')
    expect(DIAL_FRAGMENT_SHADER).not.toContain('point.x /= 0.63')
    expect(DIAL_FRAGMENT_SHADER).not.toContain('point.x /= 0.74')
    expect(DIAL_FRAGMENT_SHADER).toContain('vec2(0.0019, 0.0)')
    expect(DIAL_FRAGMENT_SHADER).not.toContain('0.00125')
    expect(DIAL_FRAGMENT_SHADER).not.toContain('0.00205')
    expect(DIAL_FRAGMENT_SHADER).not.toContain('0.0021')
  })

  it('keeps the grid in a dedicated static shader', () => {
    expect(GRID_FRAGMENT_SHADER).toContain('fract')
    expect(GRID_FRAGMENT_SHADER).not.toContain('uZodiacRotation')
    expect(GRID_FRAGMENT_SHADER).toContain('0.026')
    expect(GRID_FRAGMENT_SHADER).toContain('* 0.022')
    expect(GRID_FRAGMENT_SHADER).toContain('* 0.042')
  })

  it('samples the dial separately for RGB refraction channels', () => {
    expect(GLASS_FRAGMENT_SHADER).toContain('uniform sampler2D uDial')
    expect(GLASS_FRAGMENT_SHADER).toContain('float redSample')
    expect(GLASS_FRAGMENT_SHADER).toContain('float greenSample')
    expect(GLASS_FRAGMENT_SHADER).toContain('float blueSample')
    expect(GLASS_FRAGMENT_SHADER).toContain('sdChamferedBox')
    expect(GLASS_FRAGMENT_SHADER).toContain('sdRoundedBox')
    expect(GLASS_FRAGMENT_SHADER).toContain('edgePlane')
    expect(GLASS_FRAGMENT_SHADER).toContain('cornerPlane')
    expect(GLASS_FRAGMENT_SHADER).toContain('diagonalFacet')
    expect(GLASS_FRAGMENT_SHADER).toContain('glassAlpha')
  })

  it('models a cubic glass volume with a second surface for thickness-aware refraction', () => {
    expect(GLASS_FRAGMENT_SHADER).toContain('vec3(0.166)')
    expect(GLASS_FRAGMENT_SHADER).toContain('vec3(0.08)')
    expect(GLASS_FRAGMENT_SHADER).toContain('- 0.012')
    expect(GLASS_FRAGMENT_SHADER).toContain('- 0.004')
    expect(GLASS_FRAGMENT_SHADER).toContain('traceExitShape')
    expect(GLASS_FRAGMENT_SHADER).toContain('exitNormal')
    expect(GLASS_FRAGMENT_SHADER).toContain('opticalThickness')
    expect(GLASS_FRAGMENT_SHADER).toContain('environmentReflection')
    expect(GLASS_FRAGMENT_SHADER).toContain('coreEdgeMask')
    expect(GLASS_FRAGMENT_SHADER).toContain('directCoreHit')
  })

  it('uses an edge-gated composite without bloom', () => {
    expect(COMPOSITE_FRAGMENT_SHADER).toContain('luminanceGradient')
    expect(COMPOSITE_FRAGMENT_SHADER).toContain('spectralHalation')
    expect(COMPOSITE_FRAGMENT_SHADER.toLowerCase()).not.toContain('bloom')
  })
})
