import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'DSE Trading Dashboard',
        short_name: 'DSE Trader',
        description: 'DSE Stock Market - Student Council',
        theme_color: '#070D1A',
        background_color: '#070D1A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23070D1A"/><rect x="20" y="60" width="12" height="25" rx="2" fill="%2300C896"/><rect x="38" y="45" width="12" height="40" rx="2" fill="%2300C896"/><rect x="56" y="30" width="12" height="55" rx="2" fill="%234CAF50"/><rect x="74" y="15" width="12" height="70" rx="2" fill="%23FFC107"/></svg>',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000
  }
})
