import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    /** Canonical URL override. Defaults to the page's own absolute URL. */
    canonical: z.string().optional(),
  })
  .optional();

// Publishing status — admin toggles this per-entry. The site's list pages
// filter out drafts. Detail pages still render for direct URLs so previews
// work.
const status = z.enum(['draft', 'published']).default('published');
const updated = z.coerce.date().optional();

const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    heroTitle: z.string().optional(),
    path: z.string(),
    summary: z.string(),
    cover: z.string().optional(),
    /** Alt text for the cover/banner image. */
    coverAlt: z.string().optional(),
    order: z.number().default(0),
    /** Optional category — when set, drives the hero outline numeral & related cross-links. */
    group: z.enum(['Tax', 'Accounting', 'Advisory', 'Compliance']).optional(),
    /** Section visibility + order for the detail page. Omit for the default
     *  full layout; when set, only the listed sections render, in order. */
    sections: z
      .array(z.enum(['benefits', 'included', 'process', 'reviews', 'faq']))
      .optional(),
    /** Optional structured key takeaways — 3–5 bullets surfaced above the body. */
    takeaways: z.array(z.string()).default([]),
    /** Optional "what's included" deliverables list. */
    included: z.array(z.string()).default([]),
    /** Optional ordered engagement steps (rendered as a numbered process strip). */
    process: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
    /** Optional cross-link slugs into the industries collection. */
    industries: z.array(z.string()).default([]),
    /** Optional FAQ entries for the service-detail page. Falls back to a
     *  default 4-Q set covering common CPA-engagement questions. */
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    status,
    updated,
    seo,
  }),
});

const industries = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/industries' }),
  schema: z.object({
    title: z.string(),
    heroTitle: z.string().optional(),
    path: z.string(),
    summary: z.string(),
    cover: z.string().optional(),
    /** Alt text for the cover/banner image. */
    coverAlt: z.string().optional(),
    order: z.number().default(0),
    /** Optional short tagline / metric to colour the hero. */
    tagline: z.string().optional(),
    /** Optional KPIs for the hero — e.g. [{ value: "11", label: "Active engagements" }]. */
    kpis: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    /** Optional cross-link slugs into the services collection. */
    services: z.array(z.string()).default([]),
    status,
    updated,
    seo,
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    /** Author display name — matched against the authors collection for bio/photo. */
    author: z.string().optional(),
    cover: z.string().optional(),
    /** Alt text for the cover/banner image. */
    coverAlt: z.string().optional(),
    /** Single category per post (original-site convention). */
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status,
    updated,
    seo,
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: z.object({
    /** Display name — insights.author matches this. Bio lives in the body. */
    name: z.string(),
    /** Role/title line, e.g. "Managing Partner". */
    title: z.string().optional(),
    photo: z.string().optional(),
    photoAlt: z.string().optional(),
    linkedin: z.string().optional(),
    email: z.string().optional(),
    order: z.number().default(0),
    status,
    updated,
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string().optional(),
    credentials: z.array(z.string()).default([]),
    order: z.number().default(0),
    status,
    updated,
  }),
});

export const collections = { services, industries, insights, team, authors };
