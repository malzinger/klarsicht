import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PageAdapter, PageTarget } from '../adapters/types'
import { errorText, t, type StringKey } from '../core/i18n'
import { buildHtmlReport, buildJsonReport, buildSummary } from '../core/report'
import { computeScore, IMPACTS, sortFindings } from '../core/score'
import { getStandard, STANDARDS } from '../core/standards'
import type { Finding, HighlightTarget, Lang, ScanResult, StandardId } from '../shared/types'
import { FindingCard } from './FindingCard'
import { ScoreRing } from './ScoreRing'

const LANG_KEY = 'klarsicht.lang'
const STANDARD_KEY = 'klarsicht.standard'
const LANGS: readonly Lang[] = ['en', 'de']

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return allowed.includes(value as T) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

function persist(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable, keep going
  }
}

type Status =
  | { kind: 'idle' }
  | { kind: 'scanning' }
  | { kind: 'done'; result: ScanResult }
  | { kind: 'error'; code: string }

const toTargets = (findings: readonly Finding[]): HighlightTarget[] =>
  findings.flatMap((finding) =>
    finding.nodes.map((node) => ({
      selector: node.target,
      label: finding.id,
      impact: finding.impact,
    })),
  )

interface PanelProps {
  adapter: PageAdapter
  compact?: boolean
  /** Scan and highlight everything on mount (demo links, screenshots). */
  autoScan?: boolean
}

export function Panel({ adapter, compact = false, autoScan = false }: PanelProps) {
  const [lang, setLang] = useState<Lang>(() =>
    readStored(LANG_KEY, LANGS, navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'),
  )
  const [standard, setStandard] = useState<StandardId>(() =>
    readStored(
      STANDARD_KEY,
      STANDARDS.map((s) => s.id),
      'wcag22aa',
    ),
  )
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [target, setTarget] = useState<PageTarget | null>(null)
  const [activeRule, setActiveRule] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const tr = useCallback((key: StringKey) => t(key, lang), [lang])

  useEffect(() => persist(LANG_KEY, lang), [lang])
  useEffect(() => persist(STANDARD_KEY, standard), [standard])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(id)
  }, [toast])

  const scan = useCallback(async () => {
    setStatus({ kind: 'scanning' })
    setActiveRule(null)
    try {
      setTarget(await adapter.getTarget().catch(() => null))
      const result = await adapter.scan({ standard, lang })
      setStatus({ kind: 'done', result })
    } catch (error) {
      setStatus({ kind: 'error', code: error instanceof Error ? error.message : 'generic' })
    }
  }, [adapter, standard, lang])

  const highlight = useCallback(
    async (findings: readonly Finding[], rule: string | null) => {
      await adapter.highlight(toTargets(findings))
      setActiveRule(rule)
    },
    [adapter],
  )
  const clear = useCallback(async () => {
    await adapter.clear()
    setActiveRule(null)
  }, [adapter])

  const result = status.kind === 'done' ? status.result : null
  const score = useMemo(() => (result ? computeScore(result.violations) : null), [result])
  const findings = useMemo(() => (result ? sortFindings(result.violations) : []), [result])

  const autoRan = useRef(false)
  useEffect(() => {
    if (!autoScan || autoRan.current) return
    autoRan.current = true
    void scan()
  }, [autoScan, scan])
  const autoHighlighted = useRef(false)
  useEffect(() => {
    if (!autoScan || !result || autoHighlighted.current) return
    autoHighlighted.current = true
    void highlight(findings, '*')
  }, [autoScan, result, findings, highlight])

  const exportHtml = () => {
    if (!result) return
    const blob = new Blob([buildHtmlReport(result, lang)], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank', 'noopener')
  }
  const exportJson = () => {
    if (!result) return
    const url = URL.createObjectURL(
      new Blob([buildJsonReport(result)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `klarsicht-${new Date(result.timestamp).toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const copySummary = async () => {
    if (!result) return
    await navigator.clipboard.writeText(buildSummary(result, lang))
    setToast(tr('copy.done'))
  }

  const scanLabel =
    status.kind === 'scanning'
      ? tr('state.scanning')
      : result
        ? tr('action.rescan')
        : tr('action.scan')

  return (
    <div className={`panel${compact ? ' panel--compact' : ''}`}>
      <header className="panel__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            K
          </span>
          <div>
            <strong>{tr('app.name')}</strong>
            <span className="brand__sub">{tr('app.tagline')}</span>
          </div>
        </div>
        <div className="lang" role="group" aria-label={tr('lang.label')}>
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              className={`lang__btn${lang === code ? ' is-active' : ''}`}
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="controls">
        <label className="select">
          <span>{tr('standard.label')}</span>
          <select
            value={standard}
            onChange={(event) => setStandard(event.target.value as StandardId)}
          >
            {STANDARDS.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label[lang]}
              </option>
            ))}
          </select>
        </label>
        <p className="controls__note">{getStandard(standard).note[lang]}</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void scan()}
          disabled={status.kind === 'scanning'}
        >
          {scanLabel}
        </button>
      </div>

      <div className="panel__body">
        {status.kind === 'idle' && <p className="empty">{tr('state.idle')}</p>}
        {status.kind === 'error' && (
          <p className="error" role="alert">
            {errorText(status.code, lang)}
          </p>
        )}
        {result && score && (
          <>
            <section className="summary" aria-live="polite">
              <ScoreRing
                score={score.score}
                grade={score.grade}
                label={tr(`grade.${score.grade}`)}
              />
              <div className="summary__facts">
                {target && (
                  <p className="summary__target" title={target.url}>
                    {target.title || target.url}
                  </p>
                )}
                <ul className="impacts">
                  {IMPACTS.map((impact) => (
                    <li key={impact} className={`impact impact--${impact}`}>
                      <strong>{score.byImpact[impact]}</strong> {tr(`impact.${impact}`)}
                    </li>
                  ))}
                </ul>
                <p className="summary__meta">
                  {result.violations.length} {tr('result.rules')} · {score.elements}{' '}
                  {tr('result.elements')} · {result.passes.length} {tr('result.passes')} ·{' '}
                  {result.incomplete.length} {tr('result.incomplete')}
                </p>
              </div>
            </section>

            <div className="toolbar">
              <button
                type="button"
                className="btn btn--small"
                onClick={() => void highlight(findings, '*')}
              >
                {tr('action.highlightAll')}
              </button>
              <button type="button" className="btn btn--small" onClick={() => void clear()}>
                {tr('action.clear')}
              </button>
              <button type="button" className="btn btn--small" onClick={exportHtml}>
                {tr('action.exportHtml')}
              </button>
              <button type="button" className="btn btn--small" onClick={exportJson}>
                {tr('action.exportJson')}
              </button>
              <button type="button" className="btn btn--small" onClick={() => void copySummary()}>
                {tr('action.copy')}
              </button>
            </div>

            {findings.length === 0 ? (
              <p className="empty">{tr('result.clean')}</p>
            ) : (
              <ol className="findings">
                {findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    lang={lang}
                    active={activeRule === finding.id || activeRule === '*'}
                    onHighlight={() => void highlight([finding], finding.id)}
                    onHighlightNode={(node) =>
                      void adapter.highlight([
                        { selector: node.target, label: finding.id, impact: finding.impact },
                      ])
                    }
                  />
                ))}
              </ol>
            )}
          </>
        )}
      </div>

      <footer className="panel__footer">
        <span>{tr('footer.engine')}</span>
        <a href="https://github.com/malzinger/klarsicht" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </footer>
      <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  )
}
