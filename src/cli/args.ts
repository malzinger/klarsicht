import { STANDARDS } from '../core/standards'
import type { Lang, StandardId } from '../shared/types'

export interface CliOptions {
  readonly urls: string[]
  readonly standard: StandardId
  readonly threshold: number
  readonly lang: Lang
  readonly out: string
  readonly channel: string | undefined
  readonly help: boolean
}

export const USAGE = `Usage: klarsicht <url> [more urls] [options]

Options:
  --standard <id>    wcag22aa (default) | wcag21aa | wcag22aa-bp
  --threshold <n>    minimum score 0-100 to pass (default 80)
  --lang <en|de>     language of rule texts and reports (default en)
  --out <dir>        where reports are written (default klarsicht-out)
  --channel <name>   Playwright browser channel, e.g. msedge or chrome
  --help             show this help

Exit code 1 when any page scores below the threshold, 2 on usage errors.`

const STANDARD_IDS: readonly string[] = STANDARDS.map((standard) => standard.id)

export function parseArgs(argv: readonly string[]): CliOptions {
  const urls: string[] = []
  let standard: StandardId = 'wcag22aa'
  let threshold = 80
  let lang: Lang = 'en'
  let out = 'klarsicht-out'
  let channel: string | undefined
  let help = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? ''
    const next = (): string => {
      const value = argv[++i]
      if (value === undefined) throw new Error(`Missing value for ${arg}`)
      return value
    }
    switch (arg) {
      case '--standard': {
        const value = next()
        if (!STANDARD_IDS.includes(value)) throw new Error(`Unknown standard "${value}"`)
        standard = value as StandardId
        break
      }
      case '--threshold': {
        const value = Number(next())
        if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error('Threshold must be 0-100')
        threshold = value
        break
      }
      case '--lang': {
        const value = next()
        if (value !== 'en' && value !== 'de') throw new Error('Language must be en or de')
        lang = value
        break
      }
      case '--out':
        out = next()
        break
      case '--channel':
        channel = next()
        break
      case '--help':
      case '-h':
        help = true
        break
      default:
        if (arg.startsWith('-')) throw new Error(`Unknown option ${arg}`)
        urls.push(arg)
    }
  }
  return { urls, standard, threshold, lang, out, channel, help }
}
