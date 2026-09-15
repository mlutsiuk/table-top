import { describe, expect, it } from 'vitest'
import { assetTraitSchema, traitConfigSchema } from '~~/engine/traits'
import { lineSchema, sanitizeLine } from '#shared/validation/text'

// Every non-ASCII character below is written as an escape, so the source itself
// carries nothing invisible that a reviewer could miss.

describe('sanitizing a line', () => {
  it('removes NUL and other control characters', () => {
    expect(sanitizeLine('He\x00al\x07th')).toBe('Health')
  })

  it('turns line breaks and tabs into a single space', () => {
    expect(sanitizeLine('Health\nPoints\tMax')).toBe('Health Points Max')
  })

  it('removes characters that change nothing visible', () => {
    for (const input of ['Hea\u{200B}lth', 'Hea\xADlth', '\u{FEFF}Health', 'Hea\u{2060}lth']) {
      expect(sanitizeLine(input)).toBe('Health')
    }
  })

  it('removes bidi controls, so text cannot be shown reversed', () => {
    expect(sanitizeLine('Health\u{202E}yfitsni')).toBe('Healthyfitsni')
  })

  it('composes decomposed letters', () => {
    const boiovi = '\u{411}\u{43E}\u{439}\u{43E}\u{432}\u{456}'
    expect(sanitizeLine(boiovi.normalize('NFD'))).toBe(boiovi)
  })

  it('keeps what emoji sequences need', () => {
    // A variation selector and a zero-width joiner both carry meaning here.
    expect(sanitizeLine('\u{2764}\u{FE0F} Health')).toBe('\u{2764}\u{FE0F} Health')
    expect(sanitizeLine('\u{1F468}\u{200D}\u{1F469}')).toBe('\u{1F468}\u{200D}\u{1F469}')
  })

  it('collapses runs of whitespace and trims the ends', () => {
    expect(sanitizeLine('  Hit\xA0\xA0 Points  ')).toBe('Hit Points')
  })

  it('makes lookalike names identical, so uniqueness can catch them', () => {
    expect(sanitizeLine('Hea\u{200B}lth')).toBe(sanitizeLine('Health'))
  })
})

describe('line schema', () => {
  const name = lineSchema(60)

  it('returns the cleaned value', () => {
    expect(name.parse('  Hea\u{200B}lth ')).toBe('Health')
  })

  it('rejects a name with nothing visible in it', () => {
    for (const input of ['', '   ', '\u{200B}', '\u{202E}', '\u{200D}']) {
      expect(name.safeParse(input).success).toBe(false)
    }
  })

  it('measures length after cleaning', () => {
    // Invisible padding neither pushes a name over the limit nor sneaks past it.
    expect(name.safeParse(`${'x'.repeat(60)}${'\u{200B}'.repeat(10)}`).success).toBe(true)
    expect(name.safeParse('x'.repeat(61)).success).toBe(false)
  })

  it('allows an empty value when asked to', () => {
    const value = lineSchema(10, { allowEmpty: true })
    expect(value.parse('')).toBe('')
    expect(value.parse('\u{200B}')).toBe('')
  })
})

describe('text inside trait schemas', () => {
  const config = (fields: unknown[]) => ({ fields })
  const field = (over: Record<string, unknown> = {}) => ({
    key: 'bio',
    label: 'Bio',
    type: 'text',
    kind: 'static',
    default: '',
    ...over
  })

  it('cleans a field label', () => {
    const parsed = traitConfigSchema.parse(config([field({ label: 'B\u{200B}io' })]))
    expect(parsed.fields[0]!.label).toBe('Bio')
  })

  it('rejects a field label with nothing visible', () => {
    expect(traitConfigSchema.safeParse(config([field({ label: '\u{200B}' })])).success).toBe(false)
  })

  it('strips NUL from a text default instead of letting Postgres refuse it', () => {
    const parsed = traitConfigSchema.parse(config([field({ default: 'a\x00b' })]))
    expect(parsed.fields[0]!.default).toBe('ab')
  })

  it('bounds a text value', () => {
    const parsed = traitConfigSchema.parse(config([field()]))
    expect(assetTraitSchema(parsed).safeParse({ bio: 'x'.repeat(1000) }).success).toBe(true)
    expect(assetTraitSchema(parsed).safeParse({ bio: 'x'.repeat(1001) }).success).toBe(false)
  })
})
