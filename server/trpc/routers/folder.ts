import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

export const folderRouter = router({
  getTree: privateProcedure
    .input(z.object({ campaignId: z.uuid() }))
    .query(({ input, ctx }) => ctx.folders.getTree(input.campaignId)),

  create: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      parentId: z.uuid().optional(),
      title: z.string().min(1).max(100)
    }))
    .mutation(({ input, ctx }) => ctx.folders.create(input)),

  rename: privateProcedure
    .input(z.object({
      id: z.uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(({ input, ctx }) => ctx.folders.rename(input.id, input.title)),

  delete: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input, ctx }) => ctx.folders.remove(input.id)),

  move: privateProcedure
    .input(z.object({
      id: z.uuid(),
      parentId: z.uuid().nullable()
    }))
    .mutation(({ input, ctx }) => ctx.folders.move(input.id, input.parentId))
})
