/* eslint-disable ts/no-namespace */
import type { FundScheme as _FundScheme } from '~/types/campaign'

declare global {
  namespace PrismaJson {
    type FundScheme = _FundScheme[]
  }
}
