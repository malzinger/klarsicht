import type { Finding, FindingNode, Lang } from '../shared/types'
import { contrastRatio, parseColor, suggestForeground } from './color'

export interface Fix {
  readonly summary: string
  readonly code?: string
}

type Template = (finding: Finding, node: FindingNode, lang: Lang) => Fix

const SRC = /src\s*=\s*"([^"]*)"/i
const ID = /\sid\s*=\s*"([^"]*)"/i
const HREF = /href\s*=\s*"([^"]*)"/i
const de = (lang: Lang) => lang === 'de'
const pick = (lang: Lang, en: string, german: string) => (de(lang) ? german : en)

function contrastFix(_finding: Finding, node: FindingNode, lang: Lang): Fix {
  const data = node.contrast
  const fg = data ? parseColor(data.fgColor) : null
  const bg = data ? parseColor(data.bgColor) : null
  const target = data ? Number.parseFloat(data.expectedContrastRatio) : Number.NaN
  if (!data || !fg || !bg || Number.isNaN(target)) {
    return {
      summary: pick(
        lang,
        'Raise the contrast between text and background to at least 4.5:1 (3:1 for large text).',
        'Erhöhe den Kontrast zwischen Text und Hintergrund auf mindestens 4,5:1 (großer Text 3:1).',
      ),
    }
  }
  const current = Math.round(contrastRatio(fg, bg) * 100) / 100
  const suggestion = suggestForeground(fg, bg, target)
  if (!suggestion) {
    return {
      summary: pick(
        lang,
        `Currently ${current}:1, required ${target}:1. Pick a clearly darker or lighter text colour or change the background.`,
        `Aktuell ${current}:1, nötig ${target}:1. Wähle eine deutlich dunklere oder hellere Textfarbe oder einen anderen Hintergrund.`,
      ),
    }
  }
  return {
    summary: pick(
      lang,
      `Currently ${current}:1 on ${data.bgColor}, required ${target}:1. Use ${suggestion.hex} for the text to reach ${suggestion.ratio}:1 while keeping the hue.`,
      `Aktuell ${current}:1 auf ${data.bgColor}, nötig ${target}:1. Mit ${suggestion.hex} als Textfarbe erreichst du ${suggestion.ratio}:1 und behältst den Farbton.`,
    ),
    code: `color: ${suggestion.hex}; /* was ${data.fgColor}, ${suggestion.ratio}:1 on ${data.bgColor} */`,
  }
}

const labelFix: Template = (_finding, node, lang) => {
  const id = ID.exec(node.html)?.[1] ?? 'email'
  return {
    summary: pick(
      lang,
      'Every form field needs a programmatic label: a <label for> pointing at its id, or aria-label when there is no visible text.',
      'Jedes Formularfeld braucht eine programmatische Beschriftung: ein <label for> auf seine id, oder aria-label, wenn kein sichtbarer Text vorhanden ist.',
    ),
    code: `<label for="${id}">${pick(lang, 'Email address', 'E-Mail-Adresse')}</label>\n<input id="${id}" type="email">`,
  }
}

const langFix: Template = (_finding, _node, lang) => ({
  summary: pick(
    lang,
    'Declare the page language so screen readers pick the right voice and hyphenation.',
    'Gib die Seitensprache an, damit Screenreader die richtige Stimme und Silbentrennung wählen.',
  ),
  code: `<html lang="${de(lang) ? 'de' : 'en'}">`,
})

const simple =
  (en: string, german: string, code?: string): Template =>
  (_finding, _node, lang) => ({ summary: pick(lang, en, german), ...(code ? { code } : {}) })

