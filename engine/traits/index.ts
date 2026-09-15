import { traitConfigSchema } from './config.schema'
import type { TraitConfig } from './config.schema'
import { FIELD_TYPES, fieldSchema } from './fields'
import type { TraitField } from './fields'
import { deriveTraitKey, RESERVED_TRAIT_KEYS, traitKeySchema } from './key'
import {
  assetTraitDefaults,
  assetTraitSchema,
  normalizeTraitData,
  orphanedKeys
} from './trait.schema'
import type { TraitData } from './trait.schema'
import { FIELD_TYPES_LIST } from './types'
import type { FieldType, FieldValue } from './types'

/**
 * How the engine stores values: the only way, per ADR-013.
 *
 * The single public entrance to `engine/traits/`. Everything here is plain
 * TypeScript that runs the same on the server and in the browser; the boundary test
 * keeps Vue, Prisma and the app out of it.
 *
 * Callers parse a config once with `traitConfigSchema` and pass the result on,
 * typed. Nothing here accepts an unparsed config.
 */
export {
  traitConfigSchema,
  traitKeySchema,
  RESERVED_TRAIT_KEYS,
  deriveTraitKey,
  assetTraitSchema,
  assetTraitDefaults,
  orphanedKeys,
  normalizeTraitData,
  FIELD_TYPES,
  FIELD_TYPES_LIST,
  fieldSchema
}

export type { TraitConfig, TraitData, TraitField, FieldType, FieldValue }
