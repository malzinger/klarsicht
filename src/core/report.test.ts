import { describe, expect, it } from 'vitest'
import type { ScanResult } from '../shared/types'
import {
  buildHtmlReport,
  buildJsonReport,
  buildMarkdownReport,
  buildSummary,
  escapeHtml,
} from './report'

const result: ScanResult = {
  url: 'https://example.com/shop',
  title: 'Demo <shop>',
  timestamp: '2026-09-03T12:00:00.000Z',
  lang: 'en',
  standard: 'wcag22aa',
  violations: [
    {
      id: 'image-alt',
      impact: 'critical',
      help: 'Images must have alternate text',
      description: 'Ensures img elements have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
      tags: ['wcag2a', 'wcag111'],
      nodes: [
        { target: ['img'], html: '<img src="x.jpg"><script>alert(1)</script>', failureSummary: '' },
      ],
    },
  ],
  passes: [{ id: 'html-has-lang', help: 'x', nodes: 1 }],
  incomplete: [],
  elementCount: 42,
  durationMs: 120,
}

describe('escapeHtml', () => {
  it('escapes markup and quotes', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    )
  })
})

describe('buildHtmlReport', () => {
  it('escapes page content and includes score, criteria and fixes', () => {
    const html = buildHtmlReport(result, 'en')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('Score 90/100')
    expect(html).toContain('WCAG 1.1.1 Non-text Content (A)')
    expect(html).toContain('alt=&quot;What the image shows&quot;')
    expect(html).toContain('<html lang="en">')
  })

  it('localises the report', () => {
    expect(buildHtmlReport(result, 'de')).toContain('Barrierefreiheits-Report')
  })
})

describe('buildJsonReport / buildSummary', () => {
  it('round-trips the result with tool metadata', () => {
    const parsed = JSON.parse(buildJsonReport(result)) as { tool: string; violations: unknown[] }
    expect(parsed.tool).toBe('Klarsicht')
    expect(parsed.violations).toHaveLength(1)
  })

  it('writes a compact text summary', () => {
    const summary = buildSummary(result, 'en')
    expect(summary).toContain('Score 90/100 (Good)')
    expect(summary).toContain('- [Critical] Images must have alternate text (1)')
  })
})

describe('buildMarkdownReport', () => {
  it('renders a marker, a table and the top fixes', () => {
    const md = buildMarkdownReport(result, 'en', 80)
    expect(md.startsWith('<!-- klarsicht-report -->')).toBe(true)
    expect(md).toContain('**Score 90/100 · Good ✅**')
    expect(md).toContain('| Critical | Images must have alternate text | 1 | 1.1.1 |')
    expect(md).toContain('<details><summary>How to fix</summary>')
    expect(md).toContain('alt="What the image shows"')
  })

  it('marks a failed threshold and escapes pipes', () => {
    const md = buildMarkdownReport({ ...result, title: 'A | B' }, 'de', 95)
    expect(md).toContain('❌')
    expect(md).toContain('A &#124; B')
    expect(md).toContain('Schwelle: 95')
  })
})
