import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the NutriCart frontend.
// The frontend talks to the Spring Boot REST API (see src/api/httpClient.ts).
// During local development the API is proxied so there are no CORS surprises.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Spring Boot backend (see backend/src/main/resources/application.yml)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
