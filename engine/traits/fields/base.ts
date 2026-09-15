import { z } from 'zod'
import { identifierSchema } from '../key'
import { FIELD_KINDS_LIST } from '../types'

/**
 * Properties every field has, whatever its type.
 *
 * `key` shares its format with the trait definition key, because formulas address
 * both as one path: `@core_stats.str`.
 */
export const baseFieldSchema = z.object({
  key: identifierSchema,
  label: z.string().min(1).max(60),
  kind: z.enum(FIELD_KINDS_LIST)
})
