import { z } from 'zod'
import { lineSchema } from '#shared/validation/text'
import { privateProcedure, router } from '../trpc'

const traitLabel = lineSchema(60)

export const traitDefRouter = router({
  list: privateProcedure
    .input(z.object({ campaignId: z.uuid() }))
    .query(({ input, ctx }) => ctx.traitDefs.list(input.campaignId)),

  /** The key is checked by the service, so a bad one gets a message a master can read. */
  create: privateProcedure
    .input(z.object({
      campaignId: z.uuid(),
      key: z.string().max(40),
      label: traitLabel
    }))
    .mutation(({ input, ctx }) => ctx.traitDefs.create(input)),

  rename: privateProcedure
    .input(z.object({ id: z.uuid(), label: traitLabel }))
    .mutation(({ input, ctx }) => ctx.traitDefs.rename(input.id, input.label)),

  /** Asked before saving, so a destructive config change is never a surprise. */
  configImpact: privateProcedure
    .input(z.object({ id: z.uuid(), config: z.unknown() }))
    .query(({ input, ctx }) => ctx.traitDefs.configImpact(input.id, input.config)),

  updateConfig: privateProcedure
    .input(z.object({ id: z.uuid(), config: z.unknown() }))
    .mutation(({ input, ctx }) => ctx.traitDefs.updateConfig(input.id, input.config)),

  delete: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input, ctx }) => ctx.traitDefs.remove(input.id))
})
