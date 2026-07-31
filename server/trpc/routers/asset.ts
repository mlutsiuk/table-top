import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

export const assetRouter = router({
  getById: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const asset = await ctx.prisma.asset.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' })
      }
      return asset
    }),

  saveContent: privateProcedure
    .input(z.object({
      id: z.string().uuid(),
      content: z.any()
    }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.prisma.asset.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' })
      }
      return ctx.prisma.asset.update({
        where: { id: input.id },
        data: { content: input.content }
      })
    }),

  create: privateProcedure
    .input(z.object({
      campaignId: z.string().uuid(),
      folderId: z.string().uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.prisma.folder.findFirst({
        where: { id: input.folderId, campaign: { masterId: ctx.auth.id } }
      })
      if (!folder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Folder not found' })
      }

      return ctx.prisma.asset.create({
        data: {
          title: input.title,
          campaignId: input.campaignId,
          folderId: input.folderId
        }
      })
    }),

  rename: privateProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.prisma.asset.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' })
      }

      return ctx.prisma.asset.update({
        where: { id: input.id },
        data: { title: input.title }
      })
    }),

  delete: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.prisma.asset.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' })
      }

      await ctx.prisma.asset.delete({ where: { id: input.id } })
    }),

  move: privateProcedure
    .input(z.object({
      id: z.string().uuid(),
      folderId: z.string().uuid()
    }))
    .mutation(async ({ input, ctx }) => {
      const asset = await ctx.prisma.asset.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!asset) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Asset not found' })
      }

      return ctx.prisma.asset.update({
        where: { id: input.id },
        data: { folderId: input.folderId }
      })
    })
})
