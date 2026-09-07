import { defineConfig } from 'vite'

export default defineConfig({
  root: 'experiments/natal-dial',
  server: {
    host: '127.0.0.1',
    port: 5191,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5191,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
