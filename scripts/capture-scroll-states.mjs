import { mkdir, writeFile } from 'node:fs/promises'

const endpoint = process.env.ELEVENHOUSE_CDP_ENDPOINT ?? 'http://127.0.0.1:9251'
const outputDirectory = process.env.ELEVENHOUSE_CAPTURE_DIR ?? '/private/tmp/elevenhouse-scroll-states'
const width = Number(process.env.ELEVENHOUSE_CAPTURE_WIDTH ?? 1440)
const height = Number(process.env.ELEVENHOUSE_CAPTURE_HEIGHT ?? 900)
const captureUrl = process.env.ELEVENHOUSE_CAPTURE_URL
const stages = (process.env.ELEVENHOUSE_CAPTURE_STAGES ?? '0,760,1520,2280,3040,3800,4560,5505')
  .split(',')
  .map(Number)

const targets = await fetch(`${endpoint}/json`).then((response) => response.json())
const target = targets.find((candidate) => (
  candidate.type === 'page' && candidate.url.startsWith('http://127.0.0.1:5188/')
))

if (!target) throw new Error('ElevenHouse page target was not found')

await mkdir(outputDirectory, { recursive: true })

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let requestId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data))
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message))
  else resolve(message.result)
})

const send = (method, params = {}) => new Promise((resolve, reject) => {
  requestId += 1
  pending.set(requestId, { resolve, reject })
  socket.send(JSON.stringify({ id: requestId, method, params }))
})

await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: false,
})
if (captureUrl) {
  await send('Page.navigate', { url: captureUrl })
} else {
  await send('Page.reload', { ignoreCache: true })
}
await new Promise((resolve) => setTimeout(resolve, 900))

for (let index = 0; index < stages.length; index += 1) {
  const scrollY = stages[index]
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' })`,
  })
  await new Promise((resolve) => setTimeout(resolve, 420))
  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  const path = `${outputDirectory}/stage-${index}.png`
  await writeFile(path, Buffer.from(screenshot.data, 'base64'))

  const state = await send('Runtime.evaluate', {
    expression: `JSON.stringify({ scrollY: window.scrollY, title: document.title, bodyHeight: document.body.scrollHeight })`,
    returnByValue: true,
  })
  console.log(path, state.result.value)
}

socket.close()
