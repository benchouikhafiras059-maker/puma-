import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs', '@tensorflow-models/pose-detection', '@mediapipe/pose', '@tensorflow-models/face-landmarks-detection'],
  },
  build: {
    rollupOptions: {
      // @mediapipe/pose has a broken ESM export — we only use MoveNet so it's never loaded at runtime
      external: ['@mediapipe/pose'],
    },
  },
})
