import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

export const assetTraitRouter = router({
  list: privateProcedure
    .input(z.object({ assetId: z.uuid() }))
    .query(({ input, ctx }) => ctx.assetTraits.list(input.assetId)),

  attach: privateProcedure
    .input(z.object({ assetId: z.uuid(), traitDefId: z.uuid() }))
    .mutation(({ input, ctx }) => ctx.assetTraits.attach(input.assetId, input.traitDefId)),

  /** The whole trait, because that is the unit its schema validates. */
  save: privateProcedure
    .input(z.object({ id: z.uuid(), data: z.unknown() }))
    .mutation(({ input, ctx }) => ctx.assetTraits.save(input.id, input.data)),

  detach: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input, ctx }) => ctx.assetTraits.detach(input.id))
})
