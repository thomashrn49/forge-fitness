import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // a new version waits for the user's OK (never reloads in the middle of a workout)
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'FORGE — Coach fitness',
        short_name: 'FORGE',
        description: 'Suivi de séances, exercices, progression et calories. Fonctionne hors ligne, données stockées sur ton téléphone.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0A0D12',
        theme_color: '#0A0D12',
        categories: ['health', 'fitness', 'sports'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Démarrer une séance', short_name: 'Séance', url: '/seance', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Exercices', url: '/exercices', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // everything (JS, CSS, fonts, icons) is cached at install → the app works with no network at the gym
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173, open: false },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: { manualChunks: { charts: ['recharts'], react: ['react', 'react-dom', 'react-router-dom'] } },
    },
  },
})