const TEMPLATES: Record<string, Template> = {
  'color-contrast': contrastFix,
  'color-contrast-enhanced': contrastFix,
  'image-alt': (_finding, node, lang) => ({
    summary: pick(
      lang,
      'Add an alt attribute that says what the image shows. Purely decorative images get alt="" so screen readers skip them.',
      'Ergänze ein alt-Attribut, das den Inhalt des Bildes beschreibt. Rein dekorative Bilder bekommen alt="" und werden von Screenreadern übersprungen.',
    ),
    code: `<img src="${SRC.exec(node.html)?.[1] ?? 'image.jpg'}" alt="${pick(lang, 'What the image shows', 'Beschreibung des Bildes')}">`,
  }),
  'button-name': (_finding, _node, lang) => ({
    summary: pick(
      lang,
      'Give the button an accessible name: visible text, or aria-label for icon-only buttons.',
      'Gib dem Button einen zugänglichen Namen: sichtbaren Text oder aria-label bei reinen Icon-Buttons.',
    ),
    code: `<button type="button" aria-label="${pick(lang, 'Search', 'Suchen')}">\n  <svg aria-hidden="true">…</svg>\n</button>`,
  }),
  'link-name': (_finding, node, lang) => ({
    summary: pick(
      lang,
      'Links need text that describes the destination. For icon links add aria-label or visually hidden text.',
      'Links brauchen einen Text, der das Ziel beschreibt. Bei Icon-Links aria-label oder visuell versteckten Text ergänzen.',
    ),
    code: `<a href="${HREF.exec(node.html)?.[1] ?? '/cart'}" aria-label="${pick(lang, 'Shopping cart', 'Warenkorb')}">…</a>`,
  }),
  label: labelFix,
  'select-name': labelFix,
  'html-has-lang': langFix,
  'html-lang-valid': langFix,
  'document-title': (_finding, _node, lang) => ({
    summary: pick(
      lang,
      'Every page needs a unique, descriptive title. It is the first thing a screen reader announces.',
      'Jede Seite braucht einen eindeutigen, beschreibenden Titel. Er ist das Erste, was ein Screenreader vorliest.',
    ),
    code: `<title>${pick(lang, 'Page name · Site', 'Seitenname · Website')}</title>`,
  }),
  'heading-order': simple(
    'Do not skip heading levels. Use h2 after h1, h3 after h2; style them with CSS instead of picking a smaller heading.',
    'Überspringe keine Überschriftenebenen. Nach h1 kommt h2, nach h2 h3; die Optik regelst du per CSS statt über eine kleinere Überschrift.',
  ),
  region: simple(
    'Put all content inside landmarks so assistive tech can jump between sections.',
    'Lege alle Inhalte in Landmarken, damit Hilfstechnik zwischen Bereichen springen kann.',
    '<header>…</header>\n<nav>…</nav>\n<main>…</main>\n<footer>…</footer>',
  ),
  'landmark-one-main': simple(
    'Wrap the primary content in exactly one <main>.',
    'Umschließe den Hauptinhalt mit genau einem <main>.',
    '<main id="content">…</main>',
  ),
  'page-has-heading-one': simple(
    'Add one h1 that names the page.',
    'Ergänze eine h1, die die Seite benennt.',
    '<h1>…</h1>',
  ),
  'target-size': simple(
    'Interactive targets need at least 24 × 24 CSS pixels, or enough spacing around them.',
    'Interaktive Ziele brauchen mindestens 24 × 24 CSS-Pixel oder genug Abstand drumherum.',
    'min-width: 24px;\nmin-height: 24px;',
  ),
  'meta-viewport': simple(
    'Never disable zoom. Remove maximum-scale and user-scalable=no.',
    'Zoom nie deaktivieren. Entferne maximum-scale und user-scalable=no.',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
  ),
  'frame-title': (_finding, _node, lang) => ({
    summary: pick(
      lang,
      'Give every iframe a title that says what it contains.',
      'Gib jedem iframe einen Titel, der den Inhalt benennt.',
    ),
    code: `<iframe title="${pick(lang, 'Map view', 'Kartenansicht')}" src="…"></iframe>`,
  }),
  tabindex: simple(
    'Avoid positive tabindex values; they break the natural focus order. Use 0 or -1 only.',
    'Vermeide positive tabindex-Werte, sie zerstören die natürliche Fokusreihenfolge. Nur 0 oder -1 verwenden.',
  ),
  'link-in-text-block': simple(
    'Links inside text must be distinguishable without colour alone, usually by an underline.',
    'Links im Fließtext müssen ohne Farbe erkennbar sein, meist durch Unterstreichung.',
    'a { text-decoration: underline; }',
  ),
}

/** Concrete fix for a finding; falls back to the engine help text for rules without a template. */
export function getFix(finding: Finding, node: FindingNode, lang: Lang): Fix {
  const template = TEMPLATES[finding.id]
  return template ? template(finding, node, lang) : { summary: finding.help }
}

export const TEMPLATED_RULES: readonly string[] = Object.keys(TEMPLATES)
