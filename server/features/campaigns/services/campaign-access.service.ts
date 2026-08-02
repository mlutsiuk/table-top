import type { Campaign, PrismaClient } from '@prisma/client'
import { ForbiddenError, NotFoundError } from '~~/server/infrastructure/errors'
import type { CampaignRole } from '#shared/types/campaign'
import type { CampaignAbility } from '#shared/permissions/campaign'
import { abilitiesFor, hasAbility } from '#shared/permissions/campaign'

/**
 * Access rules, in one place:
 *
 * - the campaign author (`Campaign.masterId`) is the master and may do anything;
 * - anyone with a `CampaignMember` row is a player and may read;
 * - everyone else gets `NOT_FOUND`, not `FORBIDDEN`, so that campaign UUIDs cannot
 *   be probed for existence.
 *
 * What a role may actually do is not decided here — it comes from the shared
 * ability table, so the client checks the very same rules.
 *
 * Deliberately not in `server/utils/`: everything there is auto-imported into every
 * server file, which is the wrong shape for authorisation — a check should be
 * something a module asks for explicitly, not something that happens to be in scope.
 */
export type CampaignAccess = {
  campaign: Campaign
  role: CampaignRole
  abilities: CampaignAbility[]
}

const notFound = (message: string) => new NotFoundError(message)

/**
 * Bound to one caller for the duration of a request, so the rules read as
 * questions about "me" rather than repeating prisma and a user id everywhere.
 */
export function createCampaignAccessService(prisma: PrismaClient, userId: string) {
  /** Resolves the caller's standing in a campaign, or throws if they have none. */
  async function requireCampaign(campaignId: string): Promise<CampaignAccess> {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw notFound('Campaign not found')

    if (campaign.masterId === userId) {
      return { campaign, role: 'master', abilities: abilitiesFor('master') }
    }

    const membership = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
      select: { id: true }
    })
    if (!membership) throw notFound('Campaign not found')

    // A membership row means player, always — the master never has one.
    return { campaign, role: 'player', abilities: abilitiesFor('player') }
  }

  /**
   * The caller's standing, provided it carries `ability`.
   *
   * Named after the ability rather than the role so the guard reads like the
   * client-side check that hides the same action.
   */
  async function requireAbility(
    campaignId: string,
    ability: CampaignAbility
  ): Promise<CampaignAccess> {
    const access = await requireCampaign(campaignId)

    if (!hasAbility(access.abilities, ability)) {
      throw new ForbiddenError(`Not allowed to ${ability.replace(':', ' ')} in this campaign`)
    }

    return access
  }

  /**
   * Resolves a folder the caller holds `ability` over, checking the owning
   * campaign. Returns the folder so callers can read `campaignId` off it instead
   * of trusting one sent by the client.
   */
  async function requireFolderAbility(folderId: string, ability: CampaignAbility) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } })
    if (!folder) throw notFound('Folder not found')

    await requireAbility(folder.campaignId, ability)

    return folder
  }

  /** Same idea for assets. */
  async function requireAssetAbility(assetId: string, ability: CampaignAbility) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } })
    if (!asset) throw notFound('Asset not found')

    await requireAbility(asset.campaignId, ability)

    return asset
  }

  return {
    requireCampaign,
    requireAbility,
    requireFolderAbility,
    requireAssetAbility
  }
}

export type CampaignAccessService = ReturnType<typeof createCampaignAccessService>
