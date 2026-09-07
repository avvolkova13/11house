export const COMPOSITE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uDial;
  uniform sampler2D uGlass;
  uniform vec2 uResolution;
  uniform float uPhase;

  float sceneLuminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
  }

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  void main() {
    vec2 pixel = 1.0 / uResolution;
    vec3 dial = texture2D(uDial, vUv).rgb;
    vec4 glass = texture2D(uGlass, vUv);
    vec3 merged = mix(dial, glass.rgb, glass.a);

    float centerLuma = sceneLuminance(merged);
    float neighborLuma = sceneLuminance(texture2D(uDial, vUv + pixel * vec2(1.0, 0.0)).rgb);
    float luminanceGradient = abs(centerLuma - neighborLuma);
    float edgeGate = smoothstep(0.12, 0.32, luminanceGradient + glass.a * 0.08);
    vec3 split = vec3(
      texture2D(uDial, vUv + pixel * 1.15).r,
      dial.g,
      texture2D(uDial, vUv - pixel * 1.15).b
    );
    merged = mix(merged, max(merged, split), edgeGate * (1.0 - glass.a) * 0.18);

    vec3 spectralHalation = (
      texture2D(uGlass, vUv + pixel * vec2(2.25, 0.0)).rgb +
      texture2D(uGlass, vUv - pixel * vec2(2.25, 0.0)).rgb +
      texture2D(uGlass, vUv + pixel * vec2(0.0, 2.25)).rgb +
      texture2D(uGlass, vUv - pixel * vec2(0.0, 2.25)).rgb +
      texture2D(uDial, vUv + pixel * vec2(1.75, 0.0)).rgb +
      texture2D(uDial, vUv - pixel * vec2(1.75, 0.0)).rgb +
      texture2D(uDial, vUv + pixel * vec2(0.0, 1.75)).rgb +
      texture2D(uDial, vUv - pixel * vec2(0.0, 1.75)).rgb
    ) * 0.125;
    merged += max(spectralHalation - merged * 0.62, vec3(0.0)) * 0.085;

    float grain = hash21(gl_FragCoord.xy + vec2(uPhase * 997.0)) - 0.5;
    merged += grain * 0.012;
    gl_FragColor = vec4(max(merged, 0.0), 1.0);
  }
`
