import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const runtimeProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}).process

export default defineConfig({
  plugins: [react()],
  base: runtimeProcess?.env?.GITHUB_ACTIONS === 'true' ? '/11house/' : '/',
  build: {
    chunkSizeWarningLimit: 800,
  },
})
