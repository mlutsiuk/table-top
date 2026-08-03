import { z } from 'zod'
import type { FieldTypeDef } from '../types'
import { baseFieldSchema } from './base'

export const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal('number'),
  default: z.number()
})

export const numberField: FieldTypeDef<number> = {
  type: 'number',
  label: 'Number',
  valueSchema: z.number()
}
