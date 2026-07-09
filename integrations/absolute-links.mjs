import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Rewrites root-relative <a href="/..."> links in the built HTML to absolute
 * URLs (CMS audit requirement: internal links must be absolute). Only anchor
 * tags are touched — asset/link/script URLs stay relative.
 */
export default function absoluteLinks() {
  let siteUrl = '';
  return {
    name: 'absolute-internal-links',
    hooks: {
      'astro:config:done': ({ config }) => {
        siteUrl = (config.site ?? '').replace(/\/$/, '');
      },
      'astro:build:done': async ({ dir }) => {
        if (!siteUrl) return;
        const root = dir.pathname;
        const htmlFiles = [];
        const walk = async (d) => {
          for (const entry of await readdir(d, { withFileTypes: true })) {
            const p = join(d, entry.name);
            if (entry.isDirectory()) await walk(p);
            else if (entry.name.endsWith('.html')) htmlFiles.push(p);
          }
        };
        await walk(root);

        // href="/..." inside an <a ...> tag only; skip protocol-relative "//".
        const anchorHref = /(<a\s[^>]*?href=")(\/(?!\/)[^"]*)(")/g;
        let rewritten = 0;
        await Promise.all(
          htmlFiles.map(async (file) => {
            const html = await readFile(file, 'utf-8');
            const next = html.replace(anchorHref, (_m, pre, path, post) => {
              rewritten++;
              return `${pre}${siteUrl}${path}${post}`;
            });
            if (next !== html) await writeFile(file, next);
          }),
        );
        console.log(`[absolute-links] rewrote ${rewritten} internal anchors across ${htmlFiles.length} pages`);
      },
    },
  };
}
