import { describe, expect, it } from 'vitest'
import { criteriaFor, levelFromTags } from './wcag'

describe('criteriaFor', () => {
  it('maps axe tags to named success criteria', () => {
    const [criterion] = criteriaFor(['cat.color', 'wcag2aa', 'wcag143'])
    expect(criterion).toMatchObject({ number: '1.4.3', level: 'AA' })
    expect(criterion?.name.de).toBe('Kontrast (Minimum)')
  })

  it('handles two-digit criteria and unknown ones', () => {
    const criteria = criteriaFor(['wcag22aa', 'wcag2411', 'wcag999'])
    expect(criteria.map((c) => c.number)).toEqual(['2.4.11', '9.9.9'])
    expect(criteria[1]?.name.en).toBe('Success criterion 9.9.9')
  })
})

describe('levelFromTags', () => {
  it('derives the conformance level', () => {
    expect(levelFromTags(['wcag2a', 'wcag412'])).toBe('A')
    expect(levelFromTags(['wcag21aa'])).toBe('AA')
    expect(levelFromTags(['wcag2aaa'])).toBe('AAA')
    expect(levelFromTags(['best-practice'])).toBe('BP')
  })
})
