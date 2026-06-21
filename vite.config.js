import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        spatial: resolve(import.meta.dirname, 'spatial/index.html'),
        neonHaloDrift: resolve(import.meta.dirname, 'spatial/music/neon-halo-drift/index.html'),
      },
    },
  },
})
