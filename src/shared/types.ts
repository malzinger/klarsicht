/** Types shared between the page agent (runs inside the inspected page) and the UI. */

export type Lang = 'en' | 'de'
export type Localized = Readonly<Record<Lang, string>>
export type Impact = 'critical' | 'serious' | 'moderate' | 'minor'
export type StandardId = 'wcag22aa' | 'wcag21aa' | 'wcag22aa-bp'

export interface ContrastData {
  readonly fgColor: string
  readonly bgColor: string
  readonly contrastRatio: number
  readonly expectedContrastRatio: string
  readonly fontSize: string
  readonly fontWeight: string
}

export interface FindingNode {
  /** CSS selector chain (one entry per shadow-DOM boundary). */
  readonly target: string[]
  readonly html: string
  readonly failureSummary: string
  readonly contrast?: ContrastData
}

export interface Finding {
  readonly id: string
  readonly impact: Impact
  readonly help: string
  readonly description: string
  readonly helpUrl: string
  readonly tags: string[]
  readonly nodes: FindingNode[]
}

export interface RuleSummary {
  readonly id: string
  readonly help: string
  readonly nodes: number
}

export interface ScanResult {
  readonly url: string
  readonly title: string
  readonly timestamp: string
  readonly lang: Lang
  readonly standard: StandardId
  readonly violations: Finding[]
  readonly passes: RuleSummary[]
  readonly incomplete: RuleSummary[]
  readonly elementCount: number
  readonly durationMs: number
}

export interface ScanOptions {
  readonly standard: StandardId
  readonly lang: Lang
}

export interface HighlightTarget {
  readonly selector: string[]
  readonly label: string
  readonly impact: Impact
}

/** API the agent exposes on `window.__klarsicht` inside the inspected page. */
export interface PageAgent {
  scan(options: ScanOptions): Promise<ScanResult>
  highlight(targets: HighlightTarget[]): void
  clear(): void
}

declare global {
  interface Window {
    __klarsicht?: PageAgent
  }
}
