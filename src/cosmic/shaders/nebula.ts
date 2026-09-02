const terrainNoise = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x), f.y);
  }

  float fbm21(vec2 p) {
    float value = 0.0;
    float amplitude = 0.54;
    mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise21(p);
      p = rotation * p * 2.03 + 13.17;
      amplitude *= 0.48;
    }
    return value;
  }

  float baseTerrainHeight(vec2 rawPosition) {
    vec2 p = rawPosition;
    p.y += uTravel * 0.82;
    vec2 domain = vec2(p.x * 0.036, p.y * 0.024);
    float warpA = fbm21(domain * 1.32 + vec2(uTime * 0.006, -uTime * 0.004));
    float warpB = fbm21(domain * 2.16 + vec2(warpA * 1.7, -warpA * 1.1));
    float ridgeNoise = noise21(domain * 2.12 + warpB * 1.45);
    float ridges = pow(1.0 - abs(ridgeNoise * 2.0 - 1.0), 2.35);
    float broad = (warpA - 0.48) * 9.2 + (warpB - 0.48) * 4.4;
    float sculpted = ridges * (2.4 + warpA * 3.8);

    vec2 deltaA = (p - vec2(7.0, -43.0)) / vec2(17.0, 18.0);
    vec2 deltaB = (p - vec2(-29.0, 31.0)) / vec2(14.0, 18.0);
    vec2 deltaC = (p - vec2(35.0, 61.0)) / vec2(20.0, 23.0);
    float pitA = exp(-dot(deltaA, deltaA) * 2.4);
    float pitB = exp(-dot(deltaB, deltaB) * 2.8);
    float pitC = exp(-dot(deltaC, deltaC) * 2.6);
    float centralChannel = exp(-abs(p.x + sin(p.y * 0.035) * 7.0) * 0.052) * smoothstep(-72.0, 68.0, p.y);
    float edgeLift = pow(abs(p.x) / 74.0, 1.7) * 10.0;

    float baseHeight = broad + sculpted + edgeLift
      - pitA * 14.5 - pitB * 8.5 - pitC * 7.0 - centralChannel * 5.5;
    return baseHeight;
  }
`

export const terrainVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform vec2 uPointer;
  attribute float aInteraction;
  attribute vec2 aInteractionGradient;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vHeight;
  varying float vDistance;
  ${terrainNoise}

  void main() {
    vUv = uv;
    vec3 transformed = position;
    float interaction = aInteraction;
    float height = baseTerrainHeight(position.xy) + interaction;
    transformed.z = height;

    float epsilon = 0.72;
    float leftHeight = baseTerrainHeight(position.xy - vec2(epsilon, 0.0));
    float rightHeight = baseTerrainHeight(position.xy + vec2(epsilon, 0.0));
    float downHeight = baseTerrainHeight(position.xy - vec2(0.0, epsilon));
    float upHeight = baseTerrainHeight(position.xy + vec2(0.0, epsilon));
    vec3 objectNormal = normalize(vec3(
      leftHeight - rightHeight - aInteractionGradient.x * epsilon * 2.0,
      downHeight - upHeight - aInteractionGradient.y * epsilon * 2.0,
      epsilon * 2.0
    ));

    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(normalMatrix * objectNormal);
    vHeight = height;
    vDistance = distance(cameraPosition, worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

export const terrainFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uShadowColor;
  uniform vec3 uRidgeColor;
  uniform vec3 uHotColor;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vHeight;
  varying float vDistance;

  float hashFragment(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(vec3(-0.42, 0.82, 0.36));
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float grazing = pow(1.0 - max(dot(normal, normalize(cameraPosition - vWorldPosition)), 0.0), 2.8);
    float altitude = smoothstep(-7.5, 8.5, vHeight);
    float contour = pow(0.5 + 0.5 * cos(vHeight * 2.35 + vWorldPosition.z * 0.035), 12.0);
    float micro = hashFragment(floor(vUv * vec2(480.0, 720.0)));

    vec3 color = mix(uShadowColor, uRidgeColor, diffuse * 0.74 + altitude * 0.26);
    color = mix(color, uHotColor, contour * diffuse * 0.14);
    color += uRidgeColor * grazing * 0.08;
    color *= 0.26 + diffuse * 0.58 + micro * 0.025;

    float farFade = 1.0 - smoothstep(105.0, 248.0, vDistance);
    float sideFade = smoothstep(0.0, 0.10, vUv.x) * smoothstep(0.0, 0.10, 1.0 - vUv.x);
    float alpha = (0.62 + diffuse * 0.12) * farFade * sideFade;
    gl_FragColor = vec4(color, alpha);
  }
`

export const terrainPointVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  attribute float aInteraction;
  varying float vEnergy;
  varying float vFade;
  varying float vInteraction;
  ${terrainNoise}

  void main() {
    vec3 transformed = position;
    float interaction = aInteraction;
    float height = baseTerrainHeight(position.xy) + interaction;
    transformed.z = height + 0.16;
    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * worldPosition;
    float randomValue = hash21(position.xy + 19.7);
    float pulse = 0.76 + sin(uTime * (0.34 + randomValue * 0.24) + randomValue * 28.0) * 0.24;
    vInteraction = smoothstep(0.04, 2.8, abs(interaction));
    vEnergy = smoothstep(-5.0, 9.0, height) * 0.55 + randomValue * 0.45
      + vInteraction * 0.62;
    vFade = (1.0 - smoothstep(120.0, 252.0, length(viewPosition.xyz))) * step(0.74, randomValue);
    gl_PointSize = (0.42 + randomValue * 0.82 + vEnergy * 0.48 + vInteraction * 0.34)
      * uPixelRatio * pulse * (125.0 / max(66.0, -viewPosition.z));
    gl_Position = projectionMatrix * viewPosition;
  }
`

export const terrainPointFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uPointColor;
  varying float vEnergy;
  varying float vFade;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float distanceToCenter = length(center);
    float core = smoothstep(0.48, 0.05, distanceToCenter);
    float glow = smoothstep(0.50, 0.16, distanceToCenter);
    float alpha = (core + glow * 0.32) * vFade;
    if (alpha < 0.01) discard;
    vec3 color = uPointColor * (0.42 + vEnergy * 0.72);
    gl_FragColor = vec4(color, alpha);
  }
`
