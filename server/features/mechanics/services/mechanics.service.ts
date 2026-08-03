import type { Mechanic, PrismaClient } from '@prisma/client'
import type { MechanicConfig, MechanicConfigImpact, MechanicDto } from '#shared/types/mechanic'
import type { CampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import { BadRequestError, NotFoundError } from '~~/server/infrastructure/errors'
import { findMechanic, listMechanics } from '~~/engine/mechanics/registry'
import type { MechanicDef } from '~~/engine/mechanics/types'

function toDto(mechanic: Mechanic): MechanicDto {
  return {
    id: mechanic.id,
    key: mechanic.key,
    name: mechanic.name,
    config: mechanic.config as MechanicConfig
  }
}

/**
 * Turns a Zod rejection into something a master can act on. The mechanic's schema
 * is the only place that knows what a valid config looks like, so the message has
 * to come from there rather than being restated here.
 */
function parseConfig(def: MechanicDef, config: unknown): MechanicConfig {
  const result = def.configSchema.safeParse(config)

  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path.join('.')

    throw new BadRequestError(
      path ? `Invalid configuration at ${path}: ${issue?.message}` : 'Invalid configuration'
    )
  }

  return result.data as MechanicConfig
}

export function createMechanicsService(prisma: PrismaClient, access: CampaignAccessService) {
  /** The definitions a master can pick from. Same list for every campaign. */
  function available() {
    return listMechanics()
  }

  async function list(campaignId: string): Promise<MechanicDto[]> {
    await access.requireAbility(campaignId, 'mechanics:read')

    const mechanics = await prisma.mechanic.findMany({
      where: { campaignId },
      orderBy: { name: 'asc' }
    })

    return mechanics.map(toDto)
  }

  /** Resolves a mechanic the caller holds `ability` over, with its definition. */
  async function require(id: string, ability: 'mechanics:read' | 'mechanics:manage') {
    const mechanic = await prisma.mechanic.findUnique({ where: { id } })
    if (!mechanic) throw new NotFoundError('Mechanic not found')

    await access.requireAbility(mechanic.campaignId, ability)

    const def = findMechanic(mechanic.key)
    if (!def) {
      // The row names a definition this build does not have — a mechanic was
      // removed from the code while campaigns still used it.
      throw new NotFoundError(`Unknown mechanic type "${mechanic.key}"`)
    }

    return { mechanic, def }
  }

  async function create(input: { campaignId: string, key: string, name: string }): Promise<MechanicDto> {
    await access.requireAbility(input.campaignId, 'mechanics:manage')

    const def = findMechanic(input.key)
    if (!def) throw new BadRequestError(`Unknown mechanic type "${input.key}"`)

    // Starts from whatever the mechanic considers an empty config, so the very
    // first save goes through the same validation as every later one.
    const config = parseConfig(def, { fields: [] })

    const taken = await prisma.mechanic.findUnique({
      where: { campaignId_name: { campaignId: input.campaignId, name: input.name } },
      select: { id: true }
    })
    if (taken) throw new BadRequestError(`A mechanic named "${input.name}" already exists`)

    const mechanic = await prisma.mechanic.create({
      data: { campaignId: input.campaignId, key: input.key, name: input.name, config }
    })

    return toDto(mechanic)
  }

  async function rename(id: string, name: string): Promise<MechanicDto> {
    const { mechanic } = await require(id, 'mechanics:manage')

    const taken = await prisma.mechanic.findUnique({
      where: { campaignId_name: { campaignId: mechanic.campaignId, name } },
      select: { id: true }
    })
    if (taken && taken.id !== id) {
      throw new BadRequestError(`A mechanic named "${name}" already exists`)
    }

    return toDto(await prisma.mechanic.update({ where: { id }, data: { name } }))
  }

  /**
   * What saving this config would destroy.
   *
   * Asked before saving, so the master is told how much data a field removal
   * costs rather than discovering it afterwards.
   */
  async function configImpact(id: string, config: unknown): Promise<MechanicConfigImpact> {
    const { mechanic, def } = await require(id, 'mechanics:manage')

    const next = parseConfig(def, config)

    const traits = await prisma.assetTrait.findMany({
      where: { mechanicId: id },
      select: { data: true }
    })

    const removedKeys = new Set<string>()
    let affectedAssets = 0

    for (const trait of traits) {
      const orphans = def.orphanedKeys(next, trait.data as Record<string, unknown>)
      if (orphans.length === 0) continue

      affectedAssets++
      for (const key of orphans) removedKeys.add(key)
    }

    return { removedKeys: [...removedKeys], affectedAssets }
  }

  /**
   * Saves a config and strips values it no longer declares.
   *
   * The cleanup is deliberate rather than lazy: leaving orphaned keys in JSONB
   * would keep data no UI can reach and no schema accepts on the next write.
   * `configImpact` exists so this is never a surprise.
   */
  async function updateConfig(id: string, config: unknown): Promise<MechanicDto> {
    const { def } = await require(id, 'mechanics:manage')

    const next = parseConfig(def, config)

    const traits = await prisma.assetTrait.findMany({
      where: { mechanicId: id },
      select: { id: true, data: true }
    })

    const cleanups = traits.flatMap((trait) => {
      const data = trait.data as Record<string, unknown>
      const orphans = def.orphanedKeys(next, data)
      if (orphans.length === 0) return []

      const kept = Object.fromEntries(
        Object.entries(data).filter(([key]) => !orphans.includes(key))
      )

      return [prisma.assetTrait.update({ where: { id: trait.id }, data: { data: kept } })]
    })

    const [updated] = await prisma.$transaction([
      prisma.mechanic.update({ where: { id }, data: { config: next } }),
      ...cleanups
    ])

    return toDto(updated as Mechanic)
  }

  async function remove(id: string) {
    await require(id, 'mechanics:manage')

    // Asset traits go with it through the cascade on the schema.
    await prisma.mechanic.delete({ where: { id } })
  }

  return { available, list, create, rename, configImpact, updateConfig, remove }
}

export type MechanicsService = ReturnType<typeof createMechanicsService>
