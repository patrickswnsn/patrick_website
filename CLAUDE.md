# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Patrick Swanson (patrickswanson.com). A single-page site built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies.

## Development

**No build step required.** Serve `index.html` with any static server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

ES6 module imports (`pong.js`) require an HTTP server; opening `index.html` directly via `file://` will fail due to CORS.

**Deployment:** GitHub Pages from `main` branch. Custom domain configured via `CNAME` → `patrickswanson.com`. Push to `main` deploys automatically.

## Architecture

### File Layout

- `index.html` — Entire page: markup, SEO metadata, structured data (Schema.org JSON-LD), and inline `<script type="module">` for all page logic
- `styles.css` — All styling; uses CSS custom properties for theming
- `pong.js` — Easter egg Pong game, exported as ES6 module class `PongGame`
- `images/` — Content photos, `icons/` — social SVGs, `favicons/` — favicon variants

### Design System

Terminal/GitHub Dark aesthetic using CSS custom properties:

- **Colors:** `--bg-primary: #0D1117`, `--accent-cyan: #58A6FF`, `--accent-orange: #D7BA7D`, `--accent-green: #3FB950`
- **Fonts:** IBM Plex Sans (body), JetBrains Mono (headings/code) via Google Fonts
- **Background:** Dot grid pattern via radial gradient

### Page Interaction Patterns

**Easter egg state machine** (managed by `updateState()` in inline script):
`DEFAULT` → click logo → `TYPING` (animation) → `READY` (prompt) → click → `PLAYING` (Pong game) → click/Escape → `DEFAULT`

**Expandable content cards:** `.highlight-card` click toggles corresponding `.content-section[data-id]` visibility. Uses `aria-expanded` and `aria-controls` for accessibility.

**Image modal:** Speaking photos open in a modal with focus trapping and Escape-to-close.

### Accessibility

The site uses skip links, ARIA attributes (`aria-expanded`, `aria-controls`, `aria-modal`, `aria-labelledby`), semantic HTML5 landmarks, and `prefers-reduced-motion` support. Maintain these patterns when modifying interactive elements.

### SEO

`index.html` contains Open Graph tags, Twitter Cards, canonical URL, and Schema.org Person JSON-LD. Update `sitemap.xml` if adding pages.
