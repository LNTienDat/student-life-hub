import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import lifeHubRelease from './release-plugin.mjs'
import lifeHubPwa from './pwa/vite-plugin.mjs'
import lifeHubOcr from './ocr/vite-plugin.mjs'

const apiProxy = { '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [lifeHubRelease(), react(), lifeHubOcr(), lifeHubPwa()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  build: {
    rolldownOptions: {
      preserveEntrySignatures: false,
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          // Keep shared React dependencies outside the optional chart bundle.
          includeDependenciesRecursively: false,
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/]((react|react-dom|react-router|react-router-dom|scheduler)[\\/])/, priority: 100 },
            { name: 'vendor-charts', test: /node_modules[\\/]recharts[\\/]/ },
            { name: 'vendor-motion', test: /node_modules[\\/]framer-motion[\\/]/ },
          ],
        },
      },
    },
  },
})
