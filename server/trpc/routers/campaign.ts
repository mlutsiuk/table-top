import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { CampaignMemberDto } from '#shared/types/campaign'
import { CAMPAIGN_STATUSES } from '#shared/types/campaign'
import { privateProcedure, router } from '../trpc'

export const campaignRouter = router({
  getUserCampaigns: privateProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.campaign.findMany({
      where: {
        OR: [
          { masterId: ctx.auth.id },
          { members: { some: { userId: ctx.auth.id } } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
  }),

  getCampaignDetails: privateProcedure.input(
    z.object({
      campaignId: z.uuid()
    })
  ).query(async ({ input, ctx }) => {
    const { campaign, role } = await ctx.campaignAccess.requireCampaign(input.campaignId)

    return {
      ...campaign,
      role
    }
  }),

  updateCampaign: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      title: z.string().min(1).max(100).optional(),
      status: z.enum(CAMPAIGN_STATUSES).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.campaignAccess.requireMaster(input.campaignId)

      return ctx.prisma.campaign.update({
        where: { id: input.campaignId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.status !== undefined && { status: input.status })
        }
      })
    }),

  createCampaign: privateProcedure.input(
    z.object({
      title: z.string().min(1).max(100)
    })
  ).mutation(async ({ input, ctx }) => {
    return await ctx.prisma.campaign.create({
      data: {
        title: input.title,
        masterId: ctx.auth.id
      }
    })
  }),

  getMembers: privateProcedure
    .input(z.object({ campaignId: z.uuid() }))
    .query(async ({ input, ctx }): Promise<CampaignMemberDto[]> => {
      const { campaign } = await ctx.campaignAccess.requireCampaign(input.campaignId)

      const master = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: campaign.masterId },
        select: { id: true, name: true, email: true }
      })

      const players: Omit<CampaignMemberDto, 'role'>[] = await ctx.prisma.user.findMany({
        where: { memberships: { some: { campaignId: input.campaignId } } },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
      })

      return [
        { ...master, role: 'master' as const },
        ...players.map(player => ({ ...player, role: 'player' as const }))
      ]
    }),

  addPlayer: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      email: z.email()
    }))
    .mutation(async ({ input, ctx }) => {
      const campaign = await ctx.campaignAccess.requireMaster(input.campaignId)

      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No account with that email — they need to sign in once first'
        })
      }

      if (user.id === campaign.masterId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The master is already in the campaign'
        })
      }

      const existing = await ctx.prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId: input.campaignId, userId: user.id } }
      })
      if (existing) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already a player in this campaign' })
      }

      await ctx.prisma.campaignMember.create({
        data: { campaignId: input.campaignId, userId: user.id }
      })

      return { id: user.id, name: user.name, email: user.email, role: 'player' as const }
    }),

  removePlayer: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      userId: z.uuid()
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.campaignAccess.requireMaster(input.campaignId)

      await ctx.prisma.campaignMember.deleteMany({
        where: { campaignId: input.campaignId, userId: input.userId }
      })
    })
})
