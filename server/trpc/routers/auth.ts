import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { privateProcedure, publicProcedure, router } from '../trpc'

export const authRouter = router({
  handleGoogleCallback: publicProcedure.input(
    z.object({
      code: z.string()
    })
  ).query(async ({ input, ctx }) => {
    const { email, name } = await getUserDataByCode(input.code)

    let user = await ctx.prisma.user.findFirst({
      where: {
        email: email!
      }
    })

    if (!user) {
      user = await ctx.prisma.user.create({
        data: {
          email: email!,
          name: name ?? email!.split('@')[0]
        }
      })
    }

    const token = await signUserJwt({
      userId: user.id
    })

    return {
      user,
      token
    }
  }),

  getAuthUrl: publicProcedure.query(() => {
    const redirectUrl = getGoogleOauthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['email', 'profile']
    })

    return {
      redirectUrl
    }
  }),

  getCurrentUser: privateProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: {
        id: ctx.auth.id
      }
    })

    return user
  })
})
