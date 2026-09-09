import { describe, expect, it } from 'vitest'
import { accessFrame, ACCESS_DURATION, isAccessReadable } from './accessSequence'

describe('the entrance sequence', () => {
  it('starts with empty fields and types a character at a time', () => {
    expect(accessFrame(0)).toMatchObject({ name: '', email: '', code: '', screen: 'details' })
    expect(accessFrame(1285).name).toBe('А')
    expect(accessFrame(1370).name).toBe('Ал')
    expect(accessFrame(2300).email).toBe('')
  })
  it('finishes the contact before pressing the button and entering the code', () => {
    expect(accessFrame(4700)).toMatchObject({ name: 'Алиса Вега', email: 'alisa.vega@example.com', screen: 'details' })
    expect(accessFrame(5100).screen).toBe('code')
    expect(accessFrame(6250).code).toBe('2')
    expect(accessFrame(6500).code).toBe('20')
    expect(accessFrame(ACCESS_DURATION).screen).toBe('complete')
  })
  it('clamps overscroll, paused time, and restored completion', () => {
    expect(accessFrame(-20)).toEqual(accessFrame(0))
    expect(accessFrame(3000)).toEqual(accessFrame(3000))
    expect(accessFrame(1e6)).toEqual(accessFrame(ACCESS_DURATION))
  })
  it('plays an oversized form when enough of the available viewport is occupied', () => {
    expect(isAccessReadable({ top: 100, bottom: 700, height: 600 }, 300)).toBe(true)
    expect(isAccessReadable({ top: 850, bottom: 1150, height: 300 }, 844)).toBe(false)
    expect(isAccessReadable({ top: -650, bottom: -50, height: 600 }, 300)).toBe(false)
  })
})
