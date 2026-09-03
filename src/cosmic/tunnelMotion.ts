export type TunnelPhase = {
  terrain: number
  collapse: number
  dive: number
}

export type TunnelMotionInput = {
  mix: number
  presentation?: number
  dive?: number
  velocity: number
  pointerX: number
  pointerY: number
  reducedMotion: boolean
}

export type TunnelMotionState = TunnelPhase & {
  vanishingX: number
  vanishingY: number
  openingScale: number
  starOpacity: number
  travelImpulse: number
  particleStretch: number
  roll: number
  cameraX: number
  cameraY: number
  cameraZ: number
  contourFrequency: number
  haloDensity: number
}

export type SurfacePointInput = {
  x: number
  y: number
  mix: number
  presentation?: number
  dive?: number
  elapsed: number
  travel: number
}

export type TunnelPoint = {
  x: number
  y: number
  z: number
}

export type TunnelViewportFraming = {
  cameraScale: number
  worldX: number
  worldY: number
  yaw: number
}

const clamp = (value: number, min: number, max: number) => (
  Math.min(Math.max(value, min), max)
)

const clamp01 = (value: number) => clamp(value, 0, 1)

const smoothstep = (start: number, end: number, value: number) => {
  const progress = clamp01((value - start) / Math.max(end - start, Number.EPSILON))
  return progress * progress * (3 - 2 * progress)
}

const mixValue = (from: number, to: number, progress: number) => (
  from + (to - from) * progress
)

export const getTunnelViewportFraming = (width: number): TunnelViewportFraming => (
  width < 700
    ? { cameraScale: 0.18, worldX: -12, worldY: -8, yaw: -0.06 }
    : { cameraScale: 1, worldX: 0, worldY: 0, yaw: 0.035 }
)

export const getTunnelPhase = (mix: number): TunnelPhase => {
  const progress = clamp01(mix)
  const collapse = smoothstep(0.18, 0.72, progress)

  return {
    terrain: 1 - collapse,
    collapse,
    dive: smoothstep(0.68, 1, progress),
  }
}

export const getTunnelMotion = ({
  mix,
  presentation: presentationInput = 0,
  dive: diveInput = 0,
  velocity,
  pointerX,
  pointerY,
  reducedMotion,
}: TunnelMotionInput): TunnelMotionState => {
  const progress = clamp01(mix)
  const presentation = clamp01(presentationInput)
  const flight = clamp01(diveInput)
  const phase = getTunnelPhase(progress)
  const signedVelocity = clamp(velocity, -14, 14)
  const pointerInfluence = reducedMotion ? 0 : phase.collapse
  const cameraFlight = reducedMotion ? 0 : flight

  return {
    ...phase,
    vanishingX: 36 + pointerX * 3.2 * pointerInfluence,
    vanishingY: 31 + pointerY * 2.1 * pointerInfluence,
    openingScale: mixValue(1.28, 0.88, phase.dive) * mixValue(1, 0.82, presentation),
    starOpacity: mixValue(1, 0.28, phase.dive) * mixValue(1, 0.68, presentation),
    travelImpulse: reducedMotion
      ? 0
      : signedVelocity * progress * mixValue(0.62, 1.85, phase.dive)
        * mixValue(1, 1.48, flight),
    particleStretch: reducedMotion
      ? 1
      : 1 + Math.abs(signedVelocity) * 0.095 * phase.collapse
        * mixValue(1, 1.34, flight),
    roll: reducedMotion
      ? 0
      : clamp(
        signedVelocity * 0.0026
          + pointerX * 0.004
          + Math.sin(flight * Math.PI) * 0.009 * presentation,
        -0.035,
        0.035,
      ),
    cameraX: cameraFlight === 0
      ? 0
      : cameraFlight * -4.2 - Math.sin(cameraFlight * Math.PI) * 0.55,
    cameraY: cameraFlight === 0
      ? 0
      : cameraFlight * -3.8 - Math.sin(cameraFlight * Math.PI * 0.8) * 0.36,
    cameraZ: cameraFlight === 0 ? 0 : cameraFlight * -18,
    contourFrequency: mixValue(112, 120, presentation),
    haloDensity: mixValue(0.16, 0.72, presentation),
  }
}

