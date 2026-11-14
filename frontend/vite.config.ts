import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Compile the shared workspace straight from source in the browser build.
      // The backend consumes the same package from shared/dist.
      '@echoes/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    setupFiles: [path.resolve(__dirname, './test-setup.ts')],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
