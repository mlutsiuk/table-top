import type { AssetTraitData, RawTraitConfig } from '#shared/types/trait'
import type { TraitConfig } from './config.schema'

/**
 * A trait definition as the API exposes it.
 *
 * `valid` discriminates the config. When the schema accepted what was stored, the
 * type is the real one and no consumer needs a second parse. When it did not, the
 * type says only that something is there.
 *
 * The flag is not paranoia: rows outlive the code that wrote them, so a config can
 * be left behind by a change to the field types, or edited by hand. Saying so in
 * the type beats an unchecked cast that pretends otherwise.
 */
export type TraitDefDto =
  | { id: string, key: string, label: string, valid: true, config: TraitConfig }
  | { id: string, key: string, label: string, valid: false, config: RawTraitConfig }

/**
 * One definition's values on one asset.
 *
 * Carries the whole definition rather than its id: drawing a trait means knowing
 * which fields exist and what each may hold, so a client given only an id could not
 * render a single row without fetching it first.
 *
 * `data` is what is stored, not what the current config would make of it. Lining
 * the two up happens where the trait is drawn, through `normalizeTraitData`.
 */
export type AssetTraitDto = {
  id: string
  traitDef: TraitDefDto
  data: AssetTraitData
}
