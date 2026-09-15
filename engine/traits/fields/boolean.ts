import { z } from 'zod'
import type { FieldTypeDef } from '../types'
import { baseFieldSchema } from './base'

export const booleanFieldSchema = baseFieldSchema.extend({
  type: z.literal('boolean'),
  default: z.boolean()
})

export const booleanField: FieldTypeDef<boolean> = {
  type: 'boolean',
  label: 'Yes / no',
  valueSchema: z.boolean()
}
