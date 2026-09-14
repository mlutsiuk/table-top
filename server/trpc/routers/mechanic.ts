import { z } from 'zod'
import { privateProcedure, router } from '../trpc'

const mechanicName = z.string().min(1).max(60)

export const mechanicRouter = router({
  list: privateProcedure
    .input(z.object({ campaignId: z.uuid() }))
    .query(({ input, ctx }) => ctx.mechanics.list(input.campaignId)),

  create: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      name: mechanicName
    }))
    .mutation(({ input, ctx }) => ctx.mechanics.create(input)),

  rename: privateProcedure
    .input(z.object({ id: z.uuid(), name: mechanicName }))
    .mutation(({ input, ctx }) => ctx.mechanics.rename(input.id, input.name)),

  /** Asked before saving, so a destructive config change is never a surprise. */
  configImpact: privateProcedure
    .input(z.object({ id: z.uuid(), config: z.unknown() }))
    .query(({ input, ctx }) => ctx.mechanics.configImpact(input.id, input.config)),

  updateConfig: privateProcedure
    .input(z.object({ id: z.uuid(), config: z.unknown() }))
    .mutation(({ input, ctx }) => ctx.mechanics.updateConfig(input.id, input.config)),

  delete: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input, ctx }) => ctx.mechanics.remove(input.id))
})
