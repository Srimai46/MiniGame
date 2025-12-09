import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 for LAN during dev
    port: 5173
  },
  build: {
    outDir: 'dist'
  }
});
