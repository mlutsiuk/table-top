import { router } from '../trpc'
import { authRouter } from './auth'
import { campaignRouter } from './campaign'
import { folderRouter } from './folder'
import { assetRouter } from './asset'

export const appRouter = router({
  auth: authRouter,
  campaign: campaignRouter,
  folder: folderRouter,
  asset: assetRouter
})

// export type definition of API
export type AppRouter = typeof appRouter
