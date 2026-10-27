import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development, forward /api/* to the backend. The browser thinks frontend and
    // backend are the SAME origin, so cookies just work and there are no CORS issues.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom', // a fake browser DOM for component tests
    setupFiles: './src/test/setup.js',
  },
});
