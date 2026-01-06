import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 6008,
    host: '0.0.0.0',
    allowedHosts: [
      'uu838508-86fd-41c3868c.bjb1.seetacloud.com',
      'u838508-86fd-41c3868c.bjb1.seetacloud.com',
      '.seetacloud.com',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:6006',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:6006',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
