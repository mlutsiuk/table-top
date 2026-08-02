import { z } from 'zod'
import { CAMPAIGN_STATUSES } from '#shared/types/campaign'
import { privateProcedure, router } from '../trpc'

export const campaignRouter = router({
  getUserCampaigns: privateProcedure
    .query(({ ctx }) => ctx.campaigns.listMine()),

  getCampaignDetails: privateProcedure
    .input(z.object({ campaignId: z.uuid() }))
    .query(({ input, ctx }) => ctx.campaigns.getById(input.campaignId)),

  createCampaign: privateProcedure
    .input(z.object({ title: z.string().min(1).max(100) }))
    .mutation(({ input, ctx }) => ctx.campaigns.create(input.title)),

  updateCampaign: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      title: z.string().min(1).max(100).optional(),
      // Driven by the shared union, so a new status cannot be added without the
      // API accepting it — and a typo here stops being possible.
      status: z.enum(CAMPAIGN_STATUSES).optional()
    }))
    .mutation(({ input, ctx }) => ctx.campaigns.update(input.campaignId, {
      title: input.title,
      status: input.status
    })),

  getMembers: privateProcedure
    .input(z.object({ campaignId: z.uuid() }))
    .query(({ input, ctx }) => ctx.campaignMembers.list(input.campaignId)),

  addPlayer: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      email: z.email()
    }))
    .mutation(({ input, ctx }) => ctx.campaignMembers.add(input.campaignId, input.email)),

  removePlayer: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      userId: z.uuid()
    }))
    .mutation(({ input, ctx }) => ctx.campaignMembers.remove(input.campaignId, input.userId))
})
