import { z } from 'zod'
import type { ValuesConfig } from './config.schema'
import type { FieldValue } from './types'
import { valueSchemaFor } from './fields'

/** `AssetTrait.data` for this mechanic: one value per field the config declares. */
export type ValuesTraitData = Record<string, FieldValue>

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

/**
 * Stored data read through the config as it stands now.
 *
 * A trait outlives the config it was filled in under: fields arrive after it was
 * created, and a field can change type under a value already written. Rather than
 * refuse to show such a trait, every field falls back to its default when what is
 * stored is not something that field can hold.
 *
 * Keys the config no longer declares are dropped, so the result is also exactly
 * what `assetTraitSchema` accepts — which is why an editor can seed itself from
 * this and save straight back without a repair step in between.
 */
export function normalizeTraitData(
  config: ValuesConfig,
  data: Record<string, unknown>
): ValuesTraitData {
  return Object.fromEntries(config.fields.map((field) => {
    const stored = valueSchemaFor(field).safeParse(data[field.key])

    return [field.key, stored.success ? stored.data : field.default]
  }))
}
