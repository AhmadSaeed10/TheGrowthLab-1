import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const discipline = z.enum(['Social media', 'Content', 'Web and e-commerce', 'Performance', 'Branding', 'PR']);
const pic = (image: any) => z.object({ src: image(), alt: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      tagline: z.string(),
      summary: z.string().max(220),
      chips: z.array(z.string()),
      outcomes: z.array(z.string()),
      cover: image(),
      coverAlt: z.string(),
      focal: z.string().default('50% 50%'),
      step: z.enum(['Brand', 'Build', 'Create', 'Connect', 'Convert', 'Grow']),
      discipline,
      seoTitle: z.string().max(60),
      seoDescription: z.string().max(160),
      keyFact: z.object({ value: z.string(), label: z.string() }).optional(),
    }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      brand: z.string(),
      order: z.number(),
      sector: z.string(),
      summary: z.string().max(280),
      disciplines: z.array(discipline),
      did: z.array(z.string()),
      cover: image(),
      coverAlt: z.string(),
      focal: z.string().default('50% 50%'),
      gallery: z.array(pic(image)),
      site: pic(image).optional(),
      more: z.array(pic(image)).default([]),
      // Add real numbers here when you have them. Hidden while empty.
      results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      seoTitle: z.string().max(60),
      seoDescription: z.string().max(160),
    }),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160),
      date: z.coerce.date(),
      draft: z.boolean().default(false),
      cover: image().optional(),
      coverAlt: z.string().optional(),
    }),
});

export const collections = { services, work, insights };
