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

  float easeSurface(float value) {
    float progress = clamp((value - 0.18) / 0.54, 0.0, 1.0);
    return progress * progress * (3.0 - 2.0 * progress);
  }

  vec3 morphSurface(vec2 rawPosition, float terrainHeight) {
    float formation = easeSurface(uTunnelMix);
    float presentation = clamp(uTunnelPresentation, 0.0, 1.0);
    float flight = clamp(uTunnelDive, 0.0, 1.0);
    float depth = clamp((rawPosition.y + 132.5) / 265.0, 0.0, 1.0);
    float depthEase = pow(depth, 0.92);
    float lane = clamp(rawPosition.x / 76.0, -1.0, 1.0);
    float flow = uTravel * 0.035;
    float twist = depthEase * 2.55
      + sin(depth * 8.6 + uTime * 0.12 + flow + flight * 2.8) * 0.24
      - presentation * depth * 0.34;
    float angle = lane * 3.14159265 + twist - 1.57079633;
    float dive = smoothstep(0.68, 1.0, uTunnelMix);
    float breathing = sin(uTime * 0.31 + depth * 5.7) * 0.018;
    float angularNoise = sin(angle * 3.0 + depth * 8.2) * 0.105
      + sin(angle * 7.0 - depth * 13.7) * 0.044
      + sin(angle * 11.0 + depth * 4.1) * 0.022;
    float radius = mix(79.0, 5.8, depthEase)
      * mix(1.0, 0.82, dive)
      * (1.0 + angularNoise + breathing);
    float bendX = 50.0 * pow(depth, 1.42)
      + sin(depth * 5.1 + uTime * 0.08) * 2.1 * depth;
    float bendZ = 62.0 * pow(depth, 1.32)
      + cos(depth * 4.3 - uTime * 0.07) * 1.5 * depth;
    vec3 terrain = vec3(rawPosition, terrainHeight);
    vec3 legacyTunnel = vec3(
      bendX + cos(angle) * radius,
      rawPosition.y,
      bendZ + sin(angle) * radius * 0.74
    );
    float finalDepth = depth;
    float finalDepthEase = pow(finalDepth, 0.82);
    float finalTwist = finalDepthEase * 6.4
      + sin(finalDepth * 8.1 + uTime * 0.12 + flow + flight * 2.1) * 0.28
      - finalDepth * 0.18;
    float finalAngle = lane * 3.14159265 + finalTwist - 1.57079633;
    float finalAngularNoise = sin(finalAngle * 3.0 + finalDepth * 7.8) * 0.048
      + sin(finalAngle * 7.0 - finalDepth * 12.7) * 0.022
      + sin(finalAngle * 11.0 + finalDepth * 4.4) * 0.01;
    float finalShoulder = smoothstep(0.0, 0.68, finalDepth);
    float finalTaper = smoothstep(0.68, 1.0, finalDepth);
    float finalBodyRadius = mix(88.0, 62.0, finalShoulder);
    float finalRadius = mix(finalBodyRadius, 6.2, finalTaper)
      * (1.0 + finalAngularNoise + breathing * 0.7);
    float finalCenterArc = sin(finalDepth * 3.14159265);
    float finalCenterEnvelope = finalDepth * (1.0 - finalDepth);
    float finalBendX = -4.0 * (1.0 - finalDepth) + finalCenterArc * 14.0
      + sin(finalDepth * 4.7 + uTime * 0.07) * 1.4 * finalCenterEnvelope;
    float finalBendZ = -4.0 * (1.0 - finalDepth) + finalDepth * 26.0 + finalCenterArc * 8.0
      + cos(finalDepth * 4.1 - uTime * 0.06) * 1.2 * finalCenterEnvelope;
    float referenceScale = 0.52;
    vec3 referenceTunnel = vec3(
      finalBendX + cos(finalAngle) * finalRadius * referenceScale,
      rawPosition.y,
      finalBendZ + sin(finalAngle) * finalRadius * 1.08 * referenceScale
    );
    vec3 tunnel = mix(legacyTunnel, referenceTunnel, presentation);
    return mix(terrain, tunnel, formation);
  }
