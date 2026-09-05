import type { Lang, Localized } from '../shared/types'

export const STRINGS = {
  'app.name': { en: 'Klarsicht', de: 'Klarsicht' },
  'app.tagline': { en: 'Accessibility checker', de: 'Barrierefreiheits-Check' },
  'lang.label': { en: 'Language', de: 'Sprache' },
  'standard.label': { en: 'Standard', de: 'Standard' },
  'action.scan': { en: 'Scan this page', de: 'Diese Seite prüfen' },
  'action.rescan': { en: 'Scan again', de: 'Erneut prüfen' },
  'action.highlightAll': { en: 'Highlight all', de: 'Alle markieren' },
  'action.clear': { en: 'Clear highlights', de: 'Markierungen entfernen' },
  'action.show': { en: 'Show on page', de: 'Auf der Seite zeigen' },
  'action.exportHtml': { en: 'HTML report', de: 'HTML-Report' },
  'action.exportJson': { en: 'JSON', de: 'JSON' },
  'action.copy': { en: 'Copy summary', de: 'Zusammenfassung kopieren' },
  'state.idle': {
    en: 'Open a page and start a scan. The analysis runs locally, nothing leaves your browser.',
    de: 'Öffne eine Seite und starte die Prüfung. Die Analyse läuft lokal, nichts verlässt deinen Browser.',
  },
  'state.scanning': { en: 'Scanning…', de: 'Prüfe…' },
  'error.no-access': {
    en: 'No access to this tab yet. Click the Klarsicht icon in the toolbar to release this tab, or allow access to websites once.',
    de: 'Noch kein Zugriff auf diesen Tab. Klicke auf das Klarsicht-Symbol in der Symbolleiste, um diesen Tab freizugeben, oder erlaube den Zugriff auf Websites einmalig.',
  },
  'error.unsupported-page': {
    en: 'This page type cannot be scanned (browser pages, the Web Store, PDFs).',
    de: 'Dieser Seitentyp kann nicht geprüft werden (Browserseiten, Web Store, PDFs).',
  },
  'action.grant': { en: 'Allow access to websites', de: 'Zugriff auf Websites erlauben' },
  'grant.note': {
    en: 'Chrome asks once. Afterwards every tab can be scanned directly, still without any data leaving the browser.',
    de: 'Chrome fragt einmal nach. Danach lässt sich jeder Tab direkt prüfen, weiterhin ohne dass Daten den Browser verlassen.',
  },
  'error.no-tab': { en: 'No active tab found.', de: 'Kein aktiver Tab gefunden.' },
  'error.generic': {
    en: 'The scan failed. Reload the page and try again.',
    de: 'Die Prüfung ist fehlgeschlagen. Lade die Seite neu und versuche es erneut.',
  },
  'result.score': { en: 'Score', de: 'Score' },
  'result.rules': { en: 'failing rules', de: 'verletzte Regeln' },
  'result.elements': { en: 'elements', de: 'Elemente' },
  'result.passes': { en: 'rules passed', de: 'Regeln bestanden' },
  'result.incomplete': { en: 'need manual review', de: 'manuell prüfen' },
  'result.clean': {
    en: 'No issues found for this standard. Nice.',
    de: 'Keine Probleme für diesen Standard gefunden. Stark.',
  },
  'impact.critical': { en: 'Critical', de: 'Kritisch' },
  'impact.serious': { en: 'Serious', de: 'Schwer' },
  'impact.moderate': { en: 'Moderate', de: 'Mittel' },
  'impact.minor': { en: 'Minor', de: 'Gering' },
  'section.fix': { en: 'How to fix', de: 'So behebst du es' },
  'section.elements': { en: 'Affected elements', de: 'Betroffene Elemente' },
  'level.bp': { en: 'Best practice', de: 'Best Practice' },
  more: { en: 'more', de: 'weitere' },
  'report.title': { en: 'Accessibility report', de: 'Barrierefreiheits-Report' },
  'report.generated': { en: 'Generated with Klarsicht', de: 'Erstellt mit Klarsicht' },
  'report.page': { en: 'Page', de: 'Seite' },
  'report.date': { en: 'Date', de: 'Datum' },
  'report.standard': { en: 'Standard', de: 'Standard' },
  'report.threshold': { en: 'Threshold', de: 'Schwelle' },
  'report.impact': { en: 'Impact', de: 'Schweregrad' },
  'report.rule': { en: 'Rule', de: 'Regel' },
  'report.duration': { en: 'Scan time', de: 'Prüfdauer' },
  'copy.done': { en: 'Summary copied', de: 'Zusammenfassung kopiert' },
  'footer.engine': { en: 'Engine: axe-core', de: 'Engine: axe-core' },
  'grade.A': { en: 'Excellent', de: 'Sehr gut' },
  'grade.B': { en: 'Good', de: 'Gut' },
  'grade.C': { en: 'Needs work', de: 'Ausbaufähig' },
  'grade.D': { en: 'Poor', de: 'Mangelhaft' },
} as const satisfies Record<string, Localized>

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang]
}

/** Maps an adapter error code (e.g. "no-access") to a user-facing message. */
export const isKnownError = (code: string): boolean => `error.${code}` in STRINGS

export function errorText(code: string, lang: Lang): string {
  const key = `error.${code}` as StringKey
  return key in STRINGS ? STRINGS[key][lang] : STRINGS['error.generic'][lang]
}
