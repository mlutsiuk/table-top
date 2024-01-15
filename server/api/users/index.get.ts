export default defineEventHandler(async ({ context }) => {
  const users = await context.prisma.user.findMany()

  return users
})