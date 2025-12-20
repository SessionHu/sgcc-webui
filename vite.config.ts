import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react')) {
              return 'react-vendor';
            }
            if (id.includes('openpgp')) {
              return 'openpgp-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
