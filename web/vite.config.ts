import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import daisyui from 'daisyui'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
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
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // secure: false,
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ['./src/**/*.{js,jsx,ts,tsx}'],
          plugins: [daisyui],
          daisyui: {
            themes: ["light"],
            darkTheme: "light",
            logs: false,
            darkMode: false
          }
        }),
        autoprefixer
      ]
    }
  }
})
