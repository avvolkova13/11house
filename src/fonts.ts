/** Canvas does not automatically redraw when a CSS webfont replaces a fallback. */
export async function loadLandingFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    // The variable face shares all weights; this sample loads all three subsets.
    await document.fonts.load('400 16px "Manrope"', 'АаЁё₽ElevenHouse')
    await document.fonts.ready
  } catch {
    // Keep the page usable with the declared system fallback if loading fails.
  }
}
