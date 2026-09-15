import { z } from 'zod'
import { fieldSchema } from './fields'

/**
 * `TraitDef.config`: the fields a master declared for one trait definition.
 *
 * Per ADR-003 there is no separate Stats or Health anything: a definition keyed
 * `health` and another keyed `core_stats` are both this, configured differently.
 */
export const traitConfigSchema = z.object({
  fields: z.array(fieldSchema)
    .max(60)
    // Duplicate keys would make a trait ambiguous, and formulas will address
    // fields by key, so this matters beyond tidiness.
    .refine(
      fields => new Set(fields.map(field => field.key)).size === fields.length,
      { message: 'Field keys must be unique within a trait' }
    )
})

export type TraitConfig = z.infer<typeof traitConfigSchema>
