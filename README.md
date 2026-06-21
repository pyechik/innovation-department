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
- The three alternate headlines from the original copy are preserved as
  options — swap the `.hero-title` block if you want a different hook.
