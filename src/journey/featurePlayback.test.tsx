import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { featureStories } from './featureStories'
import { isStoryReadable, storyFrame, typedText } from './featurePlayback'
import { featureChoices, SourceFragment, type FeatureId } from './SourceFragments'

const renderBeat = (feature: FeatureId, index: number, progress: number) => {
  const beat = featureStories[feature].beats[index]
  return renderToStaticMarkup(<SourceFragment feature={feature} step={beat.tab} setStep={() => {}} guide={{ id: beat.id, progress, next: () => {}, finish: () => {} }} />)
}
describe('guided feature stories', () => {
  it('gives every menu choice a purpose, explained actions and an outcome', () => {
    for (const feature of featureChoices) {
      const story = featureStories[feature.id]
      expect(story.purpose.length).toBeGreaterThan(50)
      expect(story.outcome.length).toBeGreaterThan(40)
      expect(story.beats.length).toBeGreaterThan(1)
      for (const beat of story.beats) {
        expect(beat.body.length).toBeGreaterThan(50)
        expect(beat.duration).toBeGreaterThanOrEqual(7000)
        for (const progress of [0, .4, 1]) {
          expect(renderBeat(feature.id, story.beats.indexOf(beat), progress)).not.toMatch(/undefined|NaN|демонстра|\bдемо\b|<iframe|<img/)
        }
      }
    }
  })
  it('types then saves the client note instead of opening an already completed panel', () => {
    expect(renderBeat('client', 2, 0)).not.toContain('Обсудить первые шаги в собственной практике.')
    expect(renderBeat('client', 2, .9)).toContain('Обсудить первые шаги в собственной практике.')
    expect(renderBeat('client', 2, .9)).toContain('Заметка сохранена')
  })
  it('shows the result of rescheduling in the same appointment', () => {
    expect(renderBeat('calendar', 0, 1)).toContain('11:00 · 60 мин')
    expect(renderBeat('calendar', 2, 1)).toContain('14:00 · 60 мин')
  })
  it('keeps materials waiting until the AI text has been reviewed', () => {
    expect(renderBeat('automation', 0, 1)).toContain('Ожидает проверки')
    expect(renderBeat('automation', 2, 1)).toContain('Материалы переданы')
  })
  it('starts a product with empty inputs and ends with its saved card', () => {
    expect(renderBeat('products', 0, 0).match(/value=""/g)).toHaveLength(2)
    expect(renderBeat('products', 1, 1)).toContain('Натальный разбор')
  })
  it('accounts for the new payment and reveals the scheduled post status', () => {
    expect(renderBeat('practice', 0, 0)).toContain('63 700')
    expect(renderBeat('practice', 0, 1)).toContain('68 600')
    expect(renderBeat('content', 1, 1)).toContain('Запланировано')
  })
  it('clamps playback, changes beats at boundaries and stops after the final beat', () => {
    const beats = featureStories.client.beats
    expect(storyFrame(beats, -1).progress).toBe(0)
    expect(storyFrame(beats, beats[0].duration).index).toBe(1)
    expect(storyFrame(beats, 1e9)).toMatchObject({ index: beats.length - 1, progress: 1, done: true })
    expect(typedText('Марина', 0)).toBe('')
    expect(typedText('Марина', .4)).toBe('Мар')
    expect(typedText('Марина', 1)).toBe('Марина')
  })
  it('does not consume a story offscreen but supports a tall mobile fragment', () => {
    expect(isStoryReadable({ top: 900, bottom: 1500, height: 600 }, 844)).toBe(false)
    expect(isStoryReadable({ top: 100, bottom: 1000, height: 900 }, 740)).toBe(true)
    expect(isStoryReadable({ top: -700, bottom: 50, height: 750 }, 844)).toBe(false)
    expect(isStoryReadable({ top: 750, bottom: 1350, height: 600 }, 844, 700)).toBe(false)
    expect(isStoryReadable({ top: 300, bottom: 850, height: 550 }, 844, 290)).toBe(true)
  })
})
