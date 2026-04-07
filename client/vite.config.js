import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://finalv.onrender.com',
        changeOrigin: true,
        secure: false,
        timeout: 120000,       // 2 min – covers Render cold starts
        proxyTimeout: 120000,  // 2 min – covers email batch sending
      }
    },
  },
})
