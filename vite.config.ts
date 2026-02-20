import { defineConfig } from 'vite'

export default defineConfig({
  base: '/tetris-game-demo/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
