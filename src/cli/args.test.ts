import { describe, expect, it } from 'vitest'
import { parseArgs } from './args'

describe('parseArgs', () => {
  it('applies defaults', () => {
    expect(parseArgs(['https://example.com'])).toMatchObject({
      urls: ['https://example.com'],
      standard: 'wcag22aa',
      threshold: 80,
      lang: 'en',
      out: 'klarsicht-out',
      help: false,
    })
  })

  it('reads options in any order and keeps several urls', () => {
    const options = parseArgs(['--lang', 'de', 'https://a.test', '--threshold', '95', 'https://b.test', '--standard', 'wcag21aa', '--channel', 'msedge'])
    expect(options.urls).toEqual(['https://a.test', 'https://b.test'])
    expect(options).toMatchObject({ lang: 'de', threshold: 95, standard: 'wcag21aa', channel: 'msedge' })
  })

  it('rejects bad input', () => {
    expect(() => parseArgs(['--standard', 'wcag9'])).toThrow(/Unknown standard/)
    expect(() => parseArgs(['--threshold', '120'])).toThrow(/0-100/)
    expect(() => parseArgs(['--lang', 'fr'])).toThrow(/en or de/)
    expect(() => parseArgs(['--out'])).toThrow(/Missing value/)
    expect(() => parseArgs(['--nope'])).toThrow(/Unknown option/)
  })
})
