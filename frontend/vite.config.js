import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockServerPlugin } from './mock/mockServer.js';

export default defineConfig(({ mode }) => {
  const mockMode = mode === 'mock';

  return {
    plugins: [react(), ...(mockMode ? [mockServerPlugin()] : [])],
    server: {
      port: 5173,
      ...(mockMode ? {} : {
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
          '/data': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      }),
    },
  };
});
