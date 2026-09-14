import { valuesConfigSchema } from './shared/config.schema'
import type { ValuesConfig } from './shared/config.schema'
import {
  assetTraitDefaults,
  assetTraitSchema,
  normalizeTraitData,
  orphanedKeys
} from './shared/trait.schema'
import type { ValuesTraitData } from './shared/trait.schema'

/**
 * How the engine stores values — the only way, per ADR-013.
 *
 * This file is the single public entrance: everything under `values-v1/` is reached
 * through it, and the `shared/` and `ui/` subfolders say plainly who each part is for.
 *
 * There is no wrapper that re-parses an `unknown` config any more. A registry of
 * mechanics with unrelated config shapes needed that; one concrete shape does not.
 * Callers parse once with `valuesConfigSchema` and pass the result on, typed.
 */
export {
  valuesConfigSchema,
  assetTraitSchema,
  assetTraitDefaults,
  orphanedKeys,
  normalizeTraitData
}

export type { ValuesConfig, ValuesTraitData }
