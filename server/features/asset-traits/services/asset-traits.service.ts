import type { PrismaClient, TraitDef } from '@prisma/client'
import type { AssetTraitData } from '#shared/types/trait'
import type { AssetTraitDto } from '~~/engine/traits/dto'
import type { TraitConfig } from '~~/engine/traits'
import type { CampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import { BadRequestError, NotFoundError } from '~~/server/infrastructure/errors'
import { assetTraitDefaults, assetTraitSchema, traitConfigSchema } from '~~/engine/traits'
import { toTraitDefDto } from '~~/server/features/trait-defs/trait-def-dto'

/**
 * A trait is part of the material it hangs on, so it follows the material rules
 * rather than the definition ones: anyone who may read the asset sees its values,
 * and only someone who may write materials fills them in. The definition itself is
 * campaign-wide and stays behind `traits:manage`.
 *
 * Reading a trait hands its definition over with it, because without the fields
 * there is nothing to draw — which is why the ability table gives `traits:read`
 * to everyone who can read materials at all.
 */
type TraitAbility = 'materials:read' | 'materials:write'

/**
 * The definition's config, or a refusal the master can act on.
 *
 * Read through the schema rather than trusted from the column: a config written by
 * an older build can be anything, and a trait derived from one would be worse than
 * no trait at all.
 */
function readConfig(traitDef: TraitDef): TraitConfig {
  const parsed = traitConfigSchema.safeParse(traitDef.config)

  if (!parsed.success) {
    throw new BadRequestError(`"${traitDef.label}" has a configuration this build cannot read`)
  }

  return parsed.data
}

export function createAssetTraitsService(prisma: PrismaClient, access: CampaignAccessService) {
  /**
   * Every definition attached to one asset, each with its config.
   *
   * The config travels with the trait because a trait cannot be drawn without the
   * fields it declares, and fetching those separately would mean a second round trip
   * per trait.
   */
  async function list(assetId: string): Promise<AssetTraitDto[]> {
    const asset = await access.requireAssetAbility(assetId, 'materials:read')

    const rows = await prisma.assetTrait.findMany({
      where: { assetId: asset.id },
      include: { traitDef: true },
      orderBy: { traitDef: { label: 'asc' } }
    })

    return rows.map(row => ({
      id: row.id,
      traitDef: toTraitDefDto(row.traitDef),
      data: row.data
    }))
  }

  /** Resolves a trait the caller holds `ability` over, with its definition. */
  async function require(id: string, ability: TraitAbility) {
    const trait = await prisma.assetTrait.findUnique({
      where: { id },
      include: { traitDef: true }
    })
    if (!trait) throw new NotFoundError('Trait not found')

    // Through the asset, because that is what the ability is about, and it is also
    // where the campaign comes from rather than from anything the client sent.
    await access.requireAssetAbility(trait.assetId, ability)

    return { trait, traitDef: trait.traitDef }
  }

  /**
   * Attaches a definition to an asset, seeded with the configured defaults.
   *
   * Starting from defaults rather than an empty object means the master sees the
   * sheet they configured from the first moment, and every key the config declares is
   * present before anyone edits anything.
   */
  async function attach(assetId: string, traitDefId: string): Promise<AssetTraitDto> {
    const asset = await access.requireAssetAbility(assetId, 'materials:write')

    // Scoped to the asset's own campaign: an id from elsewhere must not become
    // attachable just because the caller may write in this one.
    const traitDef = await prisma.traitDef.findFirst({
      where: { id: traitDefId, campaignId: asset.campaignId }
    })
    if (!traitDef) throw new NotFoundError('Trait not found')

    const config = readConfig(traitDef)

    const existing = await prisma.assetTrait.findUnique({
      where: { assetId_traitDefId: { assetId: asset.id, traitDefId: traitDef.id } },
      select: { id: true }
    })
    if (existing) throw new BadRequestError(`"${traitDef.label}" is already on this asset`)

    const trait = await prisma.assetTrait.create({
      data: {
        assetId: asset.id,
        traitDefId: traitDef.id,
        data: assetTraitDefaults(config)
      }
    })

    return { id: trait.id, traitDef: toTraitDefDto(traitDef), data: trait.data }
  }

  /**
   * Replaces a trait's values wholesale.
   *
   * Whole rather than per field because the schema validates a trait as one object:
   * a single key checked on its own is checked against nothing, and the schema is
   * strict about which keys may be there at all.
   */
  async function save(id: string, data: unknown): Promise<AssetTraitDto> {
    const { traitDef } = await require(id, 'materials:write')

    const config = readConfig(traitDef)

    // The schema is the only thing that knows what these values may be, so the
    // complaint has to come from there rather than be restated here.
    const result = assetTraitSchema(config).safeParse(data)
    if (!result.success) {
      const issue = result.error.issues[0]
      const path = issue?.path.join('.')

      throw new BadRequestError(
        path ? `Invalid value for "${path}": ${issue?.message}` : 'Invalid values'
      )
    }

    const updated = await prisma.assetTrait.update({
      where: { id },
      data: { data: result.data as AssetTraitData }
    })

    return { id: updated.id, traitDef: toTraitDefDto(traitDef), data: updated.data }
  }

  /** Detaches a definition from an asset, with everything stored for it. */
  async function detach(id: string) {
    const trait = await prisma.assetTrait.findUnique({
      where: { id },
      select: { assetId: true }
    })
    if (!trait) throw new NotFoundError('Trait not found')

    await access.requireAssetAbility(trait.assetId, 'materials:write')

    await prisma.assetTrait.delete({ where: { id } })
  }

  return { list, attach, save, detach }
}

export type AssetTraitsService = ReturnType<typeof createAssetTraitsService>
