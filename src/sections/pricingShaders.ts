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
uniform float uTime;
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
  // Animate only the illustration interior; the brand, content and edges stay fixed.
  float artMask = smoothstep(0.688, 0.73, faceUv.y) * (1.0 - smoothstep(0.90, 0.94, faceUv.y));
  float phase = uTime * 0.65;
  vec2 drift = vec2(
    sin(phase + faceUv.y * 7.0) - sin(faceUv.y * 7.0),
    sin(phase * 0.73 + faceUv.x * 6.0) - sin(faceUv.x * 6.0)
  ) * vec2(0.020, 0.014) * artMask * sin(faceUv.x * 3.14159265);
  vec4 base = texture2D(uTexture, boundedUv(faceUv + drift));
  // Breathe the existing light sources rather than flashing the whole image.
  float light = smoothstep(0.34, 0.88, max(base.r, max(base.g, base.b)));
  float breathe = sin(phase * 1.35 + faceUv.x * 2.4);
  float restingBreath = sin(faceUv.x * 2.4);
  base.rgb *= 1.0 + artMask * light * (breathe - restingBreath) * 0.26;
  // A broad, slow glint follows the brighter ribbons, with no new particles.
  float sweepCenter = 0.5 + 0.46 * sin(phase * 0.72);
  float sweep = exp(-pow((faceUv.x - sweepCenter) / 0.16, 2.0));
  float restingSweep = exp(-pow((faceUv.x - 0.5) / 0.16, 2.0));
  base.rgb += vec3(0.10, 0.17, 0.20) * artMask * light * (sweep - restingSweep);
  float cornerMask = roundedBoxMask(vUv, uCardSize, 0.15);
  float edge = pow(1.0 - abs(vFacing), 3.2) * uVelocity;
  float side = smoothstep(-0.42, 0.42, (faceUv.x - 0.5) * uDirection);
  vec3 rimColor = mix(vec3(0.92, 0.52, 0.12), vec3(0.16, 0.72, 0.92), side);
  vec3 color = base.rgb + rimColor * edge * 0.16;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), base.a * cornerMask);
  #include <colorspace_fragment>
}
`;

/**
 * Obscura reference, 00:00–00:02: the reflection grows out of the card edge.
 * The entire reflection follows the card's yaw, including its edge-on silhouette.
 * The periodic bend returns to exactly the same geometry after a complete turn.
 */
export const pricingReflectionVertexShader = /* glsl */ `
precision highp float;

uniform float uCardYaw;
uniform float uReflectionSide;
uniform float uVelocity;
uniform float uDirection;
uniform float uReflectionFlare;
uniform float uReflectionReach;
uniform vec2 uCardSize;

varying vec2 vUv;
varying float vReflectionFacing;

