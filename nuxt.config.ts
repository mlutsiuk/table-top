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

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
        class: 'dark'
      },
      meta: [
        { name: 'color-scheme', content: 'dark' }
      ]
    }
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

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vercel/analytics',
        'superjson',
        '@vercel/speed-insights/vue',
        '@trpc/server',
        'lucide-vue-next',
        'vue-sonner',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        'reka-ui',
        '@tiptap/vue-3',
        '@tiptap/extension-document',
        '@tiptap/extension-text',
        '@tiptap/extension-paragraph',
        '@tiptap/extension-heading',
        '@tiptap/extension-bullet-list',
        '@tiptap/extension-ordered-list',
        '@tiptap/extension-list-item',
        '@tiptap/extension-bold',
        '@tiptap/extension-italic',
        '@tiptap/extension-strike',
        '@tiptap/extension-blockquote',
        '@tiptap/extension-hard-break',
        '@tiptap/extension-horizontal-rule',
        '@tiptap/extension-dropcursor',
        '@tiptap/extension-placeholder',
      ]
    }
  }
})