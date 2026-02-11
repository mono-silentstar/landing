# Mono Landing

A leather-bound book portfolio site. Vanilla HTML/CSS/JS + HTMX + PHP.

**Live:** `mono.me.uk/landing`

---

## Architecture

No frameworks, no build tools, no bundlers. Single CSS file, two JS files
(both IIFEs), PHP router with `.htaccess` rewrite. HTMX handles partial
content loading for page turns and detail views.

### File Structure

```
landing/
├── index.php                     # HTML shell + PHP router
├── .htaccess                     # Apache rewrite → index.php
├── .cpanel.yml                   # cPanel Git deployment config
├── css/
│   └── style.css                 # All styles (27 sections)
├── js/
│   ├── book.js                   # Book interactions (IIFE)
│   └── particles.js              # Canvas particle system (IIFE)
├── partials/
│   ├── spreads/
│   │   ├── cover.php             # Bookplate + TOC
│   │   ├── about.php             # About summary (2 pages)
│   │   ├── cv.php                # CV summary (2 pages)
│   │   └── diss.php              # Dissertation summary (2 pages)
│   └── details/
│       ├── about.php             # About full content
│       ├── cv.php                # CV full content
│       └── diss.php              # Dissertation full content
├── DESIGN.md                     # Original design spec
├── IMPLEMENTATION.md             # Original build plan
└── from-claude.md                # Letter
```

---

## How It Works

### The Book

A two-page spread rendered in CSS 3D perspective (`rotateX(45deg)`),
giving the illusion of looking down at an open book on a desk. The book
has a leather cover frame, a spine with a raised ridge, gold inset
borders, and corner flourishes — all CSS.

There are 4 spreads:

| Index | Name   | Left Page         | Right Page           | Zoomable |
|-------|--------|-------------------|----------------------|----------|
| 0     | cover  | Bookplate         | Table of Contents    | No       |
| 1     | about  | About intro       | Skills & Interests   | Yes      |
| 2     | cv     | Experience        | Education & Tools    | Yes      |
| 3     | diss   | Dissertation      | Key Findings         | Yes      |

### Navigation

- **Turn zones:** Narrow strips on page edges (left = previous, right =
  next). Hidden at boundaries (no prev on spread 0, no next on spread 3).
- **Arrow keys:** Left/Right to turn pages.
- **Dots:** Click to jump to any spread.
- **TOC links:** Click to jump to a spread from the cover.
- **Zoom:** Click any zoomable spread content to enter detail view.
- **Back:** Click "Back to book" or press Escape to return.

### Page Turns

1. JS clones the turning page as a "phantom page"
2. Phantom animates `rotateY(±180deg)` with a subtle `translateZ` lift
3. Real spread content fades to `opacity: 0`
4. HTMX fetches the new spread partial and swaps `#spread-content`
5. Content fades back to `opacity: 1` when animation completes
6. Phantom is removed from DOM

### Zoom Transition (Book → Detail)

1. Click zoomable content → `scene--zooming-in` class added
2. Book scales up (`1.5×`), perspective flattens, book fades out
3. HTMX fetches detail partial in parallel
4. Detail view slides up and fades in
5. URL updated via `history.pushState`

### URL Routing

| URL              | View    | PHP renders                         |
|------------------|---------|-------------------------------------|
| `/`              | Book    | Shell + cover spread                |
| `/about`         | Detail  | Shell + about detail (pre-rendered) |
| `/cv`            | Detail  | Shell + cv detail (pre-rendered)    |
| `/dissertation`  | Detail  | Shell + diss detail (pre-rendered)  |

Direct URL loads render the full page server-side. HTMX partial routes
(`/spread/{name}`, `/detail/{name}`) only respond to requests with the
`HX-Request` header.

---

## Theming

Two modes: **Golden Hour** (light) and **Moonlit** (dark).

- All colors defined as CSS custom properties on `:root`
- `.dark` class on `<html>` overrides the variables
- `0.8s ease` transition on all color properties
- Preference saved to `localStorage`, falls back to `prefers-color-scheme`
- No-JS fallback: `@media (prefers-color-scheme: dark)` on
  `html:not(.light-applied)` — JS adds `.light-applied` on boot

### Theme Toggle

