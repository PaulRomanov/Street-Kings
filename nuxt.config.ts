/// <reference types="node" />
import { fileURLToPath } from 'url';

export default defineNuxtConfig({
  srcDir: '.',
  dir: {
    pages: 'app/pages'
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],

  css: [
    '@shared/assets/scss/main.scss',
    'mapbox-gl/dist/mapbox-gl.css'
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
      include: ['mapbox-gl'],
    }
  },

  routeRules: {
    '/': { ssr: false }
  },

  nitro: {
    serveStatic: true,
  },

  experimental: {
    payloadExtraction: false
  },


  typescript: {
    strict: true
  },

  components: {
    dirs: [
      { path: '~/src/widgets', extensions: ['vue'], pathPrefix: false },
      { path: '~/src/features', extensions: ['vue'], pathPrefix: false },
      { path: '~/src/entities', extensions: ['vue'], pathPrefix: false },
      { path: '~/src/shared', extensions: ['vue'], pathPrefix: false },
    ]
  },
  
  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url)),
    '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
    '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
    '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
  },

  imports: {
    dirs: ['src/shared/api']
  },

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      mapboxToken: process.env.NUXT_PUBLIC_MAPBOX_TOKEN
    }
  },

  supabase: {
    redirect: false 
  },

  ignore: [
    '**/.output',
    '**/.nuxt',
    // '**/node_modules',
    '**/.git'
  ]
})