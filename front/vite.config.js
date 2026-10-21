import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import lifeHubPwa from './pwa/vite-plugin.mjs'

const apiProxy = { '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), lifeHubPwa()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/canvas-confetti')
          ) {
            return 'vendor-utils';
          }
        }
      }
    }
  }
})
