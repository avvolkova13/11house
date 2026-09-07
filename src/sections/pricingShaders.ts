/**
 * Pricing cards stay perfectly rigid. Perspective and the 360° turn are
 * handled by the mesh transform, while the shader only measures edge-facing.
 */
export const pricingVertexShader = /* glsl */ `
precision highp float;

varying vec2 vUv;
varying float vFacing;

void main() {
  vUv = uv;

  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vec3 viewNormal = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
  vec3 viewDirection = normalize(-viewPosition.xyz);
  vFacing = clamp(dot(viewNormal, viewDirection), -1.0, 1.0);

  gl_Position = projectionMatrix * viewPosition;
}
`;

/**
 * Double-sided rendering would normally mirror the copy on the back face.
 * Flipping only the sampling UV keeps text readable through the full turn.
 */
export const pricingFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform float uVelocity;
uniform float uDirection;
uniform vec2 uCardSize;

varying vec2 vUv;
varying float vFacing;

vec2 boundedUv(vec2 sampleUv) {
  return clamp(sampleUv, vec2(0.001), vec2(0.999));
}

float roundedBoxMask(vec2 uv, vec2 size, float radius) {
  vec2 point = (uv - 0.5) * size;
  vec2 halfSize = size * 0.5;
  vec2 q = abs(point) - (halfSize - vec2(radius));
  float distanceToEdge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  return 1.0 - smoothstep(-0.012, 0.012, distanceToEdge);
}

void main() {
  vec2 faceUv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
  vec4 base = texture2D(uTexture, boundedUv(faceUv));
  float cornerMask = roundedBoxMask(vUv, uCardSize, 0.15);
  float edge = pow(1.0 - abs(vFacing), 3.2) * uVelocity;
  float side = smoothstep(-0.42, 0.42, (faceUv.x - 0.5) * uDirection);
  vec3 rimColor = mix(vec3(0.92, 0.52, 0.12), vec3(0.16, 0.72, 0.92), side);
  vec3 color = base.rgb + rimColor * edge * 0.16;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), base.a * cornerMask);
  #include <colorspace_fragment>
}
`;

/** The card remains rigid; only its mirrored water surface is displaced. */
export const pricingReflectionVertexShader = /* glsl */ `
precision highp float;

uniform float uPhase;
uniform float uTime;
uniform float uVelocity;
uniform float uDirection;
uniform float uReflectionSide;

varying vec2 vUv;
varying float vFacing;

