import type { H3Event } from 'h3'

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = (_event: H3Event) => ({
  prisma: _event.context.prisma,
  auth: _event.context.auth
})

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
