/**
 * Shapes of the JSONB columns in the schema.
 *
 * Edited here, by people; `prisma/json-types.ts` only bridges them into the
 * `PrismaJson` namespace that the generated client refers to.
 *
 * Modelled on the field table and the example configs in
 * `.docs/mechanics/values-v1.md`.
 */

export type MechanicFieldKind = 'static' | 'dynamic'

/**
 * A field a master configures on a mechanic.
 *
 * `formula` fields carry no `kind`: they are never stored, only computed — see
 * ADR-006 on where that happens.
 */
export type MechanicField =
  | { key: string, label: string, type: 'number', kind: MechanicFieldKind, default: number }
  | { key: string, label: string, type: 'text', kind: MechanicFieldKind, default: string }
  | { key: string, label: string, type: 'boolean', kind: MechanicFieldKind, default: boolean }
  | { key: string, label: string, type: 'formula', formula: string }

/** `Mechanic.config` — one mechanic as configured for a campaign. */
export type MechanicConfig = {
  fields: MechanicField[]
}

/** A value a field can hold once stored. Formulas are absent by design. */
export type TraitValue = number | string | boolean

/** `AssetTrait.data` — static values shared by every entity made from the asset. */
export type AssetTraitData = Record<string, TraitValue>

/**
 * `EntityTrait.data` — the current state of one entity.
 *
 * Only values that differ from the mechanic's defaults are stored (ADR-004), so a
 * missing key means "still the default", not "unset".
 */
export type EntityTraitData = Record<string, TraitValue>

/**
 * `EntityRelation.data` — details of a link between two entities.
 *
 * Deliberately open: the shape depends on the relation's `key`, and the engine
 * treats relations as an extension point rather than a fixed set.
 */
export type EntityRelationData = Record<string, unknown>
