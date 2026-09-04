import type { Lang, ScanResult } from '../shared/types'
import { getFix } from './fixes'
import { t } from './i18n'
import { computeScore, sortFindings } from './score'
import { getStandard } from './standards'
import { criteriaFor } from './wcag'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

export function buildJsonReport(result: ScanResult): string {
  return JSON.stringify({ tool: 'Klarsicht', version: '0.1.1', ...result }, null, 2)
}

/** Plain-text summary for the clipboard. */
export function buildSummary(result: ScanResult, lang: Lang): string {
  const score = computeScore(result.violations)
  const lines = sortFindings(result.violations).map(
    (finding) =>
      `- [${t(`impact.${finding.impact}`, lang)}] ${finding.help} (${finding.nodes.length})`,
  )
  return [
    `${t('report.title', lang)}: ${result.title || result.url}`,
    `${t('result.score', lang)} ${score.score}/100 (${t(`grade.${score.grade}`, lang)}) · ${getStandard(result.standard).label[lang]}`,
    ...lines,
    `${t('report.generated', lang)} · ${result.url}`,
  ].join('\n')
}

/** Self-contained HTML report, safe to open in a new tab or send around. */
export function buildHtmlReport(result: ScanResult, lang: Lang): string {
  const score = computeScore(result.violations)
  const standard = getStandard(result.standard)
  const sections = sortFindings(result.violations)
    .map((finding) => {
      const first = finding.nodes[0]
      const fix = first ? getFix(finding, first, lang) : null
      const criteria = criteriaFor(finding.tags)
        .map((c) => `WCAG ${c.number} ${c.name[lang]} (${c.level})`)
        .join(' · ')
      const nodes = finding.nodes
        .map((node) => `<li><code>${escapeHtml(node.html)}</code></li>`)
        .join('')
      return `<section class="finding ${finding.impact}">
<h2><span class="chip">${t(`impact.${finding.impact}`, lang)}</span> ${escapeHtml(finding.help)} <small>${finding.nodes.length}</small></h2>
<p>${escapeHtml(finding.description)}</p>
${criteria ? `<p class="crit">${escapeHtml(criteria)}</p>` : ''}
${fix ? `<p><strong>${t('section.fix', lang)}:</strong> ${escapeHtml(fix.summary)}</p>` : ''}
${fix?.code ? `<pre>${escapeHtml(fix.code)}</pre>` : ''}
<details><summary>${t('section.elements', lang)} (${finding.nodes.length})</summary><ol>${nodes}</ol></details>
</section>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t('report.title', lang)} · ${escapeHtml(result.title || result.url)}</title>
<style>
body{margin:0;padding:32px;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#17171a;background:#f4f2ee}
main{max-width:880px;margin:0 auto}
h1{font-size:28px;margin:0 0 4px}
.meta{color:#62626b;font-size:14px;margin:0 0 24px}
.score{display:inline-block;padding:10px 16px;border-radius:12px;background:#17171a;color:#f4f2ee;font-weight:700;margin-bottom:24px}
.finding{background:#fff;border:1px solid #e6e2db;border-radius:14px;padding:18px 20px;margin:0 0 14px}
.finding h2{font-size:17px;margin:0 0 8px;display:flex;align-items:center;gap:10px}
.finding h2 small{margin-left:auto;color:#62626b;font-weight:500}
.chip{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;color:#fff;background:#62626b}
.critical .chip{background:#d92d20}.serious .chip{background:#ef6820}.moderate .chip{background:#ca8a04}.minor .chip{background:#2e90fa}
.crit{font-size:13px;color:#62626b}
pre,code{font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
pre{background:#f7f5f1;border-radius:8px;padding:10px 12px;overflow:auto}
code{word-break:break-all}
details{margin-top:8px}summary{cursor:pointer;color:#62626b}
ol{padding-left:20px}li{margin:6px 0}
footer{margin-top:32px;color:#9a9aa3;font-size:13px}
</style>
</head>
<body>
<main>
<h1>${t('report.title', lang)}</h1>
<p class="meta">${t('report.page', lang)}: <a href="${escapeHtml(result.url)}">${escapeHtml(result.title || result.url)}</a><br>
${t('report.date', lang)}: ${escapeHtml(new Date(result.timestamp).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB'))} · ${t('report.standard', lang)}: ${escapeHtml(standard.label[lang])} · ${t('report.duration', lang)}: ${result.durationMs} ms</p>
<div class="score">${t('result.score', lang)} ${score.score}/100 · ${t(`grade.${score.grade}`, lang)}</div>
<p class="meta">${result.violations.length} ${t('result.rules', lang)} · ${score.elements} ${t('result.elements', lang)} · ${result.passes.length} ${t('result.passes', lang)} · ${result.incomplete.length} ${t('result.incomplete', lang)}</p>
${sections || `<p>${t('result.clean', lang)}</p>`}
<footer>${t('report.generated', lang)} · ${t('footer.engine', lang)}</footer>
</main>
</body>
</html>`
}
