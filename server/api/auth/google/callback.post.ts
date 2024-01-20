import { z } from 'zod'
import { getUserDataByCode } from '~/server/utils/google-oauth-client'

const authSchema = z.object({
  code: z.string()
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => authSchema.safeParse(body))
  if (!result.success)
    throw result.error.issues

  const { email, name } = await getUserDataByCode(result.data.code)

  let user = await event.context.prisma.user.findFirst({
    where: {
      email: email!
    }
  })

  if (!user) {
    user = await event.context.prisma.user.create({
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
})
