import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { authRouter } from './auth'
import { campaignRouter } from './campaign'

export const appRouter = router({
  auth: authRouter,
  campaign: campaignRouter,

  hello: publicProcedure
    .input(
      z.object({
        text: z.string().nullish()
      })
    )
    .query(({ input }) => {
      return {
        greeting: `hello ${input?.text ?? 'world'}`
      }
    })
})

// export type definition of API
export type AppRouter = typeof appRouter
