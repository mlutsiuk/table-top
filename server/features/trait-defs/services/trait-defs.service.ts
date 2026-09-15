import type { PrismaClient, TraitDef } from '@prisma/client'
import type { TraitConfig } from '~~/engine/traits'
import type { TraitDefDto } from '~~/engine/traits/dto'
import type { CampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import type { TraitConfigImpact } from '#shared/types/trait'
import { orphanedKeys, traitConfigSchema, traitKeySchema } from '~~/engine/traits'
import { toTraitDefDto } from '~~/server/features/trait-defs/trait-def-dto'
import { BadRequestError, NotFoundError } from '~~/server/infrastructure/errors'

/**
 * Turns a Zod rejection into something a master can act on. The schema is the only
 * place that knows what a valid config looks like, so the message has to come from
 * there rather than being restated here.
 */
function parseConfig(config: unknown): TraitConfig {
  const result = traitConfigSchema.safeParse(config)

  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path.join('.')

    throw new BadRequestError(
      path ? `Invalid configuration at ${path}: ${issue?.message}` : 'Invalid configuration'
    )
  }

  return result.data
}

/** The key formulas will address this definition by, or a refusal saying why not. */
function parseKey(key: string): string {
  const result = traitKeySchema.safeParse(key)

  if (!result.success) {
    throw new BadRequestError(`Invalid key "${key}": ${result.error.issues[0]?.message}`)
  }

  return result.data
}

export function createTraitDefsService(prisma: PrismaClient, access: CampaignAccessService) {
  async function list(campaignId: string): Promise<TraitDefDto[]> {
    await access.requireAbility(campaignId, 'traits:read')

    const rows = await prisma.traitDef.findMany({
      where: { campaignId },
      orderBy: { label: 'asc' }
    })

    return rows.map(toTraitDefDto)
  }

  /** Resolves a definition the caller holds `ability` over. */
  async function require(id: string, ability: 'traits:read' | 'traits:manage') {
    const traitDef = await prisma.traitDef.findUnique({ where: { id } })
    if (!traitDef)
      throw new NotFoundError('Trait not found')

    await access.requireAbility(traitDef.campaignId, ability)

    return traitDef
  }

  /**
   * Creates a definition under a key that is fixed from here on.
   *
   * The key is what formulas will address, so it is chosen once, up front. The label
   * is only what the master sees and can change freely afterwards.
   */
  async function create(input: { campaignId: string, key: string, label: string }): Promise<TraitDefDto> {
    await access.requireAbility(input.campaignId, 'traits:manage')

    const key = parseKey(input.key)

    // Starts from an empty config, so the very first save goes through the same
    // validation as every later one.
    const config = parseConfig({ fields: [] })

    const taken = await prisma.traitDef.findFirst({
      where: { campaignId: input.campaignId, OR: [{ key }, { label: input.label }] },
      select: { key: true }
    })
    if (taken?.key === key)
      throw new BadRequestError(`The key "${key}" is already used in this campaign`)
    if (taken)
      throw new BadRequestError(`A trait named "${input.label}" already exists`)

    const traitDef = await prisma.traitDef.create({
      data: { campaignId: input.campaignId, key, label: input.label, config }
    })

    return toTraitDefDto(traitDef)
  }

  /** Changes what the master sees. The key stays, so no formula can break. */
  async function rename(id: string, label: string): Promise<TraitDefDto> {
    const traitDef = await require(id, 'traits:manage')

    const taken = await prisma.traitDef.findUnique({
      where: { campaignId_label: { campaignId: traitDef.campaignId, label } },
      select: { id: true }
    })
    if (taken && taken.id !== id) {
      throw new BadRequestError(`A trait named "${label}" already exists`)
    }

    return toTraitDefDto(await prisma.traitDef.update({ where: { id }, data: { label } }))
  }

  /**
   * What saving this config would destroy.
   *
   * Asked before saving, so the master is told how much data a field removal costs
   * rather than discovering it afterwards.
   */
  async function configImpact(id: string, config: unknown): Promise<TraitConfigImpact> {
    await require(id, 'traits:manage')

    const next = parseConfig(config)

    const traits = await prisma.assetTrait.findMany({
      where: { traitDefId: id },
      select: { data: true }
    })

    const removedKeys = new Set<string>()
    let affectedAssets = 0

    for (const trait of traits) {
      const orphans = orphanedKeys(next, trait.data)
      if (orphans.length === 0)
        continue

      affectedAssets++
      for (const key of orphans) removedKeys.add(key)
    }

    return { removedKeys: [...removedKeys], affectedAssets }
  }

  /**
   * Saves a config and strips values it no longer declares.
   *
   * The cleanup is deliberate rather than lazy: leaving orphaned keys in JSONB would
   * keep data no UI can reach and no schema accepts on the next write. `configImpact`
   * exists so this is never a surprise.
   */
  async function updateConfig(id: string, config: unknown): Promise<TraitDefDto> {
    await require(id, 'traits:manage')

    const next = parseConfig(config)

    const traits = await prisma.assetTrait.findMany({
      where: { traitDefId: id },
      select: { id: true, data: true }
    })

    const cleanups = traits.flatMap((trait) => {
      const orphans = orphanedKeys(next, trait.data)
      if (orphans.length === 0)
        return []

      const kept = Object.fromEntries(
        Object.entries(trait.data).filter(([key]) => !orphans.includes(key))
      )

      return [prisma.assetTrait.update({ where: { id: trait.id }, data: { data: kept } })]
    })

    const [updated] = await prisma.$transaction([
      prisma.traitDef.update({ where: { id }, data: { config: next } }),
      ...cleanups
    ])

    return toTraitDefDto(updated as TraitDef)
  }

  async function remove(id: string) {
    await require(id, 'traits:manage')

    // Asset and entity traits go with it through the cascade on the schema.
    await prisma.traitDef.delete({ where: { id } })
  }

  return { list, create, rename, configImpact, updateConfig, remove }
}

export type TraitDefsService = ReturnType<typeof createTraitDefsService>