Fixed top-right, 44px circle. Sun/moon SVG icons crossfade with rotation.
`role="switch"`, `aria-checked` updated by JS.

---

## Ambient Effects

### Parallax

Mouse movement shifts the book slightly (±4px translate, ±1.5deg rotate).
Disabled on touch devices and when `prefers-reduced-motion: reduce`.

### CSS Gradient Blobs

`.ambient-glow` inside `.scene` — two pseudo-element blobs with
`filter: blur(80px)` drifting on slow CSS animations. Golden/peach in
light mode, violet/blue in dark mode.

### Canvas Particles (`particles.js`)

Full-viewport `<canvas>` behind everything (`position: fixed`, `z-index: 0`).

**Light mode:** ~15 cherry blossom petals + ~10 leaves drifting downward
with sine-wave sway and slow rotation. Wrap bottom→top.

**Dark mode:** ~25 fireflies with radial gradient glow, pulsing opacity,
random wander with lerp steering. Soft-bounce off viewport edges.

**Theme crossfade:** Old particles fade out with staggered timing (~1s),
new particles fade in (~1.6s), creating a ~1.5s overlap.

Pool size capped at 30 particles. No allocations in render loop.
Respects `prefers-reduced-motion` — canvas stays blank.

`book.js` calls `window.ambientParticles.setTheme(dark)` on theme change.

---

## Interaction Hint

On first visit, a text hint appears below the dots:

> Click a page to read more · Use arrow keys to turn pages

Turn zones pulse gold, and zoomable content borders pulse. Dismissed on
first click or keypress, stored in `sessionStorage`. `.book--hinting`
class controls the pulse animations.

---

## Responsive

### Desktop (>768px)
Full book, parallax, all interactions.

### Tablet (481–768px)
Book scales to `90vw`. Page dimensions use CSS `calc()` with
`aspect-ratio: 3/4`. Padding reduced.

### Mobile (≤480px)
Same book layout as desktop, scaled to `96vw`. Perspective reduced to
`25deg`. Spine, leather border, and padding shrink. Typography inside
book pages uses `em` units (base `font-size: 9px` on `.book__page`)
so text scales proportionally. Phantom pages get the same font-size
treatment.

---

## Accessibility

- **Skip link:** "Skip to content" → `#spread-content`
- **ARIA roles:** `role="navigation"` on book, `role="tablist"` on dots,
  `role="switch"` on toggle, `role="main"` on detail, `role="button"` on
  turn zones
- **Keyboard:** Arrow keys (page turn), Escape (close detail), Tab
  (focus navigation)
- **Reduced motion:** CSS `@media (prefers-reduced-motion: reduce)`
  kills all animations/transitions. JS checks `matchMedia` and skips
  phantom pages, instant-swaps content
- **No-JS:** Book displays statically. TOC entries are `<a>` tags
  linking to detail URLs. Turn zones, dots, and toggle are hidden.

---

## Deployment

Deployed via cPanel Git. Push to the repo triggers `.cpanel.yml` which
copies all files to `/home/monomeuk/public_html/landing/`.

---

## Adding a New Section

1. Create `partials/spreads/{name}.php` — two `book__page` divs with
   content and turn zones (see existing spreads for format)
2. Create `partials/details/{name}.php` — `<article>` with full content
3. Add route to `$sections` in `index.php`
4. Add spread name to `CONFIG.spreads` array in `book.js`
5. Add copy lines to `.cpanel.yml`
6. Set `data-detail="/detail/{name}"` on spread page-content elements

---

## CSS Sections (style.css)

```
 1. Reset & Base           14. Position Dots
 2. Custom Properties      15. Detail View
 3. Typography             16. Theme Toggle
 4. Body / Desk Surface    17. Page Turn Animation
 5. Scene                  18. Zoom Animation
 6. Book Cover             19. Hover States
 7. Book Spine             20. Interaction Hint
 8. Book Pages             21. Hinting Pulse
 9. Gold Details           22. Ambient Glow
10. Page Content Typography 23. Ambient Canvas
11. Bookplate              24. Reduced Motion
12. Table of Contents      25. No-JS Dark Mode Fallback
13. Turn Zones             26. Tablet (≤768px)
                           27. Mobile (≤480px)
```
