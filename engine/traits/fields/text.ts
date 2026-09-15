import { z } from 'zod'
import type { FieldTypeDef } from '../types'
import { baseFieldSchema } from './base'

export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal('text'),
  default: z.string()
})

export const textField: FieldTypeDef<string> = {
  type: 'text',
  label: 'Text',
  valueSchema: z.string()
}
