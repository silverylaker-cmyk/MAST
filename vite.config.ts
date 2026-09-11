import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /<repo>/ ; override with BASE_PATH for other hosts.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/MAST/',
});
