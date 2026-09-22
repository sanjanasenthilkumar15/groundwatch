import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa/favicon-16.png', 'pwa/favicon-32.png', 'pwa/apple-touch-icon.png'],
      manifest: {
        name: 'GroundWatch AI — Salem District',
        short_name: 'GroundWatch',
        description: 'AI-powered groundwater monitoring and early-warning platform for Salem District, Tamil Nadu.',
        theme_color: '#08917D',
        background_color: '#FAF9F5',
        display: 'standalone',
        start_url: '/login',
        scope: '/',
        icons: [
          { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // Never cache API responses — this app is live groundwater/ML data,
        // stale-while-offline would be actively misleading.
        navigateFallbackDenylist: [/^\/stations|^\/risk-map|^\/officer|^\/subscribers|^\/admin|^\/blocks|^\/register|^\/login/],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => !sameOrigin || url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
