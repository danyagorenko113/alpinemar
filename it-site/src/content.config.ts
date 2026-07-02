import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .optional();

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
    group: z.enum(['Cybersecurity', 'Cloud & Infrastructure', 'Advisory', 'AI']).optional(),
    status,
    updated,
    seo,
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string().optional(),
    order: z.number().default(0),
    email: z.string().optional(),
    linkedin: z.string().optional(),
    status,
    updated,
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
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status,
    updated,
    seo,
  }),
});

export const collections = { services, team, insights };
