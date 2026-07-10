import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Fills in missing/empty alt attributes on <img> tags in the built HTML from
 * the media manifest (src/data/media-meta.json — written by the admin CMS
 * media library). Explicit alt text set in content always wins; this only
 * covers images whose alt was never set inline.
 */
export default function mediaAlt() {
  return {
    name: 'media-manifest-alt',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const manifestPath = join(process.cwd(), 'src/data/media-meta.json');
        if (!existsSync(manifestPath)) return;

        let manifest;
        try {
          manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
        } catch {
          console.warn('[media-alt] could not parse src/data/media-meta.json — skipping');
          return;
        }

        // repo path (public/images/…) → public URL (/images/…)
        const altByUrl = new Map();
        for (const [repoPath, meta] of Object.entries(manifest)) {
          if (meta?.alt) altByUrl.set(repoPath.replace(/^public/, ''), meta.alt);
        }
        if (altByUrl.size === 0) return;

        const htmlFiles = [];
        const walk = async (d) => {
          for (const entry of await readdir(d, { withFileTypes: true })) {
            const p = join(d, entry.name);
            if (entry.isDirectory()) await walk(p);
            else if (entry.name.endsWith('.html')) htmlFiles.push(p);
          }
        };
        await walk(dir.pathname);

        const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const imgTag = /<img\s[^>]*>/g;
        let filled = 0;
        await Promise.all(
          htmlFiles.map(async (file) => {
            const html = await readFile(file, 'utf-8');
            const next = html.replace(imgTag, (tag) => {
              const srcMatch = tag.match(/\ssrc="([^"]+)"/);
              if (!srcMatch) return tag;
              const alt = altByUrl.get(srcMatch[1]);
              if (!alt) return tag;
              if (/\salt="[^"]/.test(tag)) return tag; // non-empty alt already set
              filled++;
              const escaped = esc(alt);
              if (/\salt=""/.test(tag)) return tag.replace(/\salt=""/, ` alt="${escaped}"`);
              return tag.replace(/^<img\s/, `<img alt="${escaped}" `);
            });
            if (next !== html) await writeFile(file, next);
          }),
        );
        if (filled) console.log(`[media-alt] filled ${filled} empty alt attributes from the media manifest`);
      },
    },
  };
}
