import { z } from 'zod'
import { MATERIAL_VISIBILITIES } from '#shared/permissions/material'
import { privateProcedure, router } from '../trpc'

export const assetRouter = router({
  getById: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .query(({ input, ctx }) => ctx.assets.getById(input.id)),

  create: privateProcedure
    .input(z.object({
      folderId: z.uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(({ input, ctx }) => ctx.assets.create(input.folderId, input.title)),

  rename: privateProcedure
    .input(z.object({
      id: z.uuid(),
      title: z.string().min(1).max(100)
    }))
    .mutation(({ input, ctx }) => ctx.assets.rename(input.id, input.title)),

  saveContent: privateProcedure
    .input(z.object({
      id: z.uuid(),
      content: z.any()
    }))
    .mutation(({ input, ctx }) => ctx.assets.saveContent(input.id, input.content)),

  delete: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input, ctx }) => ctx.assets.remove(input.id)),

  setVisibility: privateProcedure
    .input(z.object({
      id: z.uuid(),
      visibility: z.enum(MATERIAL_VISIBILITIES)
    }))
    .mutation(({ input, ctx }) => ctx.assets.setVisibility(input.id, input.visibility)),

  move: privateProcedure
    .input(z.object({
      id: z.uuid(),
      folderId: z.uuid()
    }))
    .mutation(({ input, ctx }) => ctx.assets.move(input.id, input.folderId))
})
