export function getReducedMotionPreference(
  mediaMatches: boolean,
  search: string,
  development: boolean,
): boolean {
  return mediaMatches || (development && new URLSearchParams(search).has('reduced-motion'))
}

export function getPreviewPhase(search: string, development: boolean): number | null {
  if (!development) return null
  const rawValue = new URLSearchParams(search).get('phase')
  if (rawValue === null || rawValue.trim() === '') return null
  const value = Number(rawValue)
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : null
}
