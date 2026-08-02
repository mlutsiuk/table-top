import type { PrismaClient } from '@prisma/client'
import type { CampaignMemberDto } from '#shared/types/campaign'
import { BadRequestError, NotFoundError } from '~~/server/infrastructure/errors'
import type { CampaignAccessService } from './campaign-access.service'

/**
 * Administration of who plays in a campaign. Kept apart from the campaign service
 * itself: reading a campaign is something every member does, while this is written
 * to by the master alone.
 */
export function createCampaignMembersService(
  prisma: PrismaClient,
  access: CampaignAccessService
) {
  /** The master first, then the players. Readable by anyone already in the campaign. */
  async function list(campaignId: string): Promise<CampaignMemberDto[]> {
    const { campaign } = await access.requireAbility(campaignId, 'members:read')

    const master = await prisma.user.findUniqueOrThrow({
      where: { id: campaign.masterId },
      select: { id: true, name: true, email: true }
    })

    const players: Omit<CampaignMemberDto, 'role'>[] = await prisma.user.findMany({
      where: { memberships: { some: { campaignId } } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    })

    // Role is attached here rather than read from a column: membership means player.
    return [
      { ...master, role: 'master' },
      ...players.map(player => ({ ...player, role: 'player' as const }))
    ]
  }

  async function add(campaignId: string, email: string): Promise<CampaignMemberDto> {
    const { campaign } = await access.requireAbility(campaignId, 'members:manage')

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new NotFoundError('No account with that email — they need to sign in once first')
    }

    if (user.id === campaign.masterId) {
      throw new BadRequestError('The master is already in the campaign')
    }

    const existing = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: user.id } },
      select: { id: true }
    })
    if (existing) {
      throw new BadRequestError('Already a player in this campaign')
    }

    await prisma.campaignMember.create({
      data: { campaignId, userId: user.id }
    })

    return { id: user.id, name: user.name, email: user.email, role: 'player' }
  }

  async function remove(campaignId: string, userId: string) {
    await access.requireAbility(campaignId, 'members:manage')

    await prisma.campaignMember.deleteMany({ where: { campaignId, userId } })
  }

  return { list, add, remove }
}

export type CampaignMembersService = ReturnType<typeof createCampaignMembersService>
