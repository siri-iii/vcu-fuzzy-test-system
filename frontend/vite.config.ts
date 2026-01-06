import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 6008,
    host: '0.0.0.0',
    open: true,
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
});