`

export const terrainVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uTunnelMix;
  uniform float uTunnelPresentation;
  uniform float uTunnelDive;
  uniform float uVelocity;
  uniform vec2 uPointer;
  attribute float aInteraction;
  attribute vec2 aInteractionGradient;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vHeight;
  varying float vDistance;
  varying float vTunnelMix;
  varying float vTunnelDepth;
  varying float vTunnelAngle;
  ${terrainNoise}

  void main() {
    vUv = uv;
    float formation = easeSurface(uTunnelMix);
    float interaction = aInteraction * (1.0 - formation);
    float height = baseTerrainHeight(position.xy) + interaction;
    vec3 transformed = morphSurface(position.xy, height);

    float epsilon = 0.72;
    float leftHeight = baseTerrainHeight(position.xy - vec2(epsilon, 0.0));
    float rightHeight = baseTerrainHeight(position.xy + vec2(epsilon, 0.0));
    float downHeight = baseTerrainHeight(position.xy - vec2(0.0, epsilon));
    float upHeight = baseTerrainHeight(position.xy + vec2(0.0, epsilon));
    vec3 terrainNormal = normalize(vec3(
      leftHeight - rightHeight - aInteractionGradient.x * epsilon * 2.0,
      downHeight - upHeight - aInteractionGradient.y * epsilon * 2.0,
      epsilon * 2.0
    ));
    float depth = clamp((position.y + 132.5) / 265.0, 0.0, 1.0);
    float lane = clamp(position.x / 76.0, -1.0, 1.0);
    float twist = pow(depth, 0.92) * 2.55
      + sin(depth * 8.6 + uTime * 0.12 + uTravel * 0.035 + uTunnelDive * 2.8) * 0.24
      - uTunnelPresentation * depth * 0.34;
    float angle = lane * 3.14159265 + twist - 1.57079633;
    float presentation = clamp(uTunnelPresentation, 0.0, 1.0);
    float finalDepth = depth;
    float finalTwist = pow(finalDepth, 0.82) * 6.4
      + sin(finalDepth * 8.1 + uTime * 0.12 + uTravel * 0.035 + uTunnelDive * 2.1) * 0.28
      - finalDepth * 0.18;
    float finalAngle = lane * 3.14159265 + finalTwist - 1.57079633;
    vec3 legacyTunnelNormal = normalize(vec3(cos(angle), 0.0, sin(angle) * 0.74));
    vec3 referenceTunnelNormal = normalize(vec3(cos(finalAngle), 0.0, sin(finalAngle) * 1.08));
    vec3 tunnelNormal = normalize(mix(legacyTunnelNormal, referenceTunnelNormal, presentation));
    vec3 objectNormal = normalize(mix(terrainNormal, tunnelNormal, formation));

    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(normalMatrix * objectNormal);
    vHeight = height;
    vDistance = distance(cameraPosition, worldPosition.xyz);
    vTunnelMix = formation;
    vTunnelDepth = depth;
    vTunnelAngle = mix(angle, finalAngle, presentation);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

export const terrainFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uShadowColor;
  uniform vec3 uRidgeColor;
  uniform vec3 uHotColor;
  uniform float uOpacity;
  uniform float uTunnelPresentation;
  uniform float uTunnelDive;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vHeight;
  varying float vDistance;
  varying float vTunnelMix;
  varying float vTunnelDepth;
  varying float vTunnelAngle;

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
    float terrainAlpha = (0.62 + diffuse * 0.12) * farFade * sideFade;
    float presentation = clamp(uTunnelPresentation, 0.0, 1.0);
    float contourFrequency = mix(112.0, 120.0, presentation);
    float contourPhase = vTunnelDepth * contourFrequency
      + sin(vUv.x * 20.0 + vTunnelDepth * 17.0) * 0.21
      + sin(vUv.x * 47.0 - vTunnelDepth * 31.0) * 0.075;
    float contourDistance = min(fract(contourPhase), 1.0 - fract(contourPhase));
    float contourLine = 1.0 - smoothstep(0.008, 0.032, contourDistance);
    float longitudinalPhase = vUv.x * 72.0 + sin(vTunnelDepth * 28.0) * 0.18;
    float longitudinalDistance = min(fract(longitudinalPhase), 1.0 - fract(longitudinalPhase));
    float longitudinalLine = (1.0 - smoothstep(0.008, 0.035, longitudinalDistance)) * 0.05;
    float depthEnvelope = smoothstep(0.015, 0.08, vTunnelDepth)
      * (1.0 - smoothstep(0.965, 1.0, vTunnelDepth));
    float lowerLeftSweep = 0.42 + 0.58 * smoothstep(-0.82, 0.58,
      -cos(vTunnelAngle + 0.32) - sin(vTunnelAngle - 0.12) * 0.42);
    float presentationMask = mix(1.0, depthEnvelope * lowerLeftSweep, presentation);
    float hazeNoise = hashFragment(
      floor(vUv * vec2(180.0, 260.0)) + vec2(uTunnelDive * 3.0)
    );
    float haze = (0.008 + grazing * 0.022 + hazeNoise * 0.006)
      * depthEnvelope * presentation;
    float reliefMemory = (0.006 + diffuse * 0.035 + grazing * 0.045 + contour * diffuse * 0.018)
      * depthEnvelope * smoothstep(0.28, 0.76, vTunnelMix)
      * mix(1.0, 0.62, presentation);
    float tunnelAlpha = ((contourLine * 0.31 + longitudinalLine + 0.008)
      * smoothstep(0.36, 0.74, vTunnelMix)
      * mix(0.88, 1.34, vTunnelDepth) * presentationMask) + haze + reliefMemory;
    vec3 tunnelColor = mix(uRidgeColor * 1.24, vec3(0.10, 0.21, 0.46), presentation * 0.64);
    tunnelColor += uHotColor * contour * diffuse * mix(0.10, 0.035, presentation);
    color = mix(
      color,
      tunnelColor * (0.72 + diffuse * 0.32 + grazing * 0.18),
      vTunnelMix * 0.84
    );
    float alpha = mix(terrainAlpha, tunnelAlpha, vTunnelMix);
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`

