import { router } from '../trpc'
import { authRouter } from './auth'
import { campaignRouter } from './campaign'
import { folderRouter } from './folder'
import { assetRouter } from './asset'
import { assetTraitRouter } from './asset-trait'
import { mechanicRouter } from './mechanic'

export const appRouter = router({
  auth: authRouter,
  campaign: campaignRouter,
  folder: folderRouter,
  asset: assetRouter,
  assetTrait: assetTraitRouter,
  mechanic: mechanicRouter
})

// export type definition of API
export type AppRouter = typeof appRouter
