import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://omoo.studio',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [icon(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
