/**
 * Demonstration chart, geocentric tropical longitudes.
 * Planet positions are interpolated to 07:00 UTC from the 03:40 UTC positions
 * and daily speeds published by the NASA JPL DE440S-backed ephemeris:
 * https://astrolog-app.com/en/ephemeris?date=2026-09-07
 *
 * Ascendant 220.333° uses JD 2461290.7916666665, local sidereal time
 * 151.9802346°, obliquity 23.4367°, and the coordinates below.
 */
export type NatalBody = Readonly<{
  id:
    | 'sun'
    | 'moon'
    | 'mercury'
    | 'venus'
    | 'mars'
    | 'jupiter'
    | 'saturn'
    | 'uranus'
    | 'neptune'
    | 'pluto'
  glyph: string
  longitude: number
  retrograde?: boolean
}>

export type NatalChart = Readonly<{
  utcIso: string
  localLabel: string
  location: Readonly<{ latitude: number; longitude: number }>
  ascendant: number
  bodies: readonly NatalBody[]
}>

export const NATAL_CHART: NatalChart = {
  utcIso: '2026-09-07T07:00:00.000Z',
  localLabel: '7 сентября 2026, 12:00 · Екатеринбург',
  location: { latitude: 56.8389, longitude: 60.6057 },
  ascendant: 220.333,
  bodies: [
    { id: 'sun', glyph: '☉', longitude: 164.685 },
    { id: 'moon', glyph: '☽', longitude: 114.138 },
    { id: 'mercury', glyph: '☿', longitude: 174.144 },
    { id: 'venus', glyph: '♀', longitude: 207.916 },
    { id: 'mars', glyph: '♂', longitude: 107.354 },
    { id: 'jupiter', glyph: '♃', longitude: 134.996 },
    { id: 'saturn', glyph: '♄', longitude: 13.292, retrograde: true },
    { id: 'uranus', glyph: '♅', longitude: 65.69 },
    { id: 'neptune', glyph: '♆', longitude: 3.497, retrograde: true },
    { id: 'pluto', glyph: '♇', longitude: 303.397, retrograde: true },
  ],
}
