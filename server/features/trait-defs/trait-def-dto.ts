import type { TraitDef } from '@prisma/client'
import type { TraitDefDto } from '~~/engine/traits/dto'
import { traitConfigSchema } from '~~/engine/traits'

/**
 * Parses on the way out, not just on the way in.
 *
 * A config only ever reaches the database through the schema, but rows outlive the
 * code that wrote them: the field types can change, or a row can be edited by hand.
 * Checking here means every consumer gets a config the schema vouched for, or an
 * explicit `valid: false`, never an unchecked cast dressed up as a type.
 *
 * The parsed value is also the canonical one, since Zod normalises what it accepts.
 *
 * Lives outside the service because a trait carries its definition with it, and both
 * routes to the client must describe it the same way.
 */
export function toTraitDefDto(traitDef: TraitDef): TraitDefDto {
  const parsed = traitConfigSchema.safeParse(traitDef.config)
  const base = { id: traitDef.id, key: traitDef.key, label: traitDef.label }

  return parsed.success
    ? { ...base, valid: true, config: parsed.data }
    : { ...base, valid: false, config: traitDef.config }
}
