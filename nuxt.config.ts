// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {
    transpile: ['trpc-nuxt']
  },
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
  experimental: {
    typedPages: true
  },
  ssr: false,
  googleFonts: {
    families: {
      Inter: true
    }
  },
  runtimeConfig: {
    jwt: {
      secret: '',
      alg: '',
      exp: ''
    },

    googleClientId: '',
    googleClientSecret: '',
    googleCallbackUrl: ''
  }
})
