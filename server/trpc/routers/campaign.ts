import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

export const campaignRouter = router({
  getUserCampaigns: privateProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.campaign.findMany({
      where: {
        masterId: ctx.auth.id
      }
    })
  }),
  getCampaignDetails: privateProcedure.input(
    z.object({
      campaignId: z.string().uuid()
    })
  ).query(async ({ input, ctx }) => {
    return await ctx.prisma.campaign.findFirst({
      where: {
        id: input.campaignId
      }
    })
  }),
  updateCampaign: privateProcedure
    .input(z.object({
      campaignId: z.string().uuid(),
      title: z.string().min(1).max(100).optional(),
      status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const campaign = await ctx.prisma.campaign.findFirst({
        where: { id: input.campaignId, masterId: ctx.auth.id }
      })
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
      }
      return ctx.prisma.campaign.update({
        where: { id: input.campaignId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.status !== undefined && { status: input.status }),
        }
      })
    }),

  createCampaign: privateProcedure.input(
    z.object({
      title: z.string().min(1).max(100)
    })
  ).mutation(async ({ input, ctx }) => {
    const campaign = await ctx.prisma.campaign.create({
      data: {
        title: input.title,
        masterId: ctx.auth.id
      }
    })

    return campaign
  }),
  // updateFundScheme: privateProcedure.input(
  //   z.object({
  //     campaignId: z.string().uuid(),
  //     fundScheme: z.array(
  //       z.object({
  //         amount: z.number().int(),
  //         label: z.string().min(1).max(50)
  //       })
  //     )
  //   })
  // ).mutation(async ({ input, ctx }) => {
  //   const sortedScheme = input.fundScheme
  //     .slice()
  //     .sort((a, b) => a.amount - b.amount)

  //   const campaign = await ctx.prisma.campaign.update({
  //     where: {
  //       id: input.campaignId
  //     },
  //     data: {
  //       fundScheme: sortedScheme
  //     }
  //   })

  //   return campaign
  // })
})
