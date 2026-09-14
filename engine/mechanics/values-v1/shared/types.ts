import type { z } from 'zod'

/**
 * Field types this mechanic understands.
 *
 * Stage 2 ships the three that store a value on the asset. `formula` arrives with
 * the parser in Stage 3 — adding it here forces `FIELD_TYPES` to be filled in
 * before anything compiles again.
 */
export const FIELD_TYPES_LIST = ['number', 'text', 'boolean'] as const

export type FieldType = typeof FIELD_TYPES_LIST[number]

/**
 * Where a value lives.
 *
 * - `static` — on the asset, shared by every entity made from it
 * - `dynamic` — on the entity, different for each *(Stage 3, needs EntityTrait)*
 *
 * Only `static` is accepted for now, so a config asking for anything else is
 * refused rather than stored and silently ignored.
 */
export const FIELD_KINDS_LIST = ['static'] as const

export type FieldKind = typeof FIELD_KINDS_LIST[number]

/**
 * Everything a field can hold as a value.
 *
 * Named once because three places need the same union: the schema a field type
 * validates with, the blank value a newly added field starts from, and the data a
 * trait stores. `formula` will not widen it — a computed field stores nothing.
 */
export type FieldValue = number | string | boolean

/**
 * What varies between number, text and boolean, described once per type.
 *
 * Config validation lives in each type's own schema and is assembled into a
 * discriminated union; this covers what a *stored value* may be, which is what
 * trait validation needs at runtime after the field type is known.
 */
export type FieldTypeDef<TValue extends FieldValue = FieldValue> = {
  type: FieldType

  /** Shown to the master when adding a field. */
  label: string

  /** Validates a value stored for such a field in `AssetTrait.data`. */
  valueSchema: z.ZodType<TValue>
}
