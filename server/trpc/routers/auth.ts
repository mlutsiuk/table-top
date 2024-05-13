import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

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
  })
})
