import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ],
  server: {
    host: true,
    allowedHosts: [
      'cd73-152-56-69-97.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.io',
    ],
  },
  resolve: {
    alias: {
      'node-fetch': path.resolve(__dirname, './src/node-fetch-mock.js'),
      'node:stream/web': path.resolve(__dirname, './src/node-fetch-mock.js'),
    }
  }
})
