import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/data/site';

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const SPANISH_SERVICES = new Set([
  'creacion-de-empresas',
  'servicios-contables',
  'servicios-tributarios-en-florida',
]);

export const GET: APIRoute = async () => {
  const [services, industries, posts] = await Promise.all([
    getCollection('services'),
    getCollection('industries'),
    getCollection('insights'),
  ]);

  let out = `# Alpine Mar — Full Content Corpus\n\n`;
  out += `> ${site.description}\n`;
  out += `> ${site.url}\n\n`;
  out += `Full text of every public page on alpinemar.com: ${services.length - SPANISH_SERVICES.size} services, ${industries.length} industries, ${posts.length} insights articles.\n\n`;
  out += `═══════════════════════════════════════════════════════\n\n`;

  // ── Services ─────────────────────────────────────────────────────────
  out += `## SERVICES\n\n`;
  const sortedServices = services
    .filter((s) => !SPANISH_SERVICES.has(s.id.replace(/\.mdx?$/, '')))
    .sort((a, b) => a.data.path.localeCompare(b.data.path));

  for (const s of sortedServices) {
    out += `# ${s.data.title}\n`;
    out += `URL: ${site.url}${s.data.path}\n`;
    if (s.data.group) out += `Category: ${s.data.group}\n`;
    out += `Summary: ${s.data.summary}\n\n`;
    if (s.data.takeaways?.length) {
      out += `Key takeaways:\n`;
      for (const t of s.data.takeaways) out += `  - ${t}\n`;
      out += `\n`;
    }
    if (s.data.included?.length) {
      out += `What's included:\n`;
      for (const it of s.data.included) out += `  - ${it}\n`;
      out += `\n`;
    }
    if (s.data.process?.length) {
      out += `Engagement process:\n`;
      for (const p of s.data.process) out += `  - ${p.title}: ${p.body}\n`;
      out += `\n`;
    }
    out += `${strip(s.body ?? '')}\n\n---\n\n`;
  }

  // ── Industries ───────────────────────────────────────────────────────
  out += `\n## INDUSTRIES\n\n`;
  const sortedIndustries = industries.sort((a, b) =>
    a.data.path.localeCompare(b.data.path),
  );
  for (const ind of sortedIndustries) {
    out += `# ${ind.data.title}\n`;
    out += `URL: ${site.url}${ind.data.path}\n`;
    out += `Summary: ${ind.data.summary}\n\n`;
    if (ind.data.tagline) out += `Tagline: ${ind.data.tagline}\n\n`;
    if (ind.data.services?.length) {
      out += `Relevant services:\n`;
      for (const svc of ind.data.services) {
        out += `  - ${site.url}/services/${svc}/\n`;
      }
      out += `\n`;
    }
    out += `${strip(ind.body ?? '')}\n\n---\n\n`;
  }

  // ── Insights / blog ──────────────────────────────────────────────────
  out += `\n## INSIGHTS\n\n`;
  const sortedPosts = posts.sort((a, b) => +b.data.date - +a.data.date);
  for (const p of sortedPosts) {
    out += `# ${p.data.title}\n`;
    out += `URL: ${site.url}/blog/${p.id}/\n`;
    out += `Published: ${p.data.date.toISOString().slice(0, 10)}\n`;
    if (p.data.author) out += `Author: ${p.data.author}\n`;
    if (p.data.tags?.length) out += `Tags: ${p.data.tags.join(', ')}\n`;
    out += `Summary: ${p.data.excerpt}\n\n`;
    out += `${strip(p.body ?? '')}\n\n---\n\n`;
  }

  return new Response(out, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
