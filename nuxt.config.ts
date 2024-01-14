// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    '@nuxt/ui',
    'nuxt-icon'
  ],
  imports: {
    dirs: [
      'store'
    ]
  },
  devtools: { enabled: true },
  typescript: {
    strict: true
  },
  ssr: false,
  ui: {
    icons: ['tabler']
  },
  googleFonts: {
    families: {
      Inter: true
    }
  }
})
