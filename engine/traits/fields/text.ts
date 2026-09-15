import type { FieldTypeDef } from '../types'
import { z } from 'zod'
import { lineSchema } from '#shared/validation/text'
import { baseFieldSchema } from './base'

/**
 * A text value: one line, cleaned like every name, but allowed to be empty.
 *
 * Bounded, because it lands in JSONB on every asset carrying the trait; a
 * paragraph-sized value is a job for the asset's own content, not a field.
 */
const textValue = lineSchema(1000, { allowEmpty: true })

export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal('text'),
  default: textValue
})

export const textField: FieldTypeDef<string> = {
  type: 'text',
  label: 'Text',
  valueSchema: textValue
}
