import { describe, expect, it } from 'vitest'
import type { Finding, Impact } from '../shared/types'
import { computeScore, sortFindings } from './score'

const finding = (impact: Impact, nodes: number): Pick<Finding, 'impact' | 'nodes'> => ({
  impact,
  nodes: Array.from({ length: nodes }, () => ({
    target: ['body'],
    html: '<p>',
    failureSummary: '',
  })),
})

describe('computeScore', () => {
  it('gives a clean page 100 and grade A', () => {
    expect(computeScore([])).toMatchObject({ score: 100, grade: 'A', penalty: 0 })
  })

  it('weights impact and scales elements logarithmically', () => {
    expect(computeScore([finding('minor', 1)]).score).toBe(99)
    expect(computeScore([finding('critical', 1)]).score).toBe(90)
    expect(computeScore([finding('critical', 8)]).score).toBe(60)
  })

  it('never drops below zero and counts elements', () => {
    const result = computeScore([
      finding('critical', 64),
      finding('serious', 64),
      finding('serious', 64),
    ])
    expect(result.score).toBe(0)
    expect(result.elements).toBe(192)
    expect(result.byImpact).toEqual({ critical: 1, serious: 2, moderate: 0, minor: 0 })
  })
})

describe('sortFindings', () => {
  it('orders by impact, then by affected elements', () => {
    const sorted = sortFindings([
      finding('minor', 9),
      finding('critical', 1),
      finding('serious', 2),
      finding('serious', 5),
    ])
    expect(sorted.map((f) => `${f.impact}:${f.nodes.length}`)).toEqual([
      'critical:1',
      'serious:5',
      'serious:2',
      'minor:9',
    ])
  })
})
