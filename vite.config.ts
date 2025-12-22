import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [ viteReact() ],
  clearScreen: false,
  build: {
    license: {
      fileName: 'LICENSE.thirdparty.md'
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react')) {
              return 'react';
            }
            if (id.includes('openpgp')) {
              return 'openpgp';
            }
            return 'vendor';
          }
        },
      },
    },
    sourcemap: true,
  },
});