export const terrainPointVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uTunnelMix;
  uniform float uTunnelPresentation;
  uniform float uTunnelDive;
  uniform float uVelocity;
  uniform float uIntroEnergy;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  attribute float aInteraction;
  varying float vEnergy;
  varying float vFade;
  varying float vInteraction;
  varying float vTunnelMix;
  varying float vPointAngle;
  varying float vPointStretch;
  varying float vTunnelDepth;
  ${terrainNoise}

  void main() {
    float formation = easeSurface(uTunnelMix);
    float interaction = aInteraction * (1.0 - formation);
    float presentation = clamp(uTunnelPresentation, 0.0, 1.0);
    float baseDepth = clamp((position.y + 132.5) / 265.0, 0.0, 1.0);
    float flowOffset = (uTime * 0.012 + uTravel * 0.0045) * presentation;
    float flowingDepth = fract(baseDepth + flowOffset);
    vec2 flowingPosition = vec2(
      position.x,
      mix(position.y, flowingDepth * 265.0 - 132.5, formation * presentation)
    );
    float height = baseTerrainHeight(flowingPosition) + interaction;
    vec3 transformed = morphSurface(flowingPosition, height);
    transformed.z += mix(0.16, 0.08, formation);
    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * worldPosition;
    vec4 projected = projectionMatrix * viewPosition;
    float randomValue = hash21(position.xy + 19.7);
    float pulse = 0.76 + sin(uTime * (0.34 + randomValue * 0.24) + randomValue * 28.0) * 0.24;
    vInteraction = smoothstep(0.04, 2.8, abs(interaction));
    vTunnelMix = formation;
    vEnergy = smoothstep(-5.0, 9.0, height) * 0.55 + randomValue * 0.45
      + vInteraction * 0.62;
    float depth = clamp((flowingPosition.y + 132.5) / 265.0, 0.0, 1.0);
    float presentedDepth = depth;
    float halo = exp(-pow((presentedDepth - 0.72) / 0.24, 2.0));
    float tunnelThreshold = mix(0.88, 0.78, smoothstep(0.62, 1.0, depth));
    float presentedThreshold = mix(0.94, 0.64, halo);
    float densityThreshold = mix(
      0.74,
      mix(tunnelThreshold, presentedThreshold, uTunnelPresentation),
      formation
    );
    float lane = clamp(position.x / 76.0, -1.0, 1.0);
    float twist = pow(depth, 0.92) * 2.55
      + sin(depth * 8.6 + uTime * 0.12 + uTravel * 0.035 + uTunnelDive * 2.8) * 0.24
      - uTunnelPresentation * depth * 0.34;
    float angle = lane * 3.14159265 + twist - 1.57079633;
    float finalTwist = pow(depth, 0.82) * 2.34
      + sin(depth * 8.1 + uTime * 0.12 + uTravel * 0.035 + uTunnelDive * 2.1) * 0.22
      - depth * 0.23;
    float finalAngle = lane * 3.14159265 + finalTwist - 1.57079633;
    float presentedAngle = mix(angle, finalAngle, uTunnelPresentation);
    float sweep = 0.45 + 0.55 * smoothstep(-0.82, 0.58,
      -cos(presentedAngle + 0.32) - sin(presentedAngle - 0.12) * 0.42);
    float tunnelDepthFade = 1.0;
    vFade = (1.0 - smoothstep(120.0, 268.0, length(viewPosition.xyz)))
      * step(densityThreshold, randomValue) * tunnelDepthFade
      * mix(1.0, (0.34 + halo * 0.98) * sweep, uTunnelPresentation);
    vec2 ndc = projected.xy / max(projected.w, 0.0001);
    vPointAngle = atan(ndc.y - 0.18, ndc.x - 0.12);
    float introStretch = 1.0 + abs(uIntroEnergy) * 2.15;
    float tunnelStretch = 1.0 + min(abs(uVelocity), 14.0) * 0.11
      + uTunnelDive * 0.34;
    vPointStretch = mix(introStretch, tunnelStretch, uTunnelPresentation);
    vTunnelDepth = presentedDepth;
    gl_PointSize = (0.42 + randomValue * 0.82 + vEnergy * 0.48 + vInteraction * 0.34)
      * uPixelRatio * pulse * (125.0 / max(66.0, -viewPosition.z))
      * mix(1.0, 0.58 + min(abs(uVelocity), 12.0) * 0.028, formation)
      * vPointStretch;
    gl_Position = projected;
  }
`

export const terrainPointFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uPointColor;
  uniform float uOpacity;
  varying float vEnergy;
  varying float vFade;
  varying float vTunnelMix;
  varying float vPointAngle;
  varying float vPointStretch;
  varying float vTunnelDepth;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float cosine = cos(-vPointAngle);
    float sine = sin(-vPointAngle);
    center = mat2(cosine, -sine, sine, cosine) * center;
    center.y *= vPointStretch;
    float distanceToCenter = length(center);
    float core = smoothstep(0.48, 0.05, distanceToCenter);
    float glow = smoothstep(0.50, 0.16, distanceToCenter);
    float alpha = (core + glow * 0.32) * vFade;
    if (alpha < 0.01) discard;
    vec3 tunnelTint = mix(uPointColor, vec3(0.30, 0.48, 0.88), vTunnelMix * 0.82);
    tunnelTint = mix(tunnelTint, vec3(0.38, 0.50, 0.86), smoothstep(0.62, 1.0, vTunnelDepth) * 0.18);
    vec3 color = tunnelTint * (0.42 + vEnergy * 0.72) * mix(1.0, 0.88, vTunnelMix);
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`