void main() {
  vUv = uv;
  float ambientPhase = uTime * 0.58 * uReflectionSide;
  float phase = uPhase * 6.28318531 * uDirection + ambientPhase;
  float rippleA = sin(uv.x * 12.56637061 + phase * 1.35 + uReflectionSide * 0.7);
  float rippleB = sin(uv.x * 28.27433388 - phase * 0.82 + uv.y * 4.71238898);
  float rippleStrength = 0.32 + uVelocity * 0.68;
  vec3 displaced = position;
  displaced.y += (rippleA * 0.09 + rippleB * 0.035) * rippleStrength;
  displaced.x += sin(uv.y * 6.28318531 + phase) * uVelocity * 0.025 * uReflectionSide;

  vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
  vec3 viewNormal = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
  vec3 viewDirection = normalize(-viewPosition.xyz);
  vFacing = clamp(dot(viewNormal, viewDirection), -1.0, 1.0);

  gl_Position = projectionMatrix * viewPosition;
}
`;

/**
 * A compressed mirrored slice becomes the luminous portal above and below
 * the card. It is present at rest and blooms while the plane turns edge-on.
 */
export const pricingReflectionFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform float uTrail;
uniform float uVelocity;
uniform float uDirection;
uniform float uPhase;
uniform float uTime;
uniform float uReflectionSide;

varying vec2 vUv;
varying float vFacing;

vec2 boundedUv(vec2 sampleUv) {
  return clamp(sampleUv, vec2(0.001), vec2(0.999));
}

void main() {
  vec2 faceUv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
  float ambientPhase = uTime * 0.58 * uReflectionSide;
  float phase = uPhase * 6.28318531 * uDirection + ambientPhase;
  float rippleA = sin(faceUv.x * 12.56637061 + phase * 1.25 + uReflectionSide * 0.72);
  float rippleB = sin(faceUv.x * 31.41592654 - phase * 0.92 + vUv.y * 5.4);
  float wave = rippleA * 0.64 + rippleB * 0.36;
  float waterDisplacement = wave * (0.004 + uVelocity * 0.018);
  float sourceY = mix(0.56, 0.98, 1.0 - vUv.y);
  vec2 mirroredUv = vec2(
    faceUv.x + waterDisplacement,
    sourceY + waterDisplacement * 0.34 * uReflectionSide
  );
  float blurRadius = 0.003 + 0.006 * uTrail;
  float chromaticShift = 0.004 + uVelocity * 0.012;
  vec2 blurX = vec2(blurRadius, 0.0);
  vec2 blurY = vec2(0.0, blurRadius * 1.2);

  vec4 blurred = texture2D(uTexture, boundedUv(mirroredUv)) * 0.28;
  blurred += texture2D(uTexture, boundedUv(mirroredUv - blurX)) * 0.18;
  blurred += texture2D(uTexture, boundedUv(mirroredUv + blurX)) * 0.18;
  blurred += texture2D(uTexture, boundedUv(mirroredUv - blurY)) * 0.18;
  blurred += texture2D(uTexture, boundedUv(mirroredUv + blurY)) * 0.18;
  vec3 refracted = vec3(
    texture2D(uTexture, boundedUv(mirroredUv + vec2(chromaticShift, 0.0))).r,
    blurred.g,
    texture2D(uTexture, boundedUv(mirroredUv - vec2(chromaticShift, 0.0))).b
  );
  blurred.rgb = mix(blurred.rgb, refracted, 0.42 + uVelocity * 0.28);

  float sourceLuma = dot(blurred.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 saturated = mix(vec3(sourceLuma), blurred.rgb, 1.46 + uTrail * 0.84);
  float edge = pow(1.0 - abs(vFacing), 2.4) * uTrail * uVelocity;
  float side = smoothstep(0.08, 0.92, faceUv.x);
  vec3 spectralColor = mix(vec3(0.68, 0.08, 0.96), vec3(0.0, 0.82, 1.0), side);
  spectralColor = mix(spectralColor, vec3(1.0, 0.28, 0.72), smoothstep(0.72, 1.0, faceUv.x));

  float causticWave = sin(
    faceUv.x * 92.0
      + vUv.y * 8.0 * uReflectionSide
      - phase * 8.4
      + wave * 4.8
  ) * 0.5 + 0.5;
  float causticBands = pow(causticWave, 2.8);
  float secondaryBands = pow(
    sin(faceUv.x * 47.0 - phase * 5.2 - wave * 3.1) * 0.5 + 0.5,
    3.0
  );
  causticBands = max(causticBands, secondaryBands * 0.52);
  float causticPresence = 0.14
    + 0.86 * smoothstep(0.08, 0.82, uTrail + uVelocity * 0.16);

  float shoreWave = (rippleA * 0.66 + rippleB * 0.34) * (0.07 + uVelocity * 0.09);
  float waterlineY = abs((vUv.y - 0.5) + shoreWave * uReflectionSide);
  float edgeTaper = smoothstep(0.0, 0.17, vUv.x)
    * (1.0 - smoothstep(0.83, 1.0, vUv.x));
  float waterlineWidth = (0.29 + uTrail * 0.055 + causticBands * 0.018)
    * mix(0.18, 1.0, edgeTaper);
  float waterlineMask = 1.0 - smoothstep(waterlineWidth, waterlineWidth + 0.17, waterlineY);
  float horizontalMask = smoothstep(0.0, 0.12, vUv.x)
    * (1.0 - smoothstep(0.88, 1.0, vUv.x));
  float verticalMask = pow(sin(clamp(vUv.y, 0.0, 1.0) * 3.14159265), 0.72);
  float mirrorGlow = 1.0 - smoothstep(0.02, 0.38, waterlineY);

  vec3 reflectedArt = clamp(saturated * (1.12 + mirrorGlow * 0.3), 0.0, 1.0);
  vec3 causticColor = mix(spectralColor, vec3(0.72, 0.98, 1.0), causticBands);
  vec3 trailColor = mix(reflectedArt, spectralColor, 0.38 + causticPresence * 0.12);
  trailColor += causticColor * causticBands * causticPresence * (0.18 + uTrail * 0.28);
  trailColor += spectralColor * (0.05 + edge * 0.38);
  trailColor = pow(clamp(trailColor, 0.0, 1.0), vec3(0.82));

  float causticOpacity = 0.84 + causticBands * causticPresence * (0.08 + uTrail * 0.1);
  float alphaMask = horizontalMask * verticalMask * waterlineMask
    * causticOpacity
    * (0.72 + mirrorGlow * 0.3);

  gl_FragColor = vec4(trailColor, blurred.a * alphaMask);
  #include <colorspace_fragment>
}
`;
