import { z } from 'zod'
import { fieldSchema } from './fields'

/**
 * `Mechanic.config` — what a master configured for one instance of this mechanic.
 *
 * Per ADR-003 there is no separate Stats or Health mechanic: an instance named
 * "health" and another named "core-stats" are both this, configured differently.
 */
export const valuesConfigSchema = z.object({
  fields: z.array(fieldSchema)
    .max(60)
    // Duplicate keys would make a trait ambiguous, and formulas will address
    // fields by key, so this matters beyond tidiness.
    .refine(
      fields => new Set(fields.map(field => field.key)).size === fields.length,
      { message: 'Field keys must be unique within a mechanic' }
    )
})

export type ValuesConfig = z.infer<typeof valuesConfigSchema>
