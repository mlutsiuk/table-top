/**
 * Shapes of the JSONB columns in the schema.
 *
 * Deliberately open. What a config or a trait actually contains is decided by the
 * mechanic that owns it — `values-v1` stores fields, another mechanic will store
 * something else entirely. Declaring one concrete shape here would be the same
 * mistake as putting a role column on a membership row: it makes an incorrect
 * state representable and pretends at a guarantee nothing enforces.
 *
 * The real validation happens at the boundary, in each mechanic's Zod schema
 * (`engine/mechanics/<key>/shared/`).
 */

/** `Mechanic.config` — whatever the owning mechanic's config schema accepts. */
export type MechanicConfig = Record<string, unknown>

/** `AssetTrait.data` — static values, keyed by the field keys of its mechanic. */
export type AssetTraitData = Record<string, unknown>

/** `EntityTrait.data` — current state of one entity. Lazy Init, see ADR-004. */
export type EntityTraitData = Record<string, unknown>

/** `EntityRelation.data` — details of a link; shape depends on the relation key. */
export type EntityRelationData = Record<string, unknown>

/** A mechanic instance as the API exposes it. */
export type MechanicDto = {
  id: string
  /** Which MechanicDef this is built from, e.g. `values-v1`. */
  key: string
  /** The master's own name for this instance, e.g. `health`. */
  name: string
  config: MechanicConfig
}

/** What a config change would destroy, shown to the master before it happens. */
export type MechanicConfigImpact = {
  /** Field keys that would stop being declared. */
  removedKeys: string[]
  /** How many asset traits currently hold a value for one of them. */
  affectedAssets: number
}
