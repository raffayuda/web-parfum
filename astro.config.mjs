import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://omoo.web.id',
  output: 'server',
  adapter: vercel(),
  integrations: [icon(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
