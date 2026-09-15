/**
 * Shapes of the JSONB columns in the schema.
 *
 * Deliberately open at this layer. What a config or a trait contains is decided by
 * the trait schemas in `engine/traits/`; declaring a concrete shape here would
 * pretend at a guarantee nothing at the database boundary enforces.
 */

/**
 * `TraitDef.config` as stored, before anything has parsed it.
 *
 * Named raw so it cannot be confused with the parsed `TraitConfig` from the engine:
 * this one is only what the column holds.
 */
export type RawTraitConfig = Record<string, unknown>

/** `AssetTrait.data`, static values keyed by field key. */
export type AssetTraitData = Record<string, unknown>

/** `EntityTrait.data`: dynamic state and overrides of static values, ADR-017. */
export type EntityTraitData = Record<string, unknown>

/** `EntityRelation.data`, details of a link; shape depends on the relation key. */
export type EntityRelationData = Record<string, unknown>

/** What a config change would destroy, shown to the master before it happens. */
export type TraitConfigImpact = {
  /** Field keys that would stop being declared. */
  removedKeys: string[]
  /** How many asset traits currently hold a value for one of them. */
  affectedAssets: number
}
