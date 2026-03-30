# matvey.contact

Personal portfolio site built with Jekyll and hosted on GitHub Pages.

## Local development

```bash
bundle install
bundle exec jekyll serve --livereload
```

Site runs at `http://localhost:4000`.

## Adding a project

1. Add an entry to `_data/projects.yml`
2. Create a page in `projects/` with `layout: project` front matter
3. Drop the cover image in `images/`

## Structure

- `_layouts/` — page templates (default, home, project)
- `_includes/` — shared partials (head, nav, footer)
- `_data/projects.yml` — project list
- `assets/` — CSS and JS
- `images/` — project images
- `moonlet.js` — Three.js hero animation (v0.125.2)
