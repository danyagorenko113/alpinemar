import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .optional();

const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    path: z.string(),
    summary: z.string(),
    cover: z.string().optional(),
    order: z.number().default(0),
    /** Optional category — when set, drives the hero outline numeral & related cross-links. */
    group: z.enum(['Tax', 'Accounting', 'Advisory', 'Compliance']).optional(),
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
    seo,
  }),
});

const industries = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/industries' }),
  schema: z.object({
    title: z.string(),
    path: z.string(),
    summary: z.string(),
    cover: z.string().optional(),
    order: z.number().default(0),
    /** Optional short tagline / metric to colour the hero. */
    tagline: z.string().optional(),
    /** Optional KPIs for the hero — e.g. [{ value: "11", label: "Active engagements" }]. */
    kpis: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    /** Optional cross-link slugs into the services collection. */
    services: z.array(z.string()).default([]),
    seo,
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    author: z.string().optional(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    seo,
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
  }),
});

export const collections = { services, industries, insights, team };
