import type { MechanicDef } from '../types'
import { valuesConfigSchema } from './shared/config.schema'
import type { ValuesConfig } from './shared/config.schema'
import { assetTraitDefaults, assetTraitSchema, orphanedKeys } from './shared/trait.schema'

/**
 * The one mechanic for storing values, per ADR-003.
 *
 * This file is the mechanic's only public entrance: everything under `values-v1/`
 * is reached through it, and the `shared/` `server/` `ui/` subfolders say plainly
 * who each part is for.
 *
 * The wrappers parse the incoming config before handing it on, which is what lets
 * the registry hold mechanics with unrelated config shapes.
 */
export const valuesV1: MechanicDef = {
  key: 'values-v1',
  label: 'Values',
  description: 'Numbers, text and flags — the building blocks of a character sheet.',

  configSchema: valuesConfigSchema,

  assetTraitSchema: config => assetTraitSchema(valuesConfigSchema.parse(config)),
  assetTraitDefaults: config => assetTraitDefaults(valuesConfigSchema.parse(config)),
  orphanedKeys: (config, data) => orphanedKeys(valuesConfigSchema.parse(config), data)
}

export type { ValuesConfig }
