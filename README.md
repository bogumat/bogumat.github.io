# matvey.contact

Static portfolio built with Astro and hosted on GitHub Pages.

## Local development

```bash
npm install
npm run dev -- --port 4000
```

Site runs at `http://localhost:4000`.

## Adding a project

1. Add a Markdown file to `src/content/projects/` with the project metadata and page body.
2. Drop the cover image in `public/images/`.
3. Run `npm run check` to validate the collection entry.

For a preview without a project page, set `comingSoon: true`.
The shared grid renders a non-interactive card with a Coming soon image overlay.
Set it to `false` when the page body is ready. Astro generates the existing
`/projects/<slug>.html` URL from the Markdown filename.

## Structure

- `src/pages/` — Astro routes for the homepage, archive, and project detail pages
- `src/layouts/` and `src/components/` — shared page structure and collection grids
- `src/content/projects/` — validated project metadata and detail-page content
- `src/data/articles.json` — validated external blog and video entries
- `src/scripts/orbit/` — modular Three.js hero and interaction code
- `src/styles/` — shared page, collection, and orbit styles
- `public/images/` and `public/assets/models/` — published image and GLB assets
- `scripts/preserve-urls.mjs` — keeps the existing `/projects/` archive URL after build
- `tools/modeling/` — editable Blender sources and scripts for the three live models;
  excluded from the published site

## Texture credits

