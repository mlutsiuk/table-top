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
    '@nuxt/ui'
  ],

  imports: {
    dirs: [
      'store'
    ]
  },

  devtools: { enabled: true },

  typescript: {
    tsConfig: {
      include: [
        './prisma/json-types.ts'
      ]
    },
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
  },

  compatibilityDate: '2024-09-01'
})
