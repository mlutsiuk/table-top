import { describe, expect, it } from 'vitest'
import {
  assetTraitDefaults,
  assetTraitSchema,
  deriveTraitKey,
  FIELD_TYPES,
  FIELD_TYPES_LIST,
  fieldSchema,
  normalizeTraitData,
  orphanedKeys,
  traitConfigSchema,
  traitKeySchema
} from '~~/engine/traits'

const field = (over: Record<string, unknown> = {}) => ({
  key: 'str',
  label: 'Strength',
  type: 'number',
  kind: 'static',
  default: 10,
  ...over
})

const config = (fields: unknown[]) => ({ fields })

describe('field type registry', () => {
  it('covers every declared type', () => {
    expect(Object.keys(FIELD_TYPES).sort()).toEqual([...FIELD_TYPES_LIST].sort())
  })

  it('keeps the config union in step with the map', () => {
    // The union is the one place the list of types is repeated, because
    // discriminatedUnion needs the concrete schemas. This is what stops the two
    // drifting apart.
    const inUnion = fieldSchema.options.map(option => option.shape.type.value)
    expect(inUnion.sort()).toEqual([...FIELD_TYPES_LIST].sort())
  })
})

describe('config schema', () => {
  it('accepts the three static field types', () => {
    const result = traitConfigSchema.safeParse(config([
      field(),
      field({ key: 'name', type: 'text', default: '' }),
      field({ key: 'proficient', type: 'boolean', default: false })
    ]))
    expect(result.success).toBe(true)
  })

  it('accepts a trait with no fields yet', () => {
    expect(traitConfigSchema.safeParse(config([])).success).toBe(true)
  })

  it('rejects a default that does not match the field type', () => {
    expect(traitConfigSchema.safeParse(config([field({ default: 'ten' })])).success).toBe(false)
  })

  it('rejects duplicate keys', () => {
    const result = traitConfigSchema.safeParse(config([field(), field({ label: 'Again' })]))
    expect(result.success).toBe(false)
  })

  it('rejects a key that could not be used in a formula', () => {
    for (const key of ['Str', '1st', 'my-key', 'with space', '']) {
      expect(traitConfigSchema.safeParse(config([field({ key })])).success).toBe(false)
    }
  })

  it('rejects field kinds that Stage 2 cannot store', () => {
    // `dynamic` needs EntityTrait, which does not exist yet — better refused than
    // accepted and silently ignored.
    expect(traitConfigSchema.safeParse(config([field({ kind: 'dynamic' })])).success).toBe(false)
  })

  it('rejects an unknown field type', () => {
    expect(traitConfigSchema.safeParse(config([field({ type: 'formula' })])).success).toBe(false)
  })
})

describe('asset trait schema', () => {
  const parsed = traitConfigSchema.parse(config([
    field(),
    field({ key: 'name', type: 'text', default: '' })
  ]))

  it('accepts values matching the configured types', () => {
    expect(assetTraitSchema(parsed).safeParse({ str: 16, name: 'Goblin' }).success).toBe(true)
  })

  it('accepts a partially filled trait', () => {
    expect(assetTraitSchema(parsed).safeParse({ str: 16 }).success).toBe(true)
  })

  it('rejects a wrong value type', () => {
    expect(assetTraitSchema(parsed).safeParse({ str: 'strong' }).success).toBe(false)
  })

  it('rejects a key the config does not declare', () => {
    expect(assetTraitSchema(parsed).safeParse({ str: 16, hp: 3 }).success).toBe(false)
  })
})

describe('defaults and orphans', () => {
  const parsed = traitConfigSchema.parse(config([
    field(),
    field({ key: 'name', type: 'text', default: 'Unnamed' })
  ]))

  it('seeds a trait from the configured defaults', () => {
    expect(assetTraitDefaults(parsed)).toEqual({ str: 10, name: 'Unnamed' })
  })

  it('names keys a config change would strand', () => {
    expect(orphanedKeys(parsed, { str: 16, hp: 3, ac: 12 })).toEqual(['hp', 'ac'])
  })

  it('finds nothing to strand when the trait matches', () => {
    expect(orphanedKeys(parsed, { str: 16 })).toEqual([])
  })
})

describe('reading a trait through the current config', () => {
  const parsed = traitConfigSchema.parse(config([
    field(),
    field({ key: 'name', type: 'text', default: 'Unnamed' })
  ]))

  it('keeps what is stored when the field can hold it', () => {
    expect(normalizeTraitData(parsed, { str: 16, name: 'Goblin' }))
      .toEqual({ str: 16, name: 'Goblin' })
  })

  it('falls back to the default for a field filled in after the trait was made', () => {
    expect(normalizeTraitData(parsed, { str: 16 })).toEqual({ str: 16, name: 'Unnamed' })
  })

  it('falls back to the default when the field type changed under the value', () => {
    // `str` was text when this was written, and is a number now. Showing the
    // default beats showing nothing, and beats refusing to open the sheet.
    expect(normalizeTraitData(parsed, { str: 'strong' })).toEqual({ str: 10, name: 'Unnamed' })
  })

  it('drops keys the config no longer declares', () => {
    expect(normalizeTraitData(parsed, { str: 16, hp: 3 })).toEqual({ str: 16, name: 'Unnamed' })
  })

  it('produces something the trait schema accepts', () => {
    // This is what makes it safe to seed an editor from and save straight back.
    const normalized = normalizeTraitData(parsed, { str: 'strong', hp: 3 })

    expect(assetTraitSchema(parsed).safeParse(normalized).success).toBe(true)
  })
})

describe('trait key', () => {
  it('accepts an identifier-shaped key', () => {
    expect(traitKeySchema.safeParse('core_stats').success).toBe(true)
  })

  it('rejects a key a formula could not address', () => {
    for (const key of ['Core', '1st', 'core-stats', 'with space', '']) {
      expect(traitKeySchema.safeParse(key).success).toBe(false)
    }
  })

  it('rejects a reserved key', () => {
    // `#target` and `@target` cannot collide, but a trait keyed `target` would still
    // read as if it meant the action parameter.
    expect(traitKeySchema.safeParse('target').success).toBe(false)
  })
})

describe('deriving a key from the label', () => {
  it('turns a Latin label into snake case', () => {
    expect(deriveTraitKey('Core Stats')).toBe('core_stats')
  })

  it('transliterates Ukrainian', () => {
    expect(deriveTraitKey('Бойові навички')).toBe('boiovi_navychky')
  })

  it('drops apostrophes instead of splitting the word', () => {
    // All three apostrophes a Ukrainian keyboard might produce.
    for (const label of ["Здоров'я", 'Здоров’я', 'Здоровʼя']) {
      expect(deriveTraitKey(label)).toBe('zdorovia')
    }
  })

  it('trims separators at the edges', () => {
    expect(deriveTraitKey('  -- HP --  ')).toBe('hp')
  })

  it('suggests nothing when no letter can start the key', () => {
    // The form asks for a key rather than inventing one the master never chose.
    expect(deriveTraitKey('123')).toBe('')
    expect(deriveTraitKey('!!!')).toBe('')
  })

  it('always suggests a key the schema accepts', () => {
    for (const label of ['Core Stats', 'Бойові навички', "Здоров'я", 'Armor Class (AC)']) {
      expect(traitKeySchema.safeParse(deriveTraitKey(label)).success).toBe(true)
    }
  })
})
