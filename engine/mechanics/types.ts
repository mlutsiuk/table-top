import type { z } from 'zod'

/**
 * A mechanic as declared in code — the engine's "plugin", per ADR-012 never
 * loaded at runtime.
 *
 * Only the shared contract lives here: identity and validation, the parts both the
 * API and the UI need. Server-only logic (Action methods, hooks) and Vue
 * components are registered in separate maps keyed by the same `key`, so importing
 * a mechanic on the server never drags Vue in, and vice versa.
 *
 * The config is `unknown` at this boundary on purpose. A registry holds mechanics
 * whose configs have nothing in common, so each one parses its own before use —
 * which it would have to do anyway, the value having come from a JSONB column.
 */
export type MechanicDef = {
  /** Stored in `Mechanic.key` — which definition an instance is built from. */
  key: string

  /** Shown to the master when choosing a mechanic to add. */
  label: string
  description: string

  /** Validates `Mechanic.config` — what the master configured. */
  configSchema: z.ZodType

  /**
   * Builds the schema for `AssetTrait.data` from one instance's config.
   *
   * A function rather than a constant because the accepted keys are whatever the
   * master configured, which cannot be known statically.
   */
  assetTraitSchema: (config: unknown) => z.ZodType<Record<string, unknown>>

  /** Values a trait starts with when the mechanic is attached to an asset. */
  assetTraitDefaults: (config: unknown) => Record<string, unknown>

  /**
   * Keys a stored trait holds that the config no longer declares.
   *
   * Used to tell the master exactly what a config change will destroy before it
   * happens, and to clean up afterwards.
   */
  orphanedKeys: (config: unknown, data: Record<string, unknown>) => string[]
}
