import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { platform } from 'node:os';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [ 'favicon.svg' ],
      manifest: {
        name: 'SGCC WebUI',
        short_name: 'SGCC',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: [ '**/*.{js,css,html,svg}' ],
        sourcemap: false,
        mode: platform() === 'android' ? 'development' : 'production' // prevent crash in Termux
      },
      devOptions: {
        //enabled: true,
      },
    })
  ],
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
