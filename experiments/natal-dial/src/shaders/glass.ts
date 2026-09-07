export const GLASS_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uDial;
  uniform vec2 uResolution;
  uniform vec2 uPrismCenter;
  uniform float uPrismScale;
  uniform vec4 uPrismQuaternion;
  uniform float uDispersion;
  uniform float uCaustic;
  uniform float uRaySteps;

  const int MAX_STEPS = 72;

  vec3 rotateByQuaternion(vec3 vector, vec4 quaternion) {
    return vector + 2.0 * cross(quaternion.xyz, cross(quaternion.xyz, vector) + quaternion.w * vector);
  }

  float sdChamferedBox(vec3 point, vec3 halfSize, float edgeCut, float cornerCut) {
    vec3 folded = abs(point);
    vec3 faceDistance = folded - halfSize;
    float facePlane = max(faceDistance.x, max(faceDistance.y, faceDistance.z));
    float edgePlane = max(
      max(
        folded.x + folded.y - (halfSize.x + halfSize.y - edgeCut),
        folded.x + folded.z - (halfSize.x + halfSize.z - edgeCut)
      ),
      folded.y + folded.z - (halfSize.y + halfSize.z - edgeCut)
    );
    edgePlane /= 1.41421356237;
    float cornerPlane = (
      folded.x + folded.y + folded.z -
      (halfSize.x + halfSize.y + halfSize.z - cornerCut)
    ) / 1.73205080757;
    return max(facePlane, max(edgePlane, cornerPlane));
  }

  float sdRoundedBox(vec3 point, vec3 halfSize, float radius) {
    vec3 rounded = abs(point) - halfSize + radius;
    return min(max(rounded.x, max(rounded.y, rounded.z)), 0.0) + length(max(rounded, 0.0)) - radius;
  }

  float shellDistance(vec3 point) {
    return sdRoundedBox(point, vec3(0.166), 0.024) - 0.012;
  }

  float coreDistance(vec3 point) {
    vec3 shifted = point - vec3(-0.006, -0.003, -0.005);
    return sdChamferedBox(shifted, vec3(0.08), 0.006, 0.012) - 0.004;
  }

  float traceShape(vec3 rayOrigin, vec3 rayDirection, bool core) {
    float travel = 0.0;
    for (int index = 0; index < MAX_STEPS; index += 1) {
      if (float(index) >= uRaySteps) break;
      vec3 point = rayOrigin + rayDirection * travel;
      float distanceToSurface = core ? coreDistance(point) : shellDistance(point);
      if (abs(distanceToSurface) < 0.00065) return travel;
      travel += max(distanceToSurface * 0.72, 0.00055);
      if (travel > 3.2) break;
    }
    return -1.0;
  }

  float traceExitShape(vec3 rayOrigin, vec3 rayDirection) {
    float travel = 0.002;
    for (int index = 0; index < MAX_STEPS; index += 1) {
      if (float(index) >= uRaySteps) break;
      vec3 point = rayOrigin + rayDirection * travel;
      float distanceToSurface = shellDistance(point);
      if (distanceToSurface > -0.0007 && travel > 0.006) return travel;
      travel += max(abs(distanceToSurface) * 0.58, 0.00065);
      if (travel > 0.72) break;
    }
    return -1.0;
  }

  vec3 shellNormal(vec3 point) {
    vec2 e = vec2(0.0012, 0.0);
    return normalize(vec3(
      shellDistance(point + e.xyy) - shellDistance(point - e.xyy),
      shellDistance(point + e.yxy) - shellDistance(point - e.yxy),
      shellDistance(point + e.yyx) - shellDistance(point - e.yyx)
    ));
  }

  vec3 coreNormal(vec3 point) {
    vec2 e = vec2(0.0012, 0.0);
    return normalize(vec3(
      coreDistance(point + e.xyy) - coreDistance(point - e.xyy),
      coreDistance(point + e.yxy) - coreDistance(point - e.yxy),
      coreDistance(point + e.yyx) - coreDistance(point - e.yyx)
    ));
  }

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  void main() {
    vec2 screenPoint = vUv - 0.5;
    vec2 localScreen = (screenPoint - uPrismCenter) / max(uPrismScale, 0.001);
    if (max(abs(localScreen.x), abs(localScreen.y)) > 0.31) {
      gl_FragColor = vec4(0.0);
      return;
    }
    vec4 inverseQuaternion = vec4(-uPrismQuaternion.xyz, uPrismQuaternion.w);
    vec3 worldRayOrigin = vec3(localScreen, 0.92);
    vec3 worldRayDirection = normalize(vec3(localScreen * 0.065, -1.0));
    vec3 rayOrigin = rotateByQuaternion(worldRayOrigin, inverseQuaternion);
    vec3 rayDirection = normalize(rotateByQuaternion(worldRayDirection, inverseQuaternion));

    float shellHit = traceShape(rayOrigin, rayDirection, false);
    if (shellHit < 0.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec3 localHit = rayOrigin + rayDirection * shellHit;
    vec3 localNormal = shellNormal(localHit);
    vec3 worldNormal = normalize(rotateByQuaternion(localNormal, uPrismQuaternion));
    vec3 viewDirection = normalize(-worldRayDirection);
    float facing = clamp(abs(dot(worldNormal, viewDirection)), 0.0, 1.0);
    float fresnelEdge = pow(1.0 - facing, 2.8);
    vec3 absoluteNormal = abs(localNormal);
    float normalPeak = max(absoluteNormal.x, max(absoluteNormal.y, absoluteNormal.z));
    float normalFloor = min(absoluteNormal.x, min(absoluteNormal.y, absoluteNormal.z));
    float edgeFacet = smoothstep(0.015, 0.16, 1.0 - normalPeak);
    float cornerFacet = smoothstep(0.16, 0.46, normalFloor);
    float faceFacet = 1.0 - smoothstep(0.01, 0.09, 1.0 - normalPeak);

    vec3 insideDirection = refract(rayDirection, localNormal, 1.0 / 1.52);
    if (length(insideDirection) < 0.01) insideDirection = rayDirection;
    float exitHit = traceExitShape(localHit + insideDirection * 0.002, insideDirection);
    float opticalThickness = max(exitHit, 0.0);
    vec3 exitPoint = localHit + insideDirection * opticalThickness;
    vec3 exitNormal = shellNormal(exitPoint);
    vec3 outgoingDirection = refract(insideDirection, -exitNormal, 1.52);
    if (length(outgoingDirection) < 0.01) outgoingDirection = reflect(insideDirection, exitNormal);

    vec3 worldExitDelta = rotateByQuaternion(exitPoint - localHit, uPrismQuaternion);
    vec3 worldOutgoing = normalize(rotateByQuaternion(outgoingDirection, uPrismQuaternion));
    vec2 normalOffset = worldNormal.xy;
    vec2 baseOffset = (
      worldExitDelta.xy * 0.92 +
      worldOutgoing.xy * opticalThickness * 0.34 +
      normalOffset * mix(0.004, 0.024, edgeFacet + fresnelEdge * 0.45)
    ) * uPrismScale;
    float channelSpread = mix(0.0018, 0.0068, edgeFacet + cornerFacet * 0.5) * uDispersion;
    vec2 prismUvCenter = vec2(0.5) + uPrismCenter;
    vec2 lensUv = vUv + baseOffset;
    vec2 secondUv = prismUvCenter + (vUv - prismUvCenter) * vec2(-0.74, 0.82);
    secondUv -= baseOffset * 0.58;

    float redSample = mix(
      texture2D(uDial, lensUv + normalOffset * channelSpread).r,
      texture2D(uDial, secondUv + normalOffset * channelSpread * 1.7).r,
      0.12 + edgeFacet * 0.42
    );
    float greenSample = mix(
      texture2D(uDial, lensUv).g,
      texture2D(uDial, secondUv).g,
      0.1 + edgeFacet * 0.34
    );
    float blueSample = mix(
      texture2D(uDial, lensUv - normalOffset * channelSpread).b,
      texture2D(uDial, secondUv - normalOffset * channelSpread * 1.7).b,
      0.12 + edgeFacet * 0.42
    );
    vec3 refractedColor = vec3(redSample, greenSample, blueSample);

    vec2 reflectionUv = prismUvCenter - (vUv - prismUvCenter) * vec2(0.82, -0.76);
    reflectionUv -= baseOffset * 0.68;
    vec3 reflectedColor = texture2D(uDial, reflectionUv).bgr;
    float directCoreHit = traceShape(rayOrigin, rayDirection, true);
    float coreMask = directCoreHit > 0.0 ? 1.0 : 0.0;
    float coreFace = coreMask * faceFacet;
    vec3 coreHitPoint = rayOrigin + rayDirection * max(directCoreHit, 0.0);
    vec3 worldCoreNormal = normalize(rotateByQuaternion(coreNormal(coreHitPoint), uPrismQuaternion));

    vec3 keyDirection = normalize(vec3(-0.52, 0.71, 0.47));
    vec3 warmDirection = normalize(vec3(0.68, -0.28, 0.68));
    float keyHighlight = pow(max(dot(worldNormal, keyDirection), 0.0), 18.0);
    float knifeHighlight = pow(max(dot(reflect(-viewDirection, worldNormal), keyDirection), 0.0), 62.0);
    float warmHighlight = pow(max(dot(reflect(-viewDirection, worldNormal), warmDirection), 0.0), 34.0) * (0.32 + uCaustic * 0.68);
    vec3 shiftedCorePoint = coreHitPoint - vec3(-0.006, -0.003, -0.005);
    float coreEdgeMask = smoothstep(0.045, 0.078, max(abs(shiftedCorePoint.x), abs(shiftedCorePoint.y)));
    float coreWarmEdge = coreMask * coreEdgeMask * pow(max(dot(reflect(-viewDirection, worldCoreNormal), warmDirection), 0.0), 28.0);
    float fresnel = 0.055 + 0.945 * pow(1.0 - facing, 4.6);
    float bevelBands = pow(abs(sin((localHit.x - localHit.y + localHit.z) * 56.0)), 34.0) * edgeFacet * 0.12;
    vec3 spectralFacet = vec3(
      0.22 + 0.78 * smoothstep(-0.2, 0.72, worldNormal.x),
      0.34 + 0.66 * smoothstep(-0.65, 0.45, worldNormal.y),
      0.28 + 0.72 * smoothstep(-0.2, 0.72, -worldNormal.x)
    );
    vec3 interference = 0.5 + 0.5 * cos(
      vec3(0.0, 2.094, 4.188) +
      (localHit.x * 0.72 + localHit.y * 0.49 - localHit.z) * 94.0
    );
    vec2 shellFace = localHit.xy / 0.166;
    float shellRadius = max(abs(shellFace.x), abs(shellFace.y));
    float diagonalFacet = pow(
      max(1.0 - abs(abs(shellFace.x) - abs(shellFace.y)) * 2.3, 0.0),
      9.0
    ) * smoothstep(0.42, 0.96, shellRadius) * faceFacet;

    vec3 glassTint = vec3(0.34, 0.58, 0.64);
    vec3 environmentReflection =
      vec3(0.38, 0.43, 0.41) * pow(max(worldNormal.y, 0.0), 1.45) +
      vec3(0.065, 0.18, 0.21) * pow(abs(worldNormal.x), 0.82) +
      vec3(0.068, 0.088, 0.102) * pow(abs(worldNormal.z), 0.72) +
      vec3(0.075, 0.09, 0.1) * fresnelEdge;
    float upperLight = smoothstep(-0.42, 0.72, worldNormal.y) * (0.012 + 0.08 * edgeFacet);
    float thicknessGlow = smoothstep(0.08, 0.34, opticalThickness) * (edgeFacet * 0.28 + cornerFacet * 0.44);
    vec3 color = refractedColor * mix(0.98, 1.18, edgeFacet + cornerFacet * 0.45);
    color += environmentReflection * (0.42 + faceFacet * 0.72 + edgeFacet * 0.36);
    color += faceFacet * vec3(0.045, 0.062, 0.07);
    color += diagonalFacet * mix(interference, vec3(0.82, 0.93, 0.94), 0.52) * 0.34;
    color += reflectedColor * (fresnel * 0.2 + edgeFacet * 0.44 + cornerFacet * 0.28);
    color += glassTint * (0.008 + fresnel * 0.18 + keyHighlight * 0.24 + bevelBands + upperLight);
    color += edgeFacet * mix(spectralFacet, vec3(0.72, 0.92, 0.96), 0.48) * (0.38 + fresnelEdge * 0.5 + thicknessGlow);
    color += cornerFacet * mix(spectralFacet, vec3(1.0, 0.74, 0.35), uCaustic) * (0.56 + thicknessGlow);
    color += edgeFacet * interference * (0.035 + 0.11 * uDispersion);
    color += uCaustic * (edgeFacet * 0.38 + cornerFacet * 0.32) * vec3(0.74, 0.88, 0.9);
    color += knifeHighlight * vec3(0.96, 1.0, 1.0) * 1.25;
    color += warmHighlight * vec3(1.0, 0.34, 0.045) * 0.82;
    vec3 refractedSignal = max(refractedColor - vec3(0.055), vec3(0.0));
    vec3 reflectedSignal = max(reflectedColor - vec3(0.055), vec3(0.0));
    color = mix(color, vec3(0.0012, 0.0015, 0.0018), coreMask * 0.965);
    color += coreMask * (refractedSignal * 0.42 + reflectedSignal * 0.18);
    color += coreFace * fresnelEdge * vec3(0.045, 0.07, 0.075);
    color += coreWarmEdge * vec3(1.0, 0.22, 0.018) * uCaustic * 0.72;
    color += (hash21(gl_FragCoord.xy) - 0.5) * 0.01 * edgeFacet;

    float glassAlpha = clamp(0.7 + faceFacet * 0.06 + edgeFacet * 0.2 + cornerFacet * 0.12, 0.0, 1.0);
    glassAlpha = mix(glassAlpha, 1.0, coreMask);
    gl_FragColor = vec4(color, glassAlpha);
  }
`
