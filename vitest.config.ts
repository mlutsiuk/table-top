import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Deliberately plain: these tests cover pure modules only — path maths, the
 * ability table, visibility rules. Nothing here touches Prisma, tRPC or Vue, so
 * they need no database, no Nuxt runtime and no fixtures.
 *
 * Anything that does need those belongs in a different suite, added when there is
 * something to put in it.
 */
export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url))
    }
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  }
})
