import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

export const assetRouter = router({
  getById: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input, ctx }) => {
      const asset = await ctx.prisma.asset.findUnique({ where: { id: input.id } })
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' })
      }

      await ctx.campaignAccess.requireCampaign(asset.campaignId)

      return asset
    }),

  saveContent: privateProcedure
    .input(z.object({
      id: z.uuid(),
      content: z.any()
    }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.campaignAccess.requireWritableAsset(input.id)

      return ctx.prisma.asset.update({
        where: { id: asset.id },
        data: { content: input.content }
      })
    }),

  create: privateProcedure
    .input(z.object({
      folderId: z.uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.campaignAccess.requireWritableFolder(input.folderId)

      return ctx.prisma.asset.create({
        data: {
          title: input.title,
          campaignId: folder.campaignId,
          folderId: folder.id
        }
      })
    }),

  rename: privateProcedure
    .input(z.object({
      id: z.uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.campaignAccess.requireWritableAsset(input.id)

      return ctx.prisma.asset.update({
        where: { id: asset.id },
        data: { title: input.title }
      })
    }),

  delete: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.campaignAccess.requireWritableAsset(input.id)

      await ctx.prisma.asset.delete({ where: { id: asset.id } })
    }),

  move: privateProcedure
    .input(z.object({
      id: z.uuid(),
      folderId: z.uuid()
    }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.campaignAccess.requireWritableAsset(input.id)

      const target = await ctx.prisma.folder.findFirst({
        where: { id: input.folderId, campaignId: asset.campaignId }
      })
      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Target folder not found' })
      }

      return ctx.prisma.asset.update({
        where: { id: asset.id },
        data: { folderId: target.id }
      })
    })
})
