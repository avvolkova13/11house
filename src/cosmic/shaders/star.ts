import { STAR_PROFILE } from '../starProfile'

export const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTemperature;

  uniform float uTime;
  uniform float uTravel;
  uniform float uStreak;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vTemperature;
  varying float vStreak;
  varying float vAngle;

  void main() {
    const float nearDepth = 12.0;
    const float depthRange = 244.0;

    vec3 transformed = position;
    transformed.z = nearDepth - mod(nearDepth - position.z - uTravel, depthRange);

    float drift = sin(uTime * 0.16 + aPhase * 6.2831) * 0.16;
    transformed.x += drift * (0.45 + abs(transformed.z) * 0.004);
    transformed.y += cos(uTime * 0.13 + aPhase * 9.2) * 0.08;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vec4 projected = projectionMatrix * mvPosition;
    gl_Position = projected;

    float perspective = clamp(190.0 / max(4.0, -mvPosition.z), 0.35, ${STAR_PROFILE.maxPerspective.toFixed(1)});
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.55 + aPhase) + aPhase * 24.0);
    float stretch = mix(1.0, ${STAR_PROFILE.streakStretch.toFixed(1)}, uStreak);
    gl_PointSize = min(${STAR_PROFILE.maxPointSize.toFixed(1)}, aSize * perspective * uPixelRatio * stretch * twinkle);

    vec2 ndc = projected.xy / max(projected.w, 0.0001);
    vAngle = atan(ndc.y, ndc.x);
    float streakFade = 1.0 - uStreak * ${STAR_PROFILE.streakOpacityLoss.toFixed(2)};
    vAlpha = twinkle * smoothstep(-236.0, -130.0, transformed.z) * streakFade;
    vTemperature = aTemperature;
    vStreak = uStreak;
  }
`

export const starFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vTemperature;
  varying float vStreak;
  varying float vAngle;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(-vAngle);
    float s = sin(-vAngle);
    p = mat2(c, -s, s, c) * p;

    float stretch = mix(1.0, ${STAR_PROFILE.streakStretch.toFixed(1)}, vStreak);
    p.y *= stretch;
    float d = length(p) * 2.0;
    float core = smoothstep(${STAR_PROFILE.coreRadius.toFixed(2)}, 0.0, d);
    float halo = smoothstep(1.0, 0.04, d) * ${STAR_PROFILE.haloStrength.toFixed(2)};
    float flare = exp(-abs(p.x) * 20.0) * exp(-abs(p.y) * 4.5) * ${STAR_PROFILE.flareStrength.toFixed(2)};
    float alpha = (core + halo + flare) * vAlpha;

    vec3 cool = vec3(0.57, 0.75, 1.0);
    vec3 neutral = vec3(0.92, 0.95, 1.0);
    vec3 warm = vec3(1.0, 0.67, 0.29);
    vec3 color = vTemperature < 0.5
      ? mix(cool, neutral, vTemperature * 2.0)
      : mix(neutral, warm, (vTemperature - 0.5) * 2.0);

    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color * (1.0 + core * ${STAR_PROFILE.coreBrightnessBoost.toFixed(2)}), alpha);
  }
`
