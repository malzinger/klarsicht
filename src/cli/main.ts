/**
 * Command-line runner: opens pages in headless Chromium, injects the very same
 * engine and agent the extension uses, prints a summary and writes reports.
 * Used by the GitHub Action to gate pull requests on an accessibility score.
 */
import { existsSync } from 'node:fs'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { t } from '../core/i18n'
import { buildHtmlReport, buildJsonReport, buildMarkdownReport } from '../core/report'
import { computeScore, sortFindings } from '../core/score'
import { getStandard } from '../core/standards'
import { criteriaFor } from '../core/wcag'
import type { ScanOptions, ScanOutcome, ScanResult } from '../shared/types'
import { parseArgs, USAGE, type CliOptions } from './args'

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(here, '..', 'public')
const AXE = join(publicDir, 'axe.min.js')
const AGENT = join(publicDir, 'agent.js')

const slug = (url: string): string =>
  url
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'page'

async function scanUrl(url: string, options: CliOptions): Promise<ScanResult> {
  const browser = await chromium.launch({
    headless: true,
    ...(options.channel ? { channel: options.channel } : {}),
  })
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
    await page.waitForTimeout(750)
    await page.addScriptTag({ path: AXE })
    await page.addScriptTag({ path: AGENT })
    const scanOptions: ScanOptions = { standard: options.standard, lang: options.lang }
    const outcome = (await page.evaluate((opts) => window.__klarsicht?.scan(opts), scanOptions)) as
      ScanOutcome | undefined
    if (!outcome) throw new Error('The agent did not return a result')
    if ('error' in outcome) throw new Error(outcome.error)
    return outcome
  } finally {
    await browser.close()
  }
}

function printSummary(result: ScanResult, options: CliOptions): void {
  const { lang } = options
  const score = computeScore(result.violations)
  console.log(`\n${result.title || result.url}\n${result.url}`)
  console.log(
    `${t('result.score', lang)} ${score.score}/100 (${t(`grade.${score.grade}`, lang)}) · ${getStandard(result.standard).label[lang]} · ${result.durationMs} ms`,
  )
  const rows = sortFindings(result.violations).map((finding) => ({
    [t('report.impact', lang)]: t(`impact.${finding.impact}`, lang),
    [t('report.rule', lang)]: finding.help,
    [t('result.elements', lang)]: finding.nodes.length,
    WCAG: criteriaFor(finding.tags)
      .map((criterion) => criterion.number)
      .join(', '),
  }))
  if (rows.length > 0) console.table(rows)
  else console.log(t('result.clean', lang))
}

interface ReportFiles {
  readonly html: string
  readonly json: string
  readonly md: string
}

async function writeReports(
  result: ScanResult,
  options: CliOptions,
  index: number,
): Promise<ReportFiles> {
  await mkdir(options.out, { recursive: true })
  const base = join(options.out, `klarsicht-${index + 1}-${slug(result.url)}`)
  const files: ReportFiles = { html: `${base}.html`, json: `${base}.json`, md: `${base}.md` }
  await Promise.all([
    writeFile(files.html, buildHtmlReport(result, options.lang)),
    writeFile(files.json, buildJsonReport(result)),
    writeFile(files.md, buildMarkdownReport(result, options.lang, options.threshold)),
  ])
  return files
}

/** GitHub Actions reads step outputs from the file named in GITHUB_OUTPUT. */
async function setOutputs(values: Record<string, string>): Promise<void> {
  const file = process.env.GITHUB_OUTPUT
  if (!file) return
  await appendFile(
    file,
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(''),
  )
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2))
  if (options.help || options.urls.length === 0) {
    console.log(USAGE)
    return options.help ? 0 : 2
  }
  if (!existsSync(AXE) || !existsSync(AGENT)) {
    console.error('Agent bundle missing. Run `npm run build` first.')
    return 2
  }

  let lowest = 100
  let grade = 'A'
  const summaries: string[] = []
  for (const [index, url] of options.urls.entries()) {
    const result = await scanUrl(url, options)
    const score = computeScore(result.violations)
    if (score.score < lowest) {
      lowest = score.score
      grade = score.grade
    }
    printSummary(result, options)
    const files = await writeReports(result, options, index)
    summaries.push(files.md)
    console.log(`Reports: ${files.html}, ${files.json}, ${files.md}`)
  }

  const passed = lowest >= options.threshold
  const summary = join(options.out, 'klarsicht-summary.md')
  const parts = await Promise.all(summaries.map((file) => readFile(file, 'utf8')))
  await writeFile(summary, parts.join('\n\n'))
  await setOutputs({
    score: String(lowest),
    grade,
    passed: String(passed),
    summary,
    report_dir: options.out,
  })
  console.log(
    passed
      ? `\nPassed: lowest score ${lowest}, threshold ${options.threshold}`
      : `\nFailed: lowest score ${lowest} is below the threshold ${options.threshold}`,
  )
  return passed ? 0 : 1
}

main().then(
  (code) => {
    process.exitCode = code
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 2
  },
)
