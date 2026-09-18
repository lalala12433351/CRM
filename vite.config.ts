import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(configDir, '.'),
      },
    },
    server: {
      allowedHosts: true as any,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits, and ignore database/backend files.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/.data/**',
          '**/.git/**',
          '**/dist/**',
          '**/scratch/**',
          '**/*.zip',
          '**/*.log',
          '**/server/**'
        ]
      },
    },
  };
});
