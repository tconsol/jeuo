import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'framer-motion',
      'react-redux',
      '@reduxjs/toolkit',
      'react-router-dom',
      'axios',
      'react-hot-toast',
      'react-icons/fi',
      'socket.io-client',
      'react-hook-form',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) return 'redux';
          }
        },
      },
    },
  },
});
