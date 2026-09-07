import { describe, expect, it } from 'vitest'

import {
  WORKFLOW_REEL_DIGITS,
  buildWorkflowReel,
  getWorkflowMetricColumns,
  parseWorkflowMetric,
} from './workflowMetricModel'

describe('parseWorkflowMetric', () => {
  it('separates the approved values into prefix, rolling digits, and suffix', () => {
    expect(parseWorkflowMetric('−12 ч')).toEqual({
      prefix: '−',
      digits: [1, 2],
      suffix: 'ч',
    })
    expect(parseWorkflowMetric('×3')).toEqual({
      prefix: '×',
      digits: [3],
      suffix: '',
    })
    expect(parseWorkflowMetric('+34%')).toEqual({
      prefix: '+',
      digits: [3, 4],
      suffix: '%',
    })
  })

  it('fails closed when a value contains no rolling digit', () => {
    expect(parseWorkflowMetric('нет данных')).toEqual({
      prefix: '',
      digits: [],
      suffix: 'нет данных',
    })
  })
})

describe('buildWorkflowReel', () => {
  it('builds three complete 0–9 turns like the reference odometer', () => {
    expect(WORKFLOW_REEL_DIGITS).toHaveLength(30)
    expect(WORKFLOW_REEL_DIGITS.slice(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(WORKFLOW_REEL_DIGITS.slice(10, 20)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(WORKFLOW_REEL_DIGITS.slice(20, 30)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('stops in the second turn after one complete revolution', () => {
    expect(buildWorkflowReel(0).stopEm).toBe('-9.5em')
    expect(buildWorkflowReel(3).stopEm).toBe('-12.35em')
    expect(buildWorkflowReel(7).stopEm).toBe('-16.15em')
  })

  it('rejects values outside one decimal digit', () => {
    expect(() => buildWorkflowReel(-1)).toThrow('Workflow reel digit must be an integer from 0 to 9')
    expect(() => buildWorkflowReel(10)).toThrow('Workflow reel digit must be an integer from 0 to 9')
  })
})

describe('getWorkflowMetricColumns', () => {
  it('matches the measured Cipher rail widths at the left, center, and right', () => {
    expect(getWorkflowMetricColumns(-1)).toEqual([35.02, 34.1, 30.88])
    expect(getWorkflowMetricColumns(0)).toEqual([33.333, 33.334, 33.333])
    expect(getWorkflowMetricColumns(1)).toEqual([31.49, 32.41, 36.1])
  })

  it('clamps pointer positions beyond the rail edges', () => {
    expect(getWorkflowMetricColumns(-2)).toEqual(getWorkflowMetricColumns(-1))
    expect(getWorkflowMetricColumns(2)).toEqual(getWorkflowMetricColumns(1))
  })
})
