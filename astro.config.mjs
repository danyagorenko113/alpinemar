// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import absoluteLinks from './integrations/absolute-links.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://alpinemar.com',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        ![
          'https://alpinemar.com/design-system/',
          'https://alpinemar.com/tools/quarterly-tax-estimator/',
        ].includes(page),
    }),
    absoluteLinks(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
