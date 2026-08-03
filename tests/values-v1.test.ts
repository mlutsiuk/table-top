import { describe, expect, it } from 'vitest'
import { valuesV1 } from '~~/engine/mechanics/values-v1'
import { findMechanic, listMechanics } from '~~/engine/mechanics/registry'
import { FIELD_TYPES, fieldSchema } from '~~/engine/mechanics/values-v1/shared/fields'
import { FIELD_TYPES_LIST } from '~~/engine/mechanics/values-v1/shared/types'

const field = (over: Record<string, unknown> = {}) => ({
  key: 'str',
  label: 'Strength',
  type: 'number',
  kind: 'static',
  default: 10,
  ...over
})

const config = (fields: unknown[]) => ({ fields })

describe('registry', () => {
  it('finds a known mechanic', () => {
    expect(findMechanic('values-v1')?.key).toBe('values-v1')
  })

  it('returns nothing for an unknown key', () => {
    expect(findMechanic('nope-v9')).toBeUndefined()
  })

  it('lists mechanics for the picker', () => {
    expect(listMechanics()).toEqual([
      { key: 'values-v1', label: 'Values', description: expect.any(String) }
    ])
  })
})

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
    const result = valuesV1.configSchema.safeParse(config([
      field(),
      field({ key: 'name', type: 'text', default: '' }),
      field({ key: 'proficient', type: 'boolean', default: false })
    ]))
    expect(result.success).toBe(true)
  })

  it('accepts a mechanic with no fields yet', () => {
    expect(valuesV1.configSchema.safeParse(config([])).success).toBe(true)
  })

  it('rejects a default that does not match the field type', () => {
    expect(valuesV1.configSchema.safeParse(config([field({ default: 'ten' })])).success).toBe(false)
  })

  it('rejects duplicate keys', () => {
    const result = valuesV1.configSchema.safeParse(config([field(), field({ label: 'Again' })]))
    expect(result.success).toBe(false)
  })

  it('rejects a key that could not be used in a formula', () => {
    for (const key of ['Str', '1st', 'my-key', 'with space', '']) {
      expect(valuesV1.configSchema.safeParse(config([field({ key })])).success).toBe(false)
    }
  })

  it('rejects field kinds that Stage 2 cannot store', () => {
    // `dynamic` needs EntityTrait, which does not exist yet — better refused than
    // accepted and silently ignored.
    expect(valuesV1.configSchema.safeParse(config([field({ kind: 'dynamic' })])).success).toBe(false)
  })

  it('rejects an unknown field type', () => {
    expect(valuesV1.configSchema.safeParse(config([field({ type: 'formula' })])).success).toBe(false)
  })
})

describe('asset trait schema', () => {
  const parsed = valuesV1.configSchema.parse(config([
    field(),
    field({ key: 'name', type: 'text', default: '' })
  ]))

  it('accepts values matching the configured types', () => {
    expect(valuesV1.assetTraitSchema(parsed).safeParse({ str: 16, name: 'Goblin' }).success).toBe(true)
  })

  it('accepts a partially filled trait', () => {
    expect(valuesV1.assetTraitSchema(parsed).safeParse({ str: 16 }).success).toBe(true)
  })

  it('rejects a wrong value type', () => {
    expect(valuesV1.assetTraitSchema(parsed).safeParse({ str: 'strong' }).success).toBe(false)
  })

  it('rejects a key the config does not declare', () => {
    expect(valuesV1.assetTraitSchema(parsed).safeParse({ str: 16, hp: 3 }).success).toBe(false)
  })
})

describe('defaults and orphans', () => {
  const parsed = valuesV1.configSchema.parse(config([
    field(),
    field({ key: 'name', type: 'text', default: 'Unnamed' })
  ]))

  it('seeds a trait from the configured defaults', () => {
    expect(valuesV1.assetTraitDefaults(parsed)).toEqual({ str: 10, name: 'Unnamed' })
  })

  it('names keys a config change would strand', () => {
    expect(valuesV1.orphanedKeys(parsed, { str: 16, hp: 3, ac: 12 })).toEqual(['hp', 'ac'])
  })

  it('finds nothing to strand when the trait matches', () => {
    expect(valuesV1.orphanedKeys(parsed, { str: 16 })).toEqual([])
  })
})
