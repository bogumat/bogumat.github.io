import { mkdir, rename } from 'node:fs/promises';

await mkdir(new URL('../dist/projects/', import.meta.url), { recursive: true });
await rename(
  new URL('../dist/projects.html', import.meta.url),
  new URL('../dist/projects/index.html', import.meta.url),
);
