import type { HighlightTarget, ScanOptions, ScanResult } from '../shared/types'

export interface PageTarget {
  readonly title: string
  readonly url: string
}

/**
 * The UI never talks to a page directly. The extension adapter injects the
 * agent with chrome.scripting, the demo adapter drives a same-origin iframe.
 */
export interface PageAdapter {
  readonly kind: 'extension' | 'demo'
  getTarget(): Promise<PageTarget>
  scan(options: ScanOptions): Promise<ScanResult>
  highlight(targets: HighlightTarget[]): Promise<void>
  clear(): Promise<void>
}
