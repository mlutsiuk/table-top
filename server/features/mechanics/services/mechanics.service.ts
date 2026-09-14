import type { Mechanic, PrismaClient } from '@prisma/client'
import type { MechanicConfigImpact } from '#shared/types/mechanic'
import type { MechanicDto } from '~~/engine/mechanics/dto'
import type { ValuesConfig } from '~~/engine/mechanics/values-v1'
import type { CampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import { BadRequestError, NotFoundError } from '~~/server/infrastructure/errors'
import { orphanedKeys, valuesConfigSchema } from '~~/engine/mechanics/values-v1'
import { toMechanicDto } from '~~/server/features/mechanics/mechanic-dto'

/**
 * Every row still carries the `key` column from when a mechanic could be one of
 * several kinds. There is one kind now and nothing branches on it (ADR-013), so it
 * is written as a constant. The column itself goes with the TraitDef migration.
 */
const LEGACY_KEY = 'values-v1'

/**
 * Turns a Zod rejection into something a master can act on. The schema is the only
 * place that knows what a valid config looks like, so the message has to come from
 * there rather than being restated here.
 */
function parseConfig(config: unknown): ValuesConfig {
  const result = valuesConfigSchema.safeParse(config)

  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path.join('.')

    throw new BadRequestError(
      path ? `Invalid configuration at ${path}: ${issue?.message}` : 'Invalid configuration'
    )
  }

  return result.data
}

export function createMechanicsService(prisma: PrismaClient, access: CampaignAccessService) {
  async function list(campaignId: string): Promise<MechanicDto[]> {
    await access.requireAbility(campaignId, 'mechanics:read')

    const rows = await prisma.mechanic.findMany({
      where: { campaignId },
      orderBy: { name: 'asc' }
    })

    return rows.map(toMechanicDto)
  }

  /** Resolves a mechanic the caller holds `ability` over. */
  async function require(id: string, ability: 'mechanics:read' | 'mechanics:manage') {
    const mechanic = await prisma.mechanic.findUnique({ where: { id } })
    if (!mechanic) throw new NotFoundError('Mechanic not found')

    await access.requireAbility(mechanic.campaignId, ability)

    return mechanic
  }

  async function create(input: { campaignId: string, name: string }): Promise<MechanicDto> {
    await access.requireAbility(input.campaignId, 'mechanics:manage')

    // Starts from an empty config, so the very first save goes through the same
    // validation as every later one.
    const config = parseConfig({ fields: [] })

    const taken = await prisma.mechanic.findUnique({
      where: { campaignId_name: { campaignId: input.campaignId, name: input.name } },
      select: { id: true }
    })
    if (taken) throw new BadRequestError(`A mechanic named "${input.name}" already exists`)

    const mechanic = await prisma.mechanic.create({
      data: { campaignId: input.campaignId, key: LEGACY_KEY, name: input.name, config }
    })

    return toMechanicDto(mechanic)
  }

  async function rename(id: string, name: string): Promise<MechanicDto> {
    const mechanic = await require(id, 'mechanics:manage')

    const taken = await prisma.mechanic.findUnique({
      where: { campaignId_name: { campaignId: mechanic.campaignId, name } },
      select: { id: true }
    })
    if (taken && taken.id !== id) {
      throw new BadRequestError(`A mechanic named "${name}" already exists`)
    }

    return toMechanicDto(await prisma.mechanic.update({ where: { id }, data: { name } }))
  }

  /**
   * What saving this config would destroy.
   *
   * Asked before saving, so the master is told how much data a field removal costs
   * rather than discovering it afterwards.
   */
  async function configImpact(id: string, config: unknown): Promise<MechanicConfigImpact> {
    await require(id, 'mechanics:manage')

    const next = parseConfig(config)

    const traits = await prisma.assetTrait.findMany({
      where: { mechanicId: id },
      select: { data: true }
    })

    const removedKeys = new Set<string>()
    let affectedAssets = 0

    for (const trait of traits) {
      const orphans = orphanedKeys(next, trait.data)
      if (orphans.length === 0) continue

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
  async function updateConfig(id: string, config: unknown): Promise<MechanicDto> {
    await require(id, 'mechanics:manage')

    const next = parseConfig(config)

    const traits = await prisma.assetTrait.findMany({
      where: { mechanicId: id },
      select: { id: true, data: true }
    })

    const cleanups = traits.flatMap((trait) => {
      const orphans = orphanedKeys(next, trait.data)
      if (orphans.length === 0) return []

      const kept = Object.fromEntries(
        Object.entries(trait.data).filter(([key]) => !orphans.includes(key))
      )

      return [prisma.assetTrait.update({ where: { id: trait.id }, data: { data: kept } })]
    })

    const [updated] = await prisma.$transaction([
      prisma.mechanic.update({ where: { id }, data: { config: next } }),
      ...cleanups
    ])

    return toMechanicDto(updated as Mechanic)
  }

  async function remove(id: string) {
    await require(id, 'mechanics:manage')

    // Asset traits go with it through the cascade on the schema.
    await prisma.mechanic.delete({ where: { id } })
  }

  return { list, create, rename, configImpact, updateConfig, remove }
}

export type MechanicsService = ReturnType<typeof createMechanicsService>
