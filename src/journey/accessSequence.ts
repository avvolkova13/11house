export const ACCESS_DURATION = 8000
export function isAccessReadable(rect: { top: number; bottom: number; height: number }, viewport: number) {
  if (rect.height <= 0) return false
  const available = Math.max(1, viewport - 90)
  const shown = Math.max(0, Math.min(rect.bottom, viewport) - Math.max(rect.top, 90))
  return shown >= Math.min(rect.height, available) * .7
}
const typed = (text: string, time: number, start: number, interval: number) => text.slice(0, Math.max(0, Math.floor((time - start) / interval)))

export function accessFrame(elapsed: number) {
  const time = Math.max(0, Math.min(ACCESS_DURATION, elapsed))
  return {
    screen: time < 5100 ? 'details' as const : time < ACCESS_DURATION ? 'code' as const : 'complete' as const,
    name: typed('Алиса Вега', time, 1200, 85),
    email: typed('alisa.vega@example.com', time, 2500, 80),
    code: typed('2048', time, 6000, 250),
    focus: time >= 1200 && time < 2300 ? 'name' : time >= 2500 && time < 4500 ? 'email' : time >= 6000 && time < 7200 ? 'code' : '',
    pressing: time >= 4840 && time < 5100 || time >= 7700 && time < ACCESS_DURATION,
  }
}
