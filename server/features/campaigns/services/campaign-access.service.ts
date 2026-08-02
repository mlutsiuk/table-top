import type { Campaign, PrismaClient } from '@prisma/client'
import { ForbiddenError, NotFoundError } from '~~/server/infrastructure/errors'
import type { CampaignRole } from '#shared/types/campaign'

/**
 * Access rules, in one place:
 *
 * - the campaign author (`Campaign.masterId`) is the master and may do anything;
 * - anyone with a `CampaignMember` row is a player and may read;
 * - everyone else gets `NOT_FOUND`, not `FORBIDDEN`, so that campaign UUIDs cannot
 *   be probed for existence.
 *
 * Deliberately not in `server/utils/`: everything there is auto-imported into every
 * server file, which is the wrong shape for authorisation — a check should be
 * something a module asks for explicitly, not something that happens to be in scope.
 */
export type CampaignAccess = {
  campaign: Campaign
  role: CampaignRole
}

const notFound = (message: string) => new NotFoundError(message)

/**
 * Bound to one caller for the duration of a request, so the rules read as
 * questions about "me" rather than repeating prisma and a user id everywhere.
 */
export function createCampaignAccessService(prisma: PrismaClient, userId: string) {
  /** Resolves the caller's role in a campaign, or throws if they have none. */
  async function requireCampaign(campaignId: string): Promise<CampaignAccess> {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw notFound('Campaign not found')

    if (campaign.masterId === userId) {
      return { campaign, role: 'master' }
    }

    const membership = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
      select: { id: true }
    })
    if (!membership) throw notFound('Campaign not found')

    // A membership row means player, always — the master never has one.
    return { campaign, role: 'player' }
  }

  /** Same, but rejects players — for anything that writes. */
  async function requireMaster(campaignId: string): Promise<Campaign> {
    const { campaign, role } = await requireCampaign(campaignId)

    if (role !== 'master') {
      throw new ForbiddenError('Only the campaign master can do this')
    }

    return campaign
  }

  /**
   * Resolves a folder the caller may write to, checking the owning campaign.
   * Returns the folder so callers can read `campaignId` off it instead of
   * trusting one sent by the client.
   */
  async function requireWritableFolder(folderId: string) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } })
    if (!folder) throw notFound('Folder not found')

    await requireMaster(folder.campaignId)

    return folder
  }

  /** Same idea for assets. */
  async function requireWritableAsset(assetId: string) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } })
    if (!asset) throw notFound('Asset not found')

    await requireMaster(asset.campaignId)

    return asset
  }

  return {
    requireCampaign,
    requireMaster,
    requireWritableFolder,
    requireWritableAsset
  }
}

export type CampaignAccessService = ReturnType<typeof createCampaignAccessService>
