export default defineEventHandler(async (event) => {
  if (!event.context.auth)
    return setResponseStatus(event, 403)

  const user = await event.context.prisma.user.findFirst({
    where: {
      id: event.context.auth.id
    }
  })

  return user
})
