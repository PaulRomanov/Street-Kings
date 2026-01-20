export default defineNuxtConfig({
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
  
  // Настраиваем алиасы для удобного импорта
  alias: {
    '@shared': './src/shared',
    '@entities': './src/entities',
    '@features': './src/features',
    '@widgets': './src/widgets',
  }
})