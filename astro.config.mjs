// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://alpinemar.com',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => page !== 'https://alpinemar.com/design-system/',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
