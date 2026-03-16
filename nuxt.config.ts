// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {
    transpile: ['trpc-nuxt']
  },

  modules: [
    '@nuxt/devtools',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'shadcn-nuxt',
    '@nuxt/icon'
  ],

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui'
  },
  icon: {
    mode: 'css',
    cssLayer: 'base'
  },

  imports: {
    dirs: [
      'store'
    ]
  },

  css: ['~/assets/css/tailwind.css'],

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