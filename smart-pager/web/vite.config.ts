import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The proxy keeps /api same-origin in dev so the session cookie and EventSource just work.
export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: true, proxy: { '/api': 'http://localhost:4000' } },
});
