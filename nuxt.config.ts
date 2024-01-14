// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/ui',
    'nuxt-icon'
  ],
  ui: {
    icons: ['tabler']
  },
  imports: {
    dirs: [
      'store'
    ]
  },
  devtools: { enabled: true },
  typescript: {
    strict: true
  },
  ssr: false
})
