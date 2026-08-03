import { z } from 'zod'
import { FIELD_KINDS_LIST } from '../types'

/**
 * Properties every field has, whatever its type.
 *
 * `key` is deliberately identifier-shaped: formulas will address fields by it in
 * Stage 3 (`@self.trait['core-stats'].str`), and loosening a key format later is
 * far harder than starting strict.
 */
export const baseFieldSchema = z.object({
  key: z.string()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, 'Lowercase letters, digits and underscores, starting with a letter'),
  label: z.string().min(1).max(60),
  kind: z.enum(FIELD_KINDS_LIST)
})