export const sampleSurfacePoint = ({
  x,
  y,
  mix,
  presentation: presentationInput = 0,
  dive: diveInput = 0,
  elapsed,
  travel,
}: SurfacePointInput): TunnelPoint => {
  const lane = clamp(x / 76, -1, 1)
  const depth = clamp01((y + 132.5) / 265)
  const phase = getTunnelPhase(mix)
  const presentation = clamp01(presentationInput)
  const dive = clamp01(diveInput)
  const depthEase = Math.pow(depth, 0.92)
  const flow = travel * 0.035
  const twist = depthEase * 2.55
    + Math.sin(depth * 8.6 + elapsed * 0.12 + flow + dive * 2.8) * 0.24
    - presentation * depth * 0.34
  const angle = lane * Math.PI + twist - Math.PI * 0.5
  const breathing = Math.sin(elapsed * 0.31 + depth * 5.7) * 0.018
  const angularNoise = Math.sin(angle * 3 + depth * 8.2) * 0.105
    + Math.sin(angle * 7 - depth * 13.7) * 0.044
    + Math.sin(angle * 11 + depth * 4.1) * 0.022
  const radius = mixValue(79, 5.8, depthEase)
    * mixValue(1, 0.82, phase.dive)
    * (1 + angularNoise + breathing)
  const bendX = 50 * Math.pow(depth, 1.42)
    + Math.sin(depth * 5.1 + elapsed * 0.08) * 2.1 * depth
  const bendZ = 62 * Math.pow(depth, 1.32)
    + Math.cos(depth * 4.3 - elapsed * 0.07) * 1.5 * depth
  const tunnelX = bendX + Math.cos(angle) * radius
  const tunnelZ = bendZ + Math.sin(angle) * radius * 0.74
  const finalDepth = depth
  const finalDepthEase = Math.pow(finalDepth, 0.82)
  const finalTwist = finalDepthEase * 2.34
    + Math.sin(finalDepth * 8.1 + elapsed * 0.12 + flow + dive * 2.1) * 0.22
    - finalDepth * 0.23
  const finalAngle = lane * Math.PI + finalTwist - Math.PI * 0.5
  const finalAngularNoise = Math.sin(finalAngle * 3 + finalDepth * 7.8) * 0.048
    + Math.sin(finalAngle * 7 - finalDepth * 12.7) * 0.022
    + Math.sin(finalAngle * 11 + finalDepth * 4.4) * 0.01
  const finalRadius = mixValue(88, 4.6, finalDepthEase)
    * (1 + finalAngularNoise + breathing * 0.7)
  const finalBendX = -12 + 84 * Math.pow(finalDepth, 1.35)
    + Math.sin(finalDepth * 4.7 + elapsed * 0.07) * 1.25 * finalDepth
  const finalBendZ = -10 + 75 * Math.pow(finalDepth, 1.28)
    + Math.cos(finalDepth * 4.1 - elapsed * 0.06) * 0.9 * finalDepth
  const referenceScale = mixValue(0.52, 0.46, dive)
  const referenceTunnelX = finalBendX + Math.cos(finalAngle) * finalRadius * referenceScale
  const referenceTunnelZ = finalBendZ
    + Math.sin(finalAngle) * finalRadius * 0.72 * referenceScale
  const presentedTunnelX = mixValue(tunnelX, referenceTunnelX, presentation)
  const presentedTunnelZ = mixValue(tunnelZ, referenceTunnelZ, presentation)
  const terrainZ = Math.sin(x * 0.08 + y * 0.025) * 2.2
    + Math.sin(x * 0.035 - y * 0.061) * 1.1
  const formation = phase.collapse

  return {
    x: mixValue(x, presentedTunnelX, formation),
    y,
    z: mixValue(terrainZ, presentedTunnelZ, formation),
  }
}
