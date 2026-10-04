import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    pageTitle: z.string(),
    heading: z.string(),
    image: z.string(),
    year: z.number(),
    order: z.number().int(),
    comingSoon: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  loader: file('./src/data/articles.json'),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    link: z.url(),
    image: z.string().optional(),
    imagePosition: z.string().optional(),
    cta: z.string().default('Read on Substack'),
    coverSource: z.url().optional(),
    order: z.number().int(),
  }),
});

export const collections = { projects, articles };
