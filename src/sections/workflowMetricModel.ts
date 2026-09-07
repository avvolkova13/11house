export type WorkflowMetricParts = {
  prefix: string
  digits: number[]
  suffix: string
}

const REEL_LINE_HEIGHT_EM = 0.95
const REEL_TARGET_CYCLE = 10
const LEFT_COLUMNS = [35.02, 34.1, 30.88] as const
const CENTER_COLUMNS = [33.333, 33.334, 33.333] as const
const RIGHT_COLUMNS = [31.49, 32.41, 36.1] as const

export const WORKFLOW_REEL_DIGITS = Array.from(
  { length: 30 },
  (_, index) => index % 10,
)

function interpolateColumn(start: number, end: number, progress: number) {
  return Number((start + (end - start) * progress).toFixed(3))
}

export function getWorkflowMetricColumns(position: number): readonly [number, number, number] {
  const clampedPosition = Math.max(-1, Math.min(1, position))
  const start = clampedPosition < 0 ? LEFT_COLUMNS : CENTER_COLUMNS
  const end = clampedPosition < 0 ? CENTER_COLUMNS : RIGHT_COLUMNS
  const progress = clampedPosition < 0 ? clampedPosition + 1 : clampedPosition
  const first = interpolateColumn(start[0], end[0], progress)
  const second = interpolateColumn(start[1], end[1], progress)

  return [first, second, Number((100 - first - second).toFixed(3))]
}

export function parseWorkflowMetric(value: string): WorkflowMetricParts {
  const match = value.trim().match(/^([^0-9]*)([0-9]+)(.*)$/u)

  if (!match) {
    return {
      prefix: '',
      digits: [],
      suffix: value.trim(),
    }
  }

  return {
    prefix: match[1].trim(),
    digits: [...match[2]].map(Number),
    suffix: match[3].trim(),
  }
}

export function buildWorkflowReel(digit: number) {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
    throw new Error('Workflow reel digit must be an integer from 0 to 9')
  }

  const stop = (REEL_TARGET_CYCLE + digit) * REEL_LINE_HEIGHT_EM

  return {
    digits: WORKFLOW_REEL_DIGITS,
    stopEm: `${-Number(stop.toFixed(2))}em`,
  }
}
