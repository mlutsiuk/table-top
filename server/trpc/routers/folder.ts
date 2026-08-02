import { TRPCError } from '@trpc/server'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

async function isDescendant(prisma: PrismaClient, ancestorId: string, candidateId: string) {
  let currentId: string | null = candidateId
  const visited = new Set<string>()

  while (currentId) {
    if (currentId === ancestorId) return true

    if (visited.has(currentId)) return false
    visited.add(currentId)


    const current: { parentId: string | null } | null = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    })
    currentId = current?.parentId ?? null
  }

  return false
}

export const folderRouter = router({
  getTree: privateProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await ctx.campaignAccess.requireCampaign(input.campaignId)

      const [folders, assets] = await Promise.all([
        ctx.prisma.folder.findMany({
          where: { campaignId: input.campaignId },
          select: { id: true, title: true, parentId: true }
        }),
        ctx.prisma.asset.findMany({
          where: { campaignId: input.campaignId },
          select: { id: true, title: true, folderId: true }
        })
      ])

      return { folders, assets }
    }),

  create: privateProcedure
    .input(z.object({
      campaignId: z.string().uuid(),
      parentId: z.string().uuid().optional(),
      title: z.string().min(1).max(100)
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.campaignAccess.requireMaster(input.campaignId)

      if (input.parentId) {
        const parent = await ctx.prisma.folder.findFirst({
          where: { id: input.parentId, campaignId: input.campaignId }
        })
        if (!parent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Parent folder not found' })
        }
      }

      return ctx.prisma.folder.create({
        data: {
          title: input.title,
          campaignId: input.campaignId,
          parentId: input.parentId ?? null
        }
      })
    }),

  rename: privateProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.campaignAccess.requireWritableFolder(input.id)

      return ctx.prisma.folder.update({
        where: { id: folder.id },
        data: { title: input.title }
      })
    }),

  delete: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.campaignAccess.requireWritableFolder(input.id)

      await ctx.prisma.folder.delete({ where: { id: folder.id } })
    }),

  move: privateProcedure
    .input(z.object({
      id: z.string().uuid(),
      parentId: z.string().uuid().nullable()
    }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.campaignAccess.requireWritableFolder(input.id)

      if (input.parentId) {
        const target = await ctx.prisma.folder.findFirst({
          where: { id: input.parentId, campaignId: folder.campaignId }
        })
        if (!target) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Target folder not found' })
        }

        if (await isDescendant(ctx.prisma, folder.id, target.id)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot move a folder into its own subtree' })
        }
      }

      return ctx.prisma.folder.update({
        where: { id: folder.id },
        data: { parentId: input.parentId }
      })
    })
})
