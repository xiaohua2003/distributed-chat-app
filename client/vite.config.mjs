import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ['100-53-1-205.sslip.io'],
  },
  define: {
    process: {
      env: {},
    },
  },
});
