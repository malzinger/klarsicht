import { describe, expect, it } from 'vitest'
import { contrastRatio, parseColor, suggestForeground, toHex } from './color'

describe('parseColor', () => {
  it('parses hex and rgb notations', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255])
    expect(parseColor('#17171a')).toEqual([23, 23, 26])
    expect(parseColor('#17171aff')).toEqual([23, 23, 26])
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30])
    expect(parseColor('rgba(10 20 30 / 0.5)')).toEqual([10, 20, 30])
    expect(parseColor('tomato')).toBeNull()
  })

  it('round-trips through hex', () => {
    expect(toHex([23, 23, 26])).toBe('#17171a')
  })
})

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 2)
    expect(contrastRatio([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5)
    expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 1)
  })
})

describe('suggestForeground', () => {
  it('finds a passing colour that keeps the hue direction', () => {
    const suggestion = suggestForeground([157, 157, 157], [255, 255, 255], 4.5)
    expect(suggestion).not.toBeNull()
    expect(suggestion?.ratio).toBeGreaterThanOrEqual(4.5)
    const rgb = parseColor(suggestion?.hex ?? '')
    expect(rgb).not.toBeNull()
    expect(rgb?.[0]).toBeLessThan(157)
  })

  it('brightens text on dark backgrounds', () => {
    const suggestion = suggestForeground([80, 80, 80], [0, 0, 0], 4.5)
    expect(parseColor(suggestion?.hex ?? '')?.[0]).toBeGreaterThan(80)
  })

  it('returns null for an impossible target', () => {
    expect(suggestForeground([128, 128, 128], [128, 128, 128], 30)).toBeNull()
  })
})