void main() {
  vUv = uv;
  float distanceFromCard = uv.y;
  float bend = sin(distanceFromCard * 1.57079633);
  float yaw = uCardYaw;
  // Bend the centreline, not the face angle: an edge-on card keeps a narrow echo.
  float sweep = sin(uCardYaw) * bend * bend * uCardSize.x * (0.08 + uVelocity * 0.03);
  float spread = 1.0 + bend * bend * (0.36 + uVelocity * 0.08) * uReflectionFlare;
  // Extra transparent geometry gives the spectral fringe room outside the mirror.
  float across = (uv.x - 0.5) * 1.8 * uCardSize.x * spread;
  float rise = distanceFromCard * uCardSize.y * (uReflectionReach + uVelocity * 0.025);
  float curl = bend * sin(uCardYaw) * (uv.x - 0.5) * uCardSize.y * 0.095;
  // Lift the corners away from the contact line: the opening is a shallow arc.
  float lip = pow(abs((uv.x - 0.5) * 2.7), 4.0) * (1.0 - distanceFromCard) * uCardSize.y * 0.018;

  vec3 reflectedPosition = vec3(
    across * cos(yaw) - sweep,
    uReflectionSide * (rise + curl + lip + uCardSize.y * 0.018),
    -across * sin(yaw) + bend * uCardSize.y * 0.065
  );
  vReflectionFacing = cos(yaw);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(reflectedPosition, 1.0);
}
`;

/**
 * Mirror the actual adjacent edge, including its copy and colour field.
 * The pre-diffused source is refracted per colour channel, including its silhouette.
 * Colour comes from the card, rather than a painted gradient or a separate rim.
 */
export const pricingReflectionFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform float uReflectionSide;
uniform float uVelocity;
uniform float uCardYaw;

varying vec2 vUv;
varying float vReflectionFacing;

vec2 boundedUv(vec2 sampleUv) {
  return clamp(sampleUv, vec2(0.001), vec2(0.999));
}

float sourceCoverage(vec2 sampleUv, float softness) {
  float lateralDistance = abs(sampleUv.x - 0.5);
  return 1.0 - smoothstep(0.5 - softness, 0.5 + softness, lateralDistance);
}

// Refract the silhouette too. An uncovered colour channel sees the white field.
vec4 opticalSample(vec2 sampleUv, float shift) {
  vec4 center = texture2D(uTexture, boundedUv(sampleUv));
  vec2 redUv = sampleUv - vec2(shift, 0.0);
  vec2 greenUv = sampleUv + vec2(shift, 0.0);
  vec4 red = texture2D(uTexture, boundedUv(redUv));
  vec4 green = texture2D(uTexture, boundedUv(greenUv));
  float softness = 0.055 + shift * 1.4;
  vec2 blueCoverageUv = vec2((sampleUv.x - 0.5) * (1.0 + shift * 2.0) + 0.5, sampleUv.y);
  return vec4(
    mix(1.0, red.r, sourceCoverage(redUv, softness) * red.a),
    mix(1.0, green.g, sourceCoverage(greenUv, softness) * green.a),
    mix(1.0, center.b, sourceCoverage(blueCoverageUv, softness) * center.a),
    1.0
  );
}

void main() {
  float distanceFromCard = vUv.y;
  float mirrorX = (vUv.x - 0.5) * 1.8 + 0.5;
  float faceX = vReflectionFacing >= 0.0 ? mirrorX : 1.0 - mirrorX;
  // Top travels down from the top of the source; bottom travels up from its foot.
  float sourceDepth = pow(distanceFromCard, 0.85) * 0.46;
  float sourceY = uReflectionSide > 0.0 ? 1.0 - sourceDepth : sourceDepth;
  vec2 mirroredUv = vec2(faceX, sourceY);
  float blurRadius = 0.005 + pow(distanceFromCard, 2.0) * 0.045;
  float chromaticShift = (0.008 + pow(distanceFromCard, 1.2) * 0.12) * (1.0 + uVelocity * 0.3);
  vec2 blurX = vec2(blurRadius, 0.0);
  vec2 blurY = vec2(0.0, blurRadius * 1.8);

  vec4 blurred = opticalSample(mirroredUv, chromaticShift) * 0.2;
  blurred += opticalSample(mirroredUv - blurX, chromaticShift) * 0.12;
  blurred += opticalSample(mirroredUv + blurX, chromaticShift) * 0.12;
  blurred += opticalSample(mirroredUv - blurY, chromaticShift) * 0.12;
  blurred += opticalSample(mirroredUv + blurY, chromaticShift) * 0.12;
  blurred += opticalSample(mirroredUv - blurX - blurY, chromaticShift) * 0.08;
  blurred += opticalSample(mirroredUv + blurX - blurY, chromaticShift) * 0.08;
  blurred += opticalSample(mirroredUv - blurX + blurY, chromaticShift) * 0.08;
  blurred += opticalSample(mirroredUv + blurX + blurY, chromaticShift) * 0.08;

  // The viewport clips the far end; never fade to an artificial horizon inside it.
  float outerFade = 1.0 - smoothstep(0.9, 1.4, distanceFromCard);
  float contactFade = smoothstep(0.0, 0.10, distanceFromCard);
  float luminance = dot(blurred.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 reflectedColor = pow(max(vec3(0.0), mix(vec3(luminance), blurred.rgb, 1.9)), vec3(0.72));
  float dispersion = max(blurred.r, max(blurred.g, blurred.b)) - min(blurred.r, min(blurred.g, blurred.b));
  // On a dark foot the white field dominates; refraction remains at its edges.
  float surfacePresence = uReflectionSide > 0.0 ? 0.98 : mix(0.045, 0.6, smoothstep(0.02, 0.38, dispersion));
  float alphaMask = outerFade * contactFade * surfacePresence;

  gl_FragColor = vec4(clamp(reflectedColor, 0.0, 1.0), blurred.a * alphaMask);
  #include <colorspace_fragment>
}
`;
