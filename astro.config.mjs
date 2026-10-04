import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.matvey.contact',
  output: 'static',
  build: {
    format: 'file',
  },
});
