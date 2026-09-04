import type { Localized } from '../shared/types'

export type Level = 'A' | 'AA' | 'AAA'

export interface Criterion {
  readonly tag: string
  readonly number: string
  readonly name: Localized
  readonly level: Level
}

/** Success criteria that axe-core rules commonly map to. */
const NAMES: Record<string, readonly [string, string, Level]> = {
  wcag111: ['Non-text Content', 'Nicht-Text-Inhalt', 'A'],
  wcag122: ['Captions (Prerecorded)', 'Untertitel (aufgezeichnet)', 'A'],
  wcag131: ['Info and Relationships', 'Info und Beziehungen', 'A'],
  wcag134: ['Orientation', 'Ausrichtung', 'AA'],
  wcag135: ['Identify Input Purpose', 'Eingabezweck bestimmen', 'AA'],
  wcag141: ['Use of Color', 'Benutzung von Farbe', 'A'],
  wcag142: ['Audio Control', 'Audio-Steuerelement', 'A'],
  wcag143: ['Contrast (Minimum)', 'Kontrast (Minimum)', 'AA'],
  wcag144: ['Resize Text', 'Textgröße ändern', 'AA'],
  wcag1410: ['Reflow', 'Umbruch', 'AA'],
  wcag1411: ['Non-text Contrast', 'Nicht-Text-Kontrast', 'AA'],
  wcag1412: ['Text Spacing', 'Textabstand', 'AA'],
  wcag211: ['Keyboard', 'Tastatur', 'A'],
  wcag212: ['No Keyboard Trap', 'Keine Tastaturfalle', 'A'],
  wcag221: ['Timing Adjustable', 'Zeiteinteilung anpassbar', 'A'],
  wcag222: ['Pause, Stop, Hide', 'Pausieren, beenden, ausblenden', 'A'],
  wcag241: ['Bypass Blocks', 'Blöcke umgehen', 'A'],
  wcag242: ['Page Titled', 'Seite mit Titel versehen', 'A'],
  wcag244: ['Link Purpose (In Context)', 'Linkzweck (im Kontext)', 'A'],
  wcag246: ['Headings and Labels', 'Überschriften und Beschriftungen', 'AA'],
  wcag247: ['Focus Visible', 'Fokus sichtbar', 'AA'],
  wcag2411: ['Focus Not Obscured (Minimum)', 'Fokus nicht verdeckt (Minimum)', 'AA'],
  wcag253: ['Label in Name', 'Beschriftung im Namen', 'A'],
  wcag258: ['Target Size (Minimum)', 'Zielgröße (Minimum)', 'AA'],
  wcag311: ['Language of Page', 'Sprache der Seite', 'A'],
  wcag312: ['Language of Parts', 'Sprache von Teilen', 'AA'],
  wcag321: ['On Focus', 'Bei Fokus', 'A'],
  wcag322: ['On Input', 'Bei Eingabe', 'A'],
  wcag331: ['Error Identification', 'Fehlererkennung', 'A'],
  wcag332: ['Labels or Instructions', 'Beschriftungen oder Anweisungen', 'A'],
  wcag411: ['Parsing', 'Syntaxanalyse', 'A'],
  wcag412: ['Name, Role, Value', 'Name, Rolle, Wert', 'A'],
  wcag413: ['Status Messages', 'Statusmeldungen', 'AA'],
}

/** Conformance level implied by a rule's tags; "BP" for axe best practices. */
export function levelFromTags(tags: readonly string[]): Level | 'BP' {
  if (tags.some((tag) => /^wcag2\d?aaa$/.test(tag))) return 'AAA'
  if (tags.some((tag) => /^wcag2\d?aa$/.test(tag))) return 'AA'
  if (tags.some((tag) => /^wcag2\d?a$/.test(tag))) return 'A'
  return 'BP'
}

/** Success criteria referenced by a rule, e.g. tag "wcag143" → 1.4.3 Contrast (Minimum). */
export function criteriaFor(tags: readonly string[]): Criterion[] {
  const fallbackLevel = levelFromTags(tags)
  const criteria: Criterion[] = []
  for (const tag of tags) {
    const match = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag)
    if (!match) continue
    const number = `${match[1] ?? ''}.${match[2] ?? ''}.${match[3] ?? ''}`
    const known = NAMES[tag]
    criteria.push({
      tag,
      number,
      name: known
        ? { en: known[0], de: known[1] }
        : { en: `Success criterion ${number}`, de: `Erfolgskriterium ${number}` },
      level: known ? known[2] : fallbackLevel === 'BP' ? 'A' : fallbackLevel,
    })
  }
  return criteria
}