`public/images/textures/moon-color-2k.jpg` is the 2048 × 1024 lunar color map
from [NASA's Scientific Visualization Studio — CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/).
Visualization by Ernie Wright; based on Lunar Reconnaissance Orbiter data.
[Original JPEG](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg).

`public/images/textures/moon-height-1k.png` is the matching 1024 × 512 elevation map
from the same NASA CGI Moon Kit, based on Lunar Orbiter Laser Altimeter (LOLA) data.
[Original height map](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg).
Converted from JPEG to PNG for reliable WebGL texture uploads.
It drives both geometry displacement and bump shading. Adjust `moonRelief` in
`src/scripts/orbit/moonlet.js` to change the relief strength; the current value is
slightly exaggerated for visibility and is not a scientific elevation scale.

The Moon faces the near side with a 35° southward viewing tilt to show Boguslawsky.
`src/scripts/orbit/moon-features.js` highlights the main crater and its 13 named satellite
craters using the [IAU / USGS Gazetteer](https://planetarynames.wr.usgs.gov/Feature/796)
LOLA 2011 coordinates and diameters (checked 28 September 2026). The gold circles
show approximate extents, not traced rims. Coordinates map through the NASA
texture's longitude/latitude convention, and the rings sit just above the maximum
displacement. The gold outlines and a small coordinate label beside them form a
surname easter egg, without a name or pointer. Both stay visible while orbiting
objects fly forward, remain selected, and return to orbit.
Small satellite craters are below the texture's resolved detail.

`src/scripts/orbit/moon-libration.js` adds a gentle approximation of
[lunar libration](https://science.nasa.gov/moon/moon-phases/): ±7.9° east/west
and ±6.7° north/south. The illustrative 48- and 40-second cycles are sped up
for the site, rather than following an astronomical ephemeris. Adjust the
amplitudes and periods in `MoonLibration` to tune the motion. The crater markers
move with the surface. Libration pauses during dragging, Moon keyboard focus,
and while the tab is hidden; it is disabled with reduced-motion preferences.

Drag the Moon to rotate it directly under the pointer or finger. The highlighted
craters rotate with the surface; their coordinates follow when they face the camera.
`src/scripts/orbit/moon-drag.js` maps the grabbed surface point to the pointer using a sphere
intersection and quaternion rotation. Pointer capture holds the grab outside the
Moon. Release stops the manual rotation, then libration resumes smoothly around
the chosen orientation. The light stays still during a grab while the icons continue
orbiting. Touch gestures outside the Moon retain normal scrolling.
Focus the Moon and use arrow keys to rotate it, or Home to restore its starting view.

## Orbit navigation

Edit `planetoidDefinitions` in `src/scripts/orbit/moonlet.js` to add or change links.
Each entry sets its label, URL, model, orientation, lights, and inspection caption. `SharedOrbit`
places all n objects on one circular path at 360/n-degree intervals (120° for
three objects), driven by a single phase. The circle lies in the camera-facing
XY plane, moving north → right → south → left at constant depth so objects
stay outside the Moon's visible outline. Radius and angular speed live in
`SharedOrbit`; startup checks ensure Moon and neighbor clearance.

All entries share a 1.8-unit visible size and a conservative 1.3-unit collision
radius. The loader matches each model's largest visible dimension after its
presentation rotation, including the CubeSat's panels. Camera framing fits the
shared orbit and the objects on desktop and mobile.

Hover (desktop), tap (mobile), or keyboard focus brings an object into a large
foreground inspection view and pauses the pointer-controlled light. Drag the
foreground object with a mouse or finger to rotate it; when its control is focused,
the arrow keys rotate it and Home restores the configured inspection angle. All orbital
positions keep advancing during inspection. Move away, click/tap again, or press
Escape to return the object to where it would be if it had kept orbiting. There
is a title, accent, short description, and scroll cue that fade in with the
foreground object and disappear as it returns.
Edit each entry's `caption` to update its title and description.
The Projects and Blog cues, wheel scrolling, or upward swipes scroll to their
respective homepage grids. A collection switch, the header links, and direct
`/#about`, `/#projects` or `/#blog` URLs also select the appropriate section.
Back to orbit returns to `/#landing`.
With no orbiting item selected, scrolling reveals About. Returning to the orbit
or dismissing an item restores About; navigating into a selected grid keeps that
grid visible. The project grid
remains available at `/projects/`; both pages use `src/components/ProjectGrid.astro`.
For the Society, scrolling down or swiping upward stretches the lower
edge and fills a ring. Reaching the threshold opens that entry's URL in the same
tab; a shorter pull springs back. Clicking the cue opens its destination directly.
Keyboard users can tab to the cue and press Enter, or fill the ring with the
down arrow, Page Down, or Space. Escape cancels the selection and any pending navigation.
`src/scripts/orbit/orbit-scroll.js` owns this interaction; its `threshold` getter controls
the required pull distance. The effect respects reduced-motion preferences.
`src/scripts/orbit/orbit-inspection.js` owns the transition and foreground lighting, while
`src/scripts/orbit/preview-drag.js` positions the foreground object's drag target and handles
pointer, touch, and keyboard rotation.
`inspectionRotation` on an entry can choose the clearest detail view. The
foreground copy leaves the original object's orbital slot and lights moving, and
reduced-motion preferences skip the transition.

## About

The introduction in `src/pages/index.astro` uses Matvey's own copy. About, Projects,
and Blog share `src/components/CollectionHeader.astro`, pixel-font tabs and headings,
and system monospace body and card text. Their shared width and spacing, with
lavender About, blue Projects, and orange Blog accents, live in
`src/styles/orbit-scroll.css`.
The three contact icons are custom inline SVGs in `src/components/ContactIcon.astro`.
Each control has an accessible label, tooltip, and a 44px touch target.
Get in touch reveals the email address without requiring an email app.
`src/scripts/contact.js` adds copying and confirmation; the address and email link
remain available without JavaScript.

## Blog grid

`src/data/articles.json` lists blog articles and videos, newest first, with their exact
titles, publication dates, canonical links, calls to action, and original cover-image sources.
`src/components/ArticleGrid.astro` renders the cards and links directly to each post.
Covers are stored locally in `public/images/blog/` so the grid does not depend on a
third-party image request in the visitor's browser.

The `matbogus.substack.com` public archive and RSS feed were checked on
28 September 2026: both list four articles, all with individual cover images.
The next archive page was empty. The grid also includes the confirmed SoTA
letter "Rationalising Humanoids" (11 June 2025), signed by Matvey Boguslavskiy.
"An Exhibition" and jointly signed SoTA posts are intentionally excluded.
This is a static snapshot; add new posts and their covers to these files when
publishing. If a post has no cover, leave `image` empty until a cover is chosen.
Use the optional `imagePosition` field to keep the subject visible when a cover
is cropped to the card's aspect ratio.

## Blog book model

The Blog orbit uses `public/assets/models/substack-book.glb`: a closed white book with
an emissive orange Substack logo. The editable source is
`tools/modeling/substack-book.blend`. Rebuild it with:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python tools/modeling/create_book.py
```

The cover uses the [official Substack logo](https://substack.com/brand), stored
unchanged in `tools/modeling/substack-logo.png` and embedded in the GLB.
`src/scripts/orbit/orbit-models.js` handles model loading, orientation, and scaling to
the configured collision radius. Set `model` on another orbit entry to use a GLB.
Three.js 0.125.2 and its matching ES-module GLTFLoader are installed through npm.
Modeling sources are excluded from the site build.

## CubeSat and lighting

Projects uses `public/assets/models/svarog-cubesat.glb`, a stylized 3U model inspired by
the site's Svarog reference image: aluminium framing, body-mounted solar cells,
four deployed solar-panel wings at the forward end, eight luminous blue corner
beacons, an illuminated forward end face surrounded by the panels, and a folded
gold sail restrained in its central bay. The sail is stowed.
Edit `tools/modeling/svarog-cubesat.blend`, or regenerate with Blender using
`tools/modeling/create_cubesat.py` (the same command as for the book).

The Moon and model surfaces cast and receive shadows. The Substack mark and
blue corner beacons and forward end face are emissive; covers, pages, and other satellite structure need
external light. Blender's `emissiveSurface` custom property preserves beacon
emission when loading the GLB. The Blog
entry's `light` settings control an orange point light just above its cover,
which illuminates the Moon and is blocked by objects in its path. Shadow-map
settings live in `configureShadowLight` in `src/scripts/orbit/orbit-models.js`.
The Projects entry's `beaconLight` settings control blue light spilling onto the
Moon. Two shadow-casting point lights at opposite corners represent the eight
beacons, keeping shadow-map costs lower than a separate light at every corner.

## SoTA bust

SoTA links to `https://ilikethefuture.com` through `public/assets/models/sota-bust.glb`,
[Marble Bust 01](https://polyhaven.com/a/marble_bust_01) by **Rico Cilliers**, from
Poly Haven under [CC0](https://polyhaven.com/license). This male portrait has a
full head of hair and retains the original marble textures. The website version
adds emissive magenta eyes and packages the model and 1K textures into one GLB.
Its editable source is `tools/modeling/sota-bust.blend`; rebuild it using
`tools/modeling/create_bust.py` with Blender. Original downloaded files and source
credits are in `tools/modeling/polyhaven/marble_bust_01/`.
The orbit entry's `eyeLight` settings control two shadow-casting lights in
front of the eyes. These cast magenta light onto the Moon while the stone
itself remains non-emissive.
