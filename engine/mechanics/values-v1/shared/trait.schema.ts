import { z } from 'zod'
import type { ValuesConfig } from './config.schema'
import { valueSchemaFor } from './fields'

/**
 * Validates `AssetTrait.data` against the config of the instance it belongs to.
 *
 * A function, not a constant: which keys are allowed and what each may hold is
 * whatever the master configured, so it cannot be known statically.
 *
 * Strict on purpose. An unknown key means the config changed underneath the trait,
 * and accepting it would store data no UI can reach — the config editor cleans
 * such keys up explicitly instead, after warning about what will be lost.
 */
export function assetTraitSchema(config: ValuesConfig) {
  const shape = Object.fromEntries(
    config.fields.map(field => [field.key, valueSchemaFor(field).optional()])
  )

  return z.strictObject(shape)
}

/** What a trait starts with when a mechanic is first attached to an asset. */
export function assetTraitDefaults(config: ValuesConfig): Record<string, unknown> {
  return Object.fromEntries(config.fields.map(field => [field.key, field.default]))
}

/** Keys held by a trait that the config no longer declares. */
export function orphanedKeys(config: ValuesConfig, data: Record<string, unknown>): string[] {
  const declared = new Set(config.fields.map(field => field.key))

  return Object.keys(data).filter(key => !declared.has(key))
}
