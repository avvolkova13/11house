export const HERO_TITLE_REVEAL_DURATION_MS = 700
export const HERO_TITLE_STAGGER_MS = 35

const HERO_TITLE_FOCUS_WINDOW = 0.2

export const getHeroTitleLetterDelay = (glyphIndex: number) => (
  Math.max(0, glyphIndex) * HERO_TITLE_STAGGER_MS
)

export const shouldRevealHeroTitle = (
  stageOffset: number,
  reducedMotion: boolean,
) => reducedMotion || Math.abs(stageOffset) <= HERO_TITLE_FOCUS_WINDOW
