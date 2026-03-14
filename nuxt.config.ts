// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {
    transpile: ['trpc-nuxt']
  },

  modules: [
    '@nuxt/devtools',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/ui'
  ],

  imports: {
    dirs: [
      'store'
    ]
  },

  css: ['~/assets/css/main.css'],

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
