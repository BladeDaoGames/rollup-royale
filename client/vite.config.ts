import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    watch: {
      usePolling: true,
    },
    fs: {
      strict: true,
    },
  },
  plugins: [react({include: "**/*.tsx",})],
})
