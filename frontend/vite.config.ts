import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    // Proxy API calls to the FastAPI backend during development
    proxy: {
      '/upload': 'http://localhost:8000',
      '/chat': 'http://localhost:8000',
    },
  },
})
