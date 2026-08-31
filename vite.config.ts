import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /<repo>/, Vercel from the domain root.
// DEPLOY_TARGET=pages switches the asset base accordingly.
const pages = process.env.DEPLOY_TARGET === 'pages';
const repo = process.env.PAGES_BASE ?? '/ngglms/';

export default defineConfig({
  base: pages ? repo : '/',
  plugins: [react()],
  define: {
    __DEPLOY_TARGET__: JSON.stringify(pages ? 'pages' : 'vercel'),
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
  server: { port: 5173 },
});
