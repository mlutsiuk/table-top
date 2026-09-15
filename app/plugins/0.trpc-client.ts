import type { AppRouter } from '~~/server/trpc/routers'
import superjson from 'superjson'
import { createTRPCNuxtClient, httpBatchLink } from 'trpc-nuxt/client'

export default defineNuxtPlugin(() => {
  /**
   * createTRPCNuxtClient adds a `useQuery` composable
   * built on top of `useAsyncData`.
   */
  const { accessToken } = storeToRefs(useAuthStore())

  const client = createTRPCNuxtClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        headers: () => ({
          Authorization: accessToken.value ? `Bearer ${accessToken.value}` : undefined
        }),
        transformer: superjson
      })
    ]
  })

  return {
    provide: {
      client
    }
  }
})
