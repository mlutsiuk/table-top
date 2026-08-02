import type { PrismaClient } from '@prisma/client'
import type { CampaignDto, CampaignStatus } from '#shared/types/campaign'
import { toCampaignDto } from '../responses/campaign.dto'
import type { CampaignAccessService } from './campaign-access.service'

export function createCampaignsService(
  prisma: PrismaClient,
  access: CampaignAccessService,
  userId: string
) {
  /** Campaigns the caller masters, plus the ones they were invited to play. */
  async function listMine(): Promise<CampaignDto[]> {
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { masterId: userId },
          { members: { some: { userId } } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    // Role is known without another query: everything here is either mine or one
    // I was invited to.
    return campaigns.map(campaign =>
      toCampaignDto(campaign, campaign.masterId === userId ? 'master' : 'player')
    )
  }

  async function getById(campaignId: string): Promise<CampaignDto> {
    const { campaign, role } = await access.requireCampaign(campaignId)

    return toCampaignDto(campaign, role)
  }

  async function create(title: string): Promise<CampaignDto> {
    const campaign = await prisma.campaign.create({
      data: { title, masterId: userId }
    })

    return toCampaignDto(campaign, 'master')
  }

  async function update(
    campaignId: string,
    data: { title?: string, status?: CampaignStatus }
  ): Promise<CampaignDto> {
    await access.requireAbility(campaignId, 'campaign:update')

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.status !== undefined && { status: data.status })
      }
    })

    return toCampaignDto(campaign, 'master')
  }

  return { listMine, getById, create, update }
}

export type CampaignsService = ReturnType<typeof createCampaignsService>
