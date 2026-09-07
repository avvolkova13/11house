export const DIAL_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uZodiacRotation;
  uniform float uHouseRotation;
  uniform float uOuterRotationA;
  uniform float uOuterRotationB;
  uniform float uOuterArcIndex;
  uniform float uLayer;
  uniform sampler2D uAtlas;

  const float PI = 3.141592653589793;
  const float TAU = 6.283185307179586;

  mat2 rotate2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
  }

  vec2 projectDialSpace(vec2 point) {
    point = rotate2d(-0.095) * point;
    return point;
  }

  vec2 projectOuterSpace(vec2 point) {
    point = rotate2d(-0.095) * point;
    return point;
  }

  vec2 projectOrbit(vec2 point, float tiltOffset, float squeeze) {
    point = rotate2d(-0.095 + tiltOffset) * point;
    point.x /= squeeze;
    return point;
  }

  float circleLine(vec2 p, float radius, float width) {
    float distanceToLine = abs(length(p) - radius);
    return 1.0 - smoothstep(width, width + 0.0014, distanceToLine);
  }

  float angularWindow(float angle, float center, float span, float feather) {
    float delta = abs(atan(sin(angle - center), cos(angle - center)));
    return 1.0 - smoothstep(span, span + feather, delta);
  }

  float outerArcs(vec2 p, float rotationA, float rotationB, float arcIndex) {
    vec2 innerOrbit = projectOrbit(p, 0.065 * sin(rotationA + 0.4), 0.72);
    vec2 middleOrbit = projectOrbit(p, 0.085 * sin(rotationB + 1.1), 0.745);
    vec2 outerOrbit = projectOrbit(p, 0.11 * sin(rotationA - 0.8), 0.755);
    float innerAngle = atan(innerOrbit.y, innerOrbit.x);
    float middleAngle = atan(middleOrbit.y, middleOrbit.x);
    float outerAngle = atan(outerOrbit.y, outerOrbit.x);
    float innerArc = circleLine(innerOrbit, 0.386, 0.0011) * (
      angularWindow(innerAngle, rotationB + 1.52, 1.48, 0.026) +
      angularWindow(innerAngle, rotationB + 4.73, 1.18, 0.026)
    );
    float middleArc = circleLine(middleOrbit, 0.404, 0.00115) * (
      angularWindow(middleAngle, rotationA + 2.7, 1.22, 0.026) +
      angularWindow(middleAngle, rotationA + 5.72, 0.98, 0.026)
    );
    float outerArc = circleLine(outerOrbit, 0.414, 0.0012) * (
      angularWindow(outerAngle, rotationB + 0.74, 0.92, 0.026) +
      angularWindow(outerAngle, rotationB + 3.88, 1.02, 0.026)
    );
    if (arcIndex < 0.5) return innerArc * 0.82;
    if (arcIndex < 1.5) return middleArc * 0.9;
    return outerArc;
  }

  float radialTicks(vec2 p, float rotation) {
    float radius = length(p);
    float band = smoothstep(0.342, 0.345, radius) * (1.0 - smoothstep(0.354, 0.357, radius));
    float angle = atan(p.y, p.x) + rotation;
    float tick = 1.0 - smoothstep(0.022, 0.052, abs(sin(angle * 36.0)));
    return band * tick * 0.32;
  }

  float houseMarks(vec2 p, float rotation) {
    float radius = length(p);
    float angle = atan(p.y, p.x) + rotation;
    float spoke = 1.0 - smoothstep(0.008, 0.019, abs(sin(angle * 6.0)));
    float band = smoothstep(0.331, 0.334, radius) * (1.0 - smoothstep(0.35, 0.354, radius));
    return spoke * band * 0.14;
  }

  float geometryMask(vec2 p, vec2 chromaOffset) {
    vec2 q = projectDialSpace(p + chromaOffset);
    float mask = 0.0;
    mask += circleLine(q, 0.337, 0.00115) * 0.94;
    mask += radialTicks(q, uZodiacRotation);
    mask += houseMarks(q, uHouseRotation);
    return clamp(mask, 0.0, 1.0);
  }

  vec3 sampleAtlasChromatic(vec2 p) {
    vec2 uvR = rotate2d(uZodiacRotation) * projectDialSpace(p + vec2(0.0019, 0.0)) + 0.5;
    vec2 uvG = rotate2d(uZodiacRotation) * projectDialSpace(p) + 0.5;
    vec2 uvB = rotate2d(uZodiacRotation) * projectDialSpace(p - vec2(0.0019, 0.0)) + 0.5;
    return vec3(texture2D(uAtlas, uvR).r, texture2D(uAtlas, uvG).g, texture2D(uAtlas, uvB).b);
  }

  void main() {
    vec2 p = vUv - 0.5;

    float red = geometryMask(p, vec2(0.0019, 0.0));
    float green = geometryMask(p, vec2(0.0));
    float blue = geometryMask(p, vec2(-0.0019, 0.0));
    vec3 geometry = vec3(red, green, blue) * vec3(0.93, 0.89, 0.78);
    vec3 atlas = sampleAtlasChromatic(p);

    float outerRed = outerArcs(p + vec2(0.0019, 0.0), uOuterRotationA, uOuterRotationB, uOuterArcIndex);
    float outerGreen = outerArcs(p, uOuterRotationA, uOuterRotationB, uOuterArcIndex);
    float outerBlue = outerArcs(p - vec2(0.0019, 0.0), uOuterRotationA, uOuterRotationB, uOuterArcIndex);
    vec3 outerColor = vec3(outerRed, outerGreen, outerBlue) * vec3(0.93, 0.89, 0.78);

    float halo = exp(-92.0 * abs(length(projectDialSpace(p)) - 0.337)) * 0.0045;
    vec3 innerColor = geometry + atlas + halo * vec3(0.45, 0.72, 0.9);
    vec2 atlasUv = rotate2d(uZodiacRotation) * projectDialSpace(p) + 0.5;
    float atlasAlpha = texture2D(uAtlas, atlasUv).a;
    float innerAlpha = clamp(max(red, max(green, blue)) + atlasAlpha + halo * 12.0, 0.0, 1.0);
    float outerAlpha = clamp(max(outerRed, max(outerGreen, outerBlue)), 0.0, 1.0);
    float selector = step(0.5, uLayer);
    vec3 color = mix(innerColor, outerColor, selector);
    float alpha = mix(innerAlpha, outerAlpha, selector);
    gl_FragColor = vec4(color, alpha);
  }
`
