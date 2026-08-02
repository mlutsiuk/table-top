/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */
import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from '~~/server/trpc/context'
import { createCampaignAccessService } from '~~/server/features/campaigns/services/campaign-access.service'
import { createCampaignMembersService } from '~~/server/features/campaigns/services/campaign-members.service'
import { createCampaignsService } from '~~/server/features/campaigns/services/campaigns.service'
import { createFoldersService } from '~~/server/features/folders/services/folders.service'
import { createAssetsService } from '~~/server/features/assets/services/assets.service'
import { BadRequestError, ForbiddenError, NotFoundError } from '~~/server/infrastructure/errors'

const t = initTRPC.context<Context>().create({
  transformer: superjson
})

/**
 * The single place where domain failures become tRPC codes, so services never
 * mention transport. Anything not listed is a genuine bug: it is rethrown as-is
 * and surfaces as a 500 instead of being dressed up as an expected outcome.
 */
const mapDomainErrors = t.middleware(async ({ next }) => {
  // `next()` does not throw: tRPC catches whatever the resolver threw, wraps it in
  // a TRPCError with code INTERNAL_SERVER_ERROR and hands it back as `result.error`,
  // with the original on `cause`. So the mapping has to read the result, not catch.
  const result = await next()
  if (result.ok) return result

  const cause = result.error.cause

  if (cause instanceof NotFoundError) throw new TRPCError({ code: 'NOT_FOUND', message: cause.message })
  if (cause instanceof ForbiddenError) throw new TRPCError({ code: 'FORBIDDEN', message: cause.message })
  if (cause instanceof BadRequestError) throw new TRPCError({ code: 'BAD_REQUEST', message: cause.message })

  // Anything else is a genuine bug — leave it as the 500 it already is.
  return result
})

/**
 * Unprotected procedure
 */
export const publicProcedure = t.procedure.use(mapDomainErrors)

export const privateProcedure = publicProcedure.use((opts) => {
  if (!opts.ctx.auth) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User is not authenticated'
    })
  }

  // Composition root: services are built here, once per request, bound to the
  // caller. Routers receive them rather than reaching for auto-imports.
  const { prisma, auth } = opts.ctx
  const campaignAccess = createCampaignAccessService(prisma, auth.id)

  return opts.next({
    ctx: {
      auth,
      campaignAccess,
      campaigns: createCampaignsService(prisma, campaignAccess, auth.id),
      campaignMembers: createCampaignMembersService(prisma, campaignAccess),
      folders: createFoldersService(prisma, campaignAccess),
      assets: createAssetsService(prisma, campaignAccess)
    }
  })
})

export const router = t.router
export const middleware = t.middleware
