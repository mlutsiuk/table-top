/* eslint-disable ts/no-namespace */

/**
 * Bridges the JSONB shapes into the `PrismaJson` namespace that the generated
 * client refers to from `/// [TypeName]` annotations in the schema.
 *
 * Nothing is declared here — the types live in `shared/types/mechanic.ts` so the
 * client can use them too. Every annotation in `schema.prisma` needs a line below,
 * or the generated client ends up referring to a type that does not exist.
 */
import type {
  AssetTraitData as _AssetTraitData,
  EntityRelationData as _EntityRelationData,
  EntityTraitData as _EntityTraitData,
  MechanicConfig as _MechanicConfig
} from '#shared/types/mechanic'

declare global {
  namespace PrismaJson {
    type MechanicConfig = _MechanicConfig
    type AssetTraitData = _AssetTraitData
    type EntityTraitData = _EntityTraitData
    type EntityRelationData = _EntityRelationData
  }
}

export {}
