import type { Finding, Impact } from '../shared/types'

export const IMPACTS: readonly Impact[] = ['critical', 'serious', 'moderate', 'minor']
export type Grade = 'A' | 'B' | 'C' | 'D'

/** Penalty per failing rule; repeated elements add logarithmically, not linearly. */
const WEIGHT: Record<Impact, number> = { critical: 10, serious: 5, moderate: 2, minor: 1 }

export interface Score {
  readonly score: number
  readonly grade: Grade
  readonly penalty: number
  readonly byImpact: Record<Impact, number>
  readonly elements: number
}

/**
 * 100 minus a penalty: every failing rule costs its impact weight, multiplied by
 * 1 + log2(affected elements). A page with one critical rule on eight elements
 * loses 10 × 4 = 40 points; one minor rule on one element loses a single point.
 */
export function computeScore(violations: readonly Pick<Finding, 'impact' | 'nodes'>[]): Score {
  const byImpact: Record<Impact, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  let penalty = 0
  let elements = 0
  for (const violation of violations) {
    const count = Math.max(1, violation.nodes.length)
    byImpact[violation.impact] += 1
    elements += violation.nodes.length
    penalty += WEIGHT[violation.impact] * (1 + Math.log2(count))
  }
  const score = Math.max(0, Math.round(100 - penalty))
  const grade: Grade = score >= 95 ? 'A' : score >= 80 ? 'B' : score >= 60 ? 'C' : 'D'
  return { score, grade, penalty: Math.round(penalty * 10) / 10, byImpact, elements }
}

/** Orders findings by impact, then by number of affected elements. */
export function sortFindings<T extends Pick<Finding, 'impact' | 'nodes'>>(
  findings: readonly T[],
): T[] {
  return [...findings].sort(
    (a, b) =>
      IMPACTS.indexOf(a.impact) - IMPACTS.indexOf(b.impact) || b.nodes.length - a.nodes.length,
  )
}
