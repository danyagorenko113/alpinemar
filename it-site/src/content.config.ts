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
    group: z.string().optional(),
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
    // Editor-controlled Featured flag (set in the CMS). When present, it wins
    // over the automatic newest-Cybersecurity selection on the blog home.
    featured: z.boolean().optional(),
    status,
    updated,
    seo,
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
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

export const collections = { services, team, insights, authors };
