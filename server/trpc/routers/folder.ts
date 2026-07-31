import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

async function deleteFolderRecursive(prisma: any, folderId: string) {
  const subFolders = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true }
  })

  for (const sub of subFolders) {
    await deleteFolderRecursive(prisma, sub.id)
  }

  await prisma.folder.delete({ where: { id: folderId } })
}

export const folderRouter = router({
  getTree: privateProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const campaign = await ctx.prisma.campaign.findFirst({
        where: { id: input.campaignId, masterId: ctx.auth.id }
      })
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
      }

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
      const campaign = await ctx.prisma.campaign.findFirst({
        where: { id: input.campaignId, masterId: ctx.auth.id }
      })
      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' })
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
      const folder = await ctx.prisma.folder.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!folder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Folder not found' })
      }

      return ctx.prisma.folder.update({
        where: { id: input.id },
        data: { title: input.title }
      })
    }),

  delete: privateProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.prisma.folder.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!folder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Folder not found' })
      }

      await deleteFolderRecursive(ctx.prisma, input.id)
    }),

  move: privateProcedure
    .input(z.object({
      id: z.string().uuid(),
      parentId: z.string().uuid().nullable()
    }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.prisma.folder.findFirst({
        where: { id: input.id, campaign: { masterId: ctx.auth.id } }
      })
      if (!folder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Folder not found' })
      }

      if (input.parentId) {
        // Prevent moving a folder into its own subtree
        async function isDescendant(ancestorId: string, targetId: string): Promise<boolean> {
          if (ancestorId === targetId) return true
          const children = await ctx.prisma.folder.findMany({
            where: { parentId: ancestorId },
            select: { id: true }
          })
          for (const child of children) {
            if (await isDescendant(child.id, targetId)) return true
          }
          return false
        }
        if (await isDescendant(input.id, input.parentId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot move a folder into its own subtree' })
        }
      }

      return ctx.prisma.folder.update({
        where: { id: input.id },
        data: { parentId: input.parentId }
      })
    })
})
