import { describe, expect, it } from 'vitest'
import type { Finding, FindingNode } from '../shared/types'
import { getFix } from './fixes'

const finding = (id: string, overrides: Partial<Finding> = {}): Finding => ({
  id,
  impact: 'serious',
  help: 'Engine help text',
  description: 'Engine description',
  helpUrl: 'https://example.com',
  tags: ['wcag2a'],
  nodes: [],
  ...overrides,
})

const node = (html: string, contrast?: FindingNode['contrast']): FindingNode => ({
  target: ['body'],
  html,
  failureSummary: '',
  ...(contrast ? { contrast } : {}),
})

describe('getFix', () => {
  it('suggests a concrete colour for contrast failures', () => {
    const fix = getFix(
      finding('color-contrast'),
      node('<p class="muted">', {
        fgColor: '#9d9d9d',
        bgColor: '#ffffff',
        contrastRatio: 2.6,
        expectedContrastRatio: '4.5:1',
        fontSize: '11.3pt (15px)',
        fontWeight: 'normal',
      }),
      'en',
    )
    expect(fix.code).toMatch(/^color: #[0-9a-f]{6};/)
    expect(fix.summary).toContain('required 4.5:1')
  })

  it('reuses the image source in the alt suggestion', () => {
    const fix = getFix(finding('image-alt'), node('<img src="hero.jpg" class="x">'), 'de')
    expect(fix.code).toBe('<img src="hero.jpg" alt="Beschreibung des Bildes">')
  })

  it('reuses the field id for labels', () => {
    const fix = getFix(finding('label'), node('<input id="mail" type="email">'), 'en')
    expect(fix.code).toContain('<label for="mail">')
  })

  it('falls back to the engine help text for unknown rules', () => {
    expect(getFix(finding('some-new-rule'), node('<div>'), 'en')).toEqual({
      summary: 'Engine help text',
    })
  })
})
