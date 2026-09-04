import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.join(__dirname, 'shared'),
    },
  },
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
})
