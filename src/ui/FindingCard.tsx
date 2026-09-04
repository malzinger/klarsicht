import { useState } from 'react'
import { getFix } from '../core/fixes'
import { t } from '../core/i18n'
import { criteriaFor, levelFromTags } from '../core/wcag'
import type { Finding, FindingNode, Lang } from '../shared/types'

interface FindingCardProps {
  finding: Finding
  lang: Lang
  active: boolean
  onHighlight: () => void
  onHighlightNode: (node: FindingNode) => void
}

const MAX_NODES = 8

export function FindingCard({
  finding,
  lang,
  active,
  onHighlight,
  onHighlightNode,
}: FindingCardProps) {
  const [open, setOpen] = useState(false)
  const criteria = criteriaFor(finding.tags)
  const level = levelFromTags(finding.tags)
  const first = finding.nodes[0]
  const fix = first ? getFix(finding, first, lang) : null

  return (
    <li className={`finding finding--${finding.impact}${active ? ' is-active' : ''}`}>
      <button
        type="button"
        className="finding__head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`chip chip--${finding.impact}`}>
          {t(`impact.${finding.impact}`, lang)}
        </span>
        <span className="finding__title">{finding.help}</span>
        <span
          className="finding__count"
          aria-label={`${finding.nodes.length} ${t('result.elements', lang)}`}
        >
          {finding.nodes.length}
        </span>
      </button>

      {open && (
        <div className="finding__body">
          <p className="finding__desc">{finding.description}</p>
          <div className="criteria">
            {criteria.map((criterion) => (
              <span key={criterion.tag} className="crit" title={criterion.name[lang]}>
                WCAG {criterion.number} · {criterion.level}
              </span>
            ))}
            {level === 'BP' && <span className="crit">{t('level.bp', lang)}</span>}
            <a className="crit crit--link" href={finding.helpUrl} target="_blank" rel="noreferrer">
              axe-core ↗
            </a>
          </div>

          {fix && (
            <div className="fix">
              <h4>{t('section.fix', lang)}</h4>
              <p>{fix.summary}</p>
              {fix.code && (
                <pre>
                  <code>{fix.code}</code>
                </pre>
              )}
            </div>
          )}

          <div className="nodes">
            <h4>{t('section.elements', lang)}</h4>
            <ul>
              {finding.nodes.slice(0, MAX_NODES).map((node, index) => (
                <li key={index}>
                  <code className="snippet">{node.html}</code>
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => onHighlightNode(node)}
                  >
                    {t('action.show', lang)}
                  </button>
                </li>
              ))}
              {finding.nodes.length > MAX_NODES && (
                <li className="nodes__more">
                  +{finding.nodes.length - MAX_NODES} {t('more', lang)}
                </li>
              )}
            </ul>
          </div>

          <button type="button" className="btn btn--small btn--accent" onClick={onHighlight}>
            {t('action.highlightAll', lang)}
          </button>
        </div>
      )}
    </li>
  )
}
