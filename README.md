# The Innovation Department — website

A single-page, animated "metaphorical business card" for an SF-based brand
incubator. Static HTML/CSS/JS — no build step, no framework.

## Files

```
index.html   All the copy + page structure
styles.css   Visual design (colors, type, layout, responsive)
main.js      Animations: Lenis smooth-scroll + GSAP / ScrollTrigger
```

GSAP, ScrollTrigger, and Lenis load from a CDN (see the `<script>` tags at the
bottom of `index.html`) — nothing to install.

## Preview locally

Just double-click `index.html`, or for a proper local server:

```bash
cd innovation-department
python3 -m http.server 8000
# then open http://localhost:8000
```

(A server isn't required, but it's closer to how it'll behave when hosted.)

## Make the contact form work

The form currently posts to a Formspree placeholder. To turn it on:

1. Create a free form at <https://formspree.io>.
2. In `index.html`, find `action="https://formspree.io/f/YOUR_FORM_ID"` and
   replace `YOUR_FORM_ID` with your real form ID.

Submissions then arrive in your email — no server needed. The direct
`hello@innovation-department.com` mailto link works immediately.

## Fonts

- **Display — Nyght Serif** (headlines): self-hosted in `fonts/`, free under the
  SIL Open Font License. Nothing to do; it just works.
- **Body — Montserrat** (body text, nav, paragraphs, form): free Google Font,
  loaded via the `<link>` in `index.html`. Nothing to install.

## Deploy (free)

Any static host works. Easiest options:

- **Netlify / Vercel** — drag the `innovation-department` folder onto their
  dashboard, or connect a Git repo. Done.
- **GitHub Pages** — push the folder to a repo, enable Pages.

## Editing notes

- **Headline / all copy** lives in `index.html` — edit text directly.
- **Colors & type** are CSS variables at the top of `styles.css`
  (`--coral`, `--cream`, `--ink`, fonts). Change them in one place.
- **Animation feel** (speeds, easing, reveals) is in `main.js`. Each block is
  commented. All motion respects `prefers-reduced-motion`.
- **Hand-lettered words** — the page mixes the serif with custom
  lettering exported from Figma, placed as transparent `<img>`s in the
  `.hero-title` block. Each is sized with an `em`-based `height` (so it scales
  with the responsive heading) and an `aspect-ratio`, and carries an `alt` so
  the headline still reads as text for screen readers.
  - **"Distinctive brands"** — flowing hand-script, the current first line.
    Ships as `images/distinctive-brands.webp` (transparent ink, ~8 KB);
    styled by `.hero-title .script-word` (a block element).
  - **"Robert"** — the same hand-script, inline in the Who section's
    "Hi, I'm _Robert_". Ships as `images/robert.webp` (transparent ink, ~7 KB);
    styled by `.who-lead .script-name` (inline, baseline-seated).
  - **"unmissable"** — bolder hand-painted brush word, kept available as an
    alternate hook. Ships as `images/unmissable.webp` (~38 KB, vector source
    `images/unmissable.svg`); styled by `.hero-title .brush-word` (inline,
    baseline-seated). Not used in the current hero — swap it back into the
    `.hero-title` if you prefer the "for *unmissable* products." treatment.
- **Page structure** (reconciled to the Figma full-page design):
  - **Header** is minimal — the brand reads "The Innovation Department"
    (muted, uppercase, letter-spaced) and the only nav item is "Let's go ↓".
  - **Hero** is pared back — no eyebrow, a single "Let's talk →" pill, and a
    Montserrat (sans) sub-line.
  - **Approach + Services** are one section (`.why-what`, `#what`): the
    `.statement` "Every great brand starts with a simple idea." + `.statement-sub`,
    a hairline divider, then the three `.services` cards.
  - **Process** (`#how`) is headed by the `.statement` "My Process" (the old
    "Dig › Define › Design › Deliver" title and numbered section indices were
    dropped across the page; the contact section keeps its "06 — Let's talk").
  - **Who** (`#who`) is two columns — bio paragraphs on the left, "Hi, I'm
    _Robert_" above a black-and-white portrait on the right (color on hover).
  - **Work** cards show the image only; on hover the secondary image
    cross-fades in and a gradient `.work-caption` reveals the project name +
    description over the lower edge (always shown on touch devices).
