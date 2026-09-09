import type { StoryBeat } from './featureStories'

export type SourceGuide = { id: string; progress: number; next: () => void; finish: () => void }
export const rangeProgress = (progress: number, start = 0, end = 1) => Math.max(0, Math.min(1, (progress - start) / (end - start)))
export const typedText = (text: string, progress: number, start = .12, end = .64) => text.slice(0, Math.floor(text.length * rangeProgress(progress, start, end)))
export function storyFrame(beats: StoryBeat[], time: number) {
  const total = beats.reduce((sum, beat) => sum + beat.duration, 0)
  const clamped = Math.max(0, Math.min(total, time))
  let start = 0
  for (let index = 0; index < beats.length; index++) {
    const end = start + beats[index].duration
    if (clamped < end || index === beats.length - 1) return { index, progress: (clamped - start) / beats[index].duration, done: clamped === total, start, total }
    start = end
  }
  throw new Error('A feature story needs at least one beat')
}
export function isStoryReadable(rect: { top: number; bottom: number; height: number }, viewport: number, topInset = 96) {
  const available = Math.max(1, viewport - topInset)
  if (available < Math.min(260, viewport * .4)) return false
  const visible = Math.max(0, Math.min(rect.bottom, viewport) - Math.max(rect.top, topInset))
  return rect.height > 0 && visible >= Math.min(rect.height, available) * .55
}
