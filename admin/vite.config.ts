import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/admin/',
  publicDir: 'public',
  build: {
    outDir: 'dist'
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        // target: 'http://47.120.27.98:3333',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
