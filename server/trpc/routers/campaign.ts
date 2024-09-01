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
  createCampaign: privateProcedure.input(
    z.object({
      title: z.string().min(1).max(100)
    })
  ).mutation(async ({ input, ctx }) => {
    const campaign = await ctx.prisma.campaign.create({
      data: {
        title: input.title,
        masterId: ctx.auth.id,
        fundScheme: []
      }
    })

    return campaign
  }),
  updateFundScheme: privateProcedure.input(
    z.object({
      campaignId: z.string().uuid(),
      fundScheme: z.array(
        z.object({
          amount: z.number().int(),
          label: z.string().min(1).max(50)
        })
      )
    })
  ).mutation(async ({ input, ctx }) => {
    const campaign = await ctx.prisma.campaign.update({
      where: {
        id: input.campaignId
      },
      data: {
        fundScheme: input.fundScheme
      }
    })

    return campaign
  })
})
