/**
 * Page agent. Bundled as a classic script and injected into the inspected page
 * (extension) or a same-origin iframe (demo). Exposes `window.__klarsicht`.
 */
import type { Locale, NodeResult, Result, RunOptions } from 'axe-core'
import deLocale from 'axe-core/locales/de.json'
import { getStandard } from '../core/standards'
import type {
  ContrastData,
  Finding,
  FindingNode,
  HighlightTarget,
  Impact,
  PageAgent,
  RuleSummary,
  ScanOptions,
  ScanResult,
} from '../shared/types'

declare const axe: typeof import('axe-core')

const OVERLAY_ID = 'klarsicht-overlay-root'
const IMPACTS: readonly Impact[] = ['critical', 'serious', 'moderate', 'minor']
const COLORS: Record<Impact, string> = {
  critical: '#d92d20',
  serious: '#ef6820',
  moderate: '#ca8a04',
  minor: '#2e90fa',
}

const flatten = (target: unknown): string[] =>
  Array.isArray(target)
    ? target.flatMap((part) => (Array.isArray(part) ? part.map(String) : [String(part)]))
    : [String(target)]

function contrastOf(node: NodeResult): ContrastData | undefined {
  const check = node.any.find(
    (c) => c.id === 'color-contrast' || c.id === 'color-contrast-enhanced',
  )
  const data = check?.data as Partial<ContrastData> | undefined
  if (!data || typeof data.fgColor !== 'string' || typeof data.bgColor !== 'string')
    return undefined
  return {
    fgColor: data.fgColor,
    bgColor: data.bgColor,
    contrastRatio: Number(data.contrastRatio ?? 0),
    expectedContrastRatio: String(data.expectedContrastRatio ?? '4.5:1'),
    fontSize: String(data.fontSize ?? ''),
    fontWeight: String(data.fontWeight ?? ''),
  }
}

function toNode(node: NodeResult): FindingNode {
  const contrast = contrastOf(node)
  const html = node.html.length > 400 ? `${node.html.slice(0, 400)}…` : node.html
  return {
    target: flatten(node.target),
    html,
    failureSummary: node.failureSummary ?? '',
    ...(contrast ? { contrast } : {}),
  }
}

function toFinding(result: Result): Finding {
  const impact = IMPACTS.includes(result.impact as Impact) ? (result.impact as Impact) : 'minor'
  return {
    id: result.id,
    impact,
    help: result.help,
    description: result.description,
    helpUrl: result.helpUrl,
    tags: result.tags,
    nodes: result.nodes.map(toNode),
  }
}

const brief = (result: Result): RuleSummary => ({
  id: result.id,
  help: result.help,
  nodes: result.nodes.length,
})

async function scan(options: ScanOptions): Promise<ScanResult> {
  const started = performance.now()
  clear()
  if (options.lang === 'de') axe.configure({ locale: deLocale as unknown as Locale })
  else axe.reset()
  const runOptions: RunOptions = {
    runOnly: { type: 'tag', values: [...getStandard(options.standard).tags] },
    resultTypes: ['violations', 'incomplete', 'passes'],
  }
  const results = await axe.run(document, runOptions)
  return {
    url: location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    lang: options.lang,
    standard: options.standard,
    violations: results.violations.map(toFinding),
    passes: results.passes.map(brief),
    incomplete: results.incomplete.map(brief),
    elementCount: document.getElementsByTagName('*').length,
    durationMs: Math.round(performance.now() - started),
  }
}

/** Resolves an axe selector chain, descending into shadow roots. */
function resolve(parts: string[]): Element | null {
  let root: Document | ShadowRoot = document
  let element: Element | null = null
  for (const part of parts) {
    element = root.querySelector(part)
    if (!element) return null
    root = element.shadowRoot ?? root
  }
  return element
}

let current: HighlightTarget[] = []

function draw(): void {
  document.getElementById(OVERLAY_ID)?.remove()
  if (current.length === 0) return
  const root = document.createElement('div')
  root.id = OVERLAY_ID
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText =
    'position:absolute;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;font:600 11px/1.4 system-ui,sans-serif;'
  for (const target of current) {
    const element = resolve(target.selector)
    if (!element) continue
    const rect = element.getBoundingClientRect()
    const color = COLORS[target.impact]
    const box = document.createElement('div')
    box.style.cssText = `position:absolute;left:${rect.left + window.scrollX - 2}px;top:${rect.top + window.scrollY - 2}px;width:${rect.width + 4}px;height:${rect.height + 4}px;border:2px solid ${color};border-radius:4px;box-shadow:0 0 0 2px rgba(255,255,255,0.85);`
    const label = document.createElement('span')
    label.textContent = target.label
    label.style.cssText = `position:absolute;left:-2px;top:-20px;padding:2px 6px;border-radius:4px 4px 0 0;background:${color};color:#fff;white-space:nowrap;`
    if (rect.width >= 56) box.appendChild(label)
    root.appendChild(box)
  }
  document.body.appendChild(root)
}

function highlight(targets: HighlightTarget[]): void {
  current = targets
  const first = targets[0] ? resolve(targets[0].selector) : null
  first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  draw()
  window.addEventListener('resize', draw)
}

function clear(): void {
  current = []
  document.getElementById(OVERLAY_ID)?.remove()
  window.removeEventListener('resize', draw)
}

window.__klarsicht = { scan, highlight, clear } satisfies PageAgent
