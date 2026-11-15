import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockServerPlugin } from './mock/mockServer.js';

export default defineConfig(({ mode }) => {
  const mockMode = mode === 'mock';
  const localMode = mode === 'local-server';
  const backendTarget = localMode ? 'http://127.0.0.1:18080' : 'http://localhost:8080';

  return {
    plugins: [react(), ...(mockMode ? [mockServerPlugin()] : [])],
    server: {
      port: 5173,
      ...(mockMode ? {} : {
        proxy: {
          '/api': {
            target: backendTarget,
            changeOrigin: true,
          },
          '/data': {
            target: backendTarget,
            changeOrigin: true,
          },
          ...(localMode ? {
            '/colorizer': {
              target: 'http://127.0.0.1:18501',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/colorizer/, '') || '/',
            },
          } : {}),
        },
      }),
    },
  };
});
