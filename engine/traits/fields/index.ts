import type { FieldType, FieldTypeDef } from '../types'
import { z } from 'zod'
import { booleanField, booleanFieldSchema } from './boolean'
import { numberField, numberFieldSchema } from './number'
import { textField, textFieldSchema } from './text'

/**
 * Every field type the engine supports.
 *
 * `Record<FieldType, …>` is the guarantee: add `'formula'` to `FIELD_TYPES_LIST`
 * and this stops compiling until the definition exists.
 */
export const FIELD_TYPES: Record<FieldType, FieldTypeDef> = {
  number: numberField,
  text: textField,
  boolean: booleanField
}

/**
 * What one entry in `TraitDef.config.fields` must look like.
 *
 * Listed explicitly rather than derived from the map above, because
 * `discriminatedUnion` needs the concrete object schemas to keep the `type`
 * literal — deriving it would erase exactly the type this union exists to carry.
 * A test asserts the two stay in step.
 */
export const fieldSchema = z.discriminatedUnion('type', [
  numberFieldSchema,
  textFieldSchema,
  booleanFieldSchema
])

export type TraitField = z.infer<typeof fieldSchema>

/** Validates a stored value against the field that declares it. */
export function valueSchemaFor(field: TraitField) {
  return FIELD_TYPES[field.type].valueSchema
}
