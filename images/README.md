# Images

Drop image files in this folder using these exact names. Until a file exists,
the site shows a clean branded placeholder (not a broken icon), so you can add
them whenever you're ready.

## Portrait
- `robert.jpg` — photo of Robert (shows in the "Hi, I'm Robert" section).
  Best as a portrait/vertical crop (roughly 4:5). ~1000×1250px is plenty.

## Project images (The Work)
Landscape crops work best (roughly 4:3). ~1200×900px each.

- `swell.jpg`        — S'well
- `hampton.jpg`      — Hampton by Hilton
- `planters.jpg`     — Planters
- `caprisun.jpg`     — Capri Sun
- `annies.jpg`       — Annie's Homegrown
- `lunchables.jpg`   — Lunchables
- `tecate.jpg`       — Tecate
- `maxi.jpg`         — Maxi Nutrition
- `mcdonalds.jpg`    — McDonald's
- `unilever.jpg`     — Unilever
- `doggos.jpg`       — Currently building (the dog food project)

## Tips
- `.jpg`, `.png`, or `.webp` all work — but keep the filename's extension
  matching what's referenced (the code expects `.jpg`). If you use a different
  type, update the `data-img="..."` / `src="..."` in `index.html`.
- Compress before adding (e.g. tinypng.com) so the page stays fast on phones.

## Web-optimized derivatives (`-web.webp`)

Work-card imagery is served from `<name>-web.webp` derivatives, not the
originals. Originals are kept in this folder untouched as the source of truth —
re-derive from them, never from a `-web.webp`.

Recipe (Pillow): longest side capped at 1600px (never upscaled), WebP quality
80, `method=6`. A fully-opaque alpha channel is dropped; real transparency is
preserved (only `Capri2` actually uses it).

Cards render ~450px wide in a 3-column 1440px grid, so 1600px covers 2x retina
with headroom. Total work imagery: 52.6 MB -> 2.6 MB.

If you add a project, generate a `-web.webp` and reference *that* from the
`data-img` / `data-img-hover` / `data-poster` attribute in `index.html`.
