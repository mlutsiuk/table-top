import { inject } from '@vercel/analytics'

export default defineNuxtPlugin(() => {
  if (import.meta.dev)
    return

  inject()
})
