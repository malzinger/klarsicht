import type { Localized, StandardId } from '../shared/types'

export interface StandardProfile {
  readonly id: StandardId
  readonly label: Localized
  /** axe-core rule tags to run. */
  readonly tags: readonly string[]
  readonly note: Localized
}

const WCAG21 = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const
const WCAG22 = [...WCAG21, 'wcag22aa'] as const

export const STANDARDS: readonly StandardProfile[] = [
  {
    id: 'wcag22aa',
    label: { en: 'WCAG 2.2 AA', de: 'WCAG 2.2 AA' },
    tags: WCAG22,
    note: {
      en: 'Current W3C recommendation, conformance level AA.',
      de: 'Aktuelle W3C-Empfehlung, Konformitätsstufe AA.',
    },
  },
  {
    id: 'wcag21aa',
    label: { en: 'WCAG 2.1 AA · BFSG / EN 301 549', de: 'WCAG 2.1 AA · BFSG / EN 301 549' },
    tags: WCAG21,
    note: {
      en: 'The German Accessibility Strengthening Act (BFSG) references EN 301 549, which requires WCAG 2.1 level AA.',
      de: 'Das Barrierefreiheitsstärkungsgesetz verweist auf EN 301 549, die WCAG 2.1 Stufe AA verlangt.',
    },
  },
  {
    id: 'wcag22aa-bp',
    label: { en: 'WCAG 2.2 AA + best practices', de: 'WCAG 2.2 AA + Best Practices' },
    tags: [...WCAG22, 'best-practice'],
    note: {
      en: 'Adds axe best-practice rules such as heading order and landmark regions.',
      de: 'Ergänzt Best-Practice-Regeln von axe wie Überschriftenreihenfolge und Landmarken.',
    },
  },
]

export function getStandard(id: StandardId): StandardProfile {
  const found = STANDARDS.find((standard) => standard.id === id)
  if (!found) throw new Error(`Unknown standard "${id}"`)
  return found
}
