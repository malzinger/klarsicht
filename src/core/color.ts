export type Rgb = readonly [number, number, number]

/** Parses #rgb, #rrggbb, #rrggbbaa and rgb()/rgba() (comma or space separated). */
export function parseColor(input: string): Rgb | null {
  const value = input.trim().toLowerCase()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value)
  if (hex) {
    let digits = hex[1] ?? ''
    if (digits.length === 3)
      digits = digits
        .split('')
        .map((c) => c + c)
        .join('')
    const n = Number.parseInt(digits.slice(0, 6), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb =
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value) ??
    /^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)/.exec(value)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return null
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export interface ColorSuggestion {
  readonly hex: string
  readonly ratio: number
}

const BLACK: Rgb = [0, 0, 0]
const WHITE: Rgb = [255, 255, 255]

/**
 * Moves `fg` toward black or white, whichever needs the smaller change,
 * until the contrast against `bg` reaches `target`. Keeps the hue, so the
 * suggestion still looks like the original colour. Null if neither pole works.
 */
export function suggestForeground(fg: Rgb, bg: Rgb, target: number): ColorSuggestion | null {
  let best: { t: number; color: Rgb } | null = null
  for (const pole of [BLACK, WHITE]) {
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const candidate = mix(fg, pole, t)
      if (contrastRatio(candidate, bg) >= target) {
        if (!best || t < best.t) best = { t, color: candidate }
        break
      }
    }
  }
  if (!best) return null
  const rounded = parseColor(toHex(best.color))
  if (!rounded) return null
  return { hex: toHex(rounded), ratio: Math.round(contrastRatio(rounded, bg) * 100) / 100 }
}
