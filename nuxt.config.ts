// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/devtools',
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
  ui: {
    icons: [
      'logos'
    ]
  },
  devtools: { enabled: true },
  typescript: {
    strict: true
  },
  ssr: false,
  googleFonts: {
    families: {
      Inter: true
    }
  }
})
