import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadLandingFonts } from './fonts'

afterEach(() => vi.unstubAllGlobals())

describe('canvas font readiness', () => {
  it('waits for the Cyrillic, Latin and currency font faces before rasterizing', async () => {
    let complete: () => void = () => {}
    const load = vi.fn(() => new Promise<void>((resolve) => { complete = resolve }))
    vi.stubGlobal('document', { fonts: { load, ready: Promise.resolve() } })
    let ready = false
    const pending = loadLandingFonts().then(() => { ready = true })
    await Promise.resolve()
    expect(load).toHaveBeenCalledWith('400 16px "Manrope"', 'АаЁё₽ElevenHouse')
    expect(ready).toBe(false)
    complete()
    await pending
    expect(ready).toBe(true)
  })

  it('allows the system fallback if a webfont cannot load', async () => {
    vi.stubGlobal('document', { fonts: { load: vi.fn().mockRejectedValue(new Error('offline')), ready: Promise.resolve() } })
    await expect(loadLandingFonts()).resolves.toBeUndefined()
  })

  it('does not require a browser during server rendering', async () => {
    vi.stubGlobal('document', undefined)
    await expect(loadLandingFonts()).resolves.toBeUndefined()
  })
})
