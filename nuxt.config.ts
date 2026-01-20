import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  srcDir: '.',
  dir: {
    pages: 'app/pages'
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
  ],

  css: [
    '@shared/assets/scss/main.scss'
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@shared/assets/scss/_variables.scss" as *;'
        }
      }
    },
    optimizeDeps: {
      include: ['mapbox-gl']
    }
  },

  // Настройки для корректной работы Mapbox на стороне клиента
  build: {
    transpile: ['mapbox-gl']
  },

  typescript: {
    strict: true
  },

  components: [
    { path: '~/src/widgets', pathPrefix: false },
    { path: '~/src/features', pathPrefix: false },
    { path: '~/src/entities', pathPrefix: false },
    { path: '~/src/shared', pathPrefix: false },
  ],
  
  alias: {
    '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
    '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
    '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
  },

  imports: {
    dirs: [
      'src/shared/api/**'
    ]
  },

  runtimeConfig: {
    public: {
      mapboxToken: process.env.NUXT_PUBLIC_MAPBOX_TOKEN
    }
  }
})