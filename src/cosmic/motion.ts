export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

export const decayVelocity = (value: number, decay: number, dt: number) =>
  value * Math.exp(-decay * dt)

export const getTravelSpeed = (scrollVelocity: number, reducedMotion: boolean) =>
  reducedMotion ? 0.16 : 0.42 + scrollVelocity * 3.9

export const wrapDepth = (value: number, near: number, far: number) => {
  if (value > near) return far
  if (value < far) return near
  return value
}

export const wrapDepthLoop = (value: number, near: number, far: number) => {
  const span = near - far
  if (span <= 0) return value
  return far + ((((value - far) % span) + span) % span)
}
