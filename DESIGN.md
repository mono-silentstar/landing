# MONO LANDING — DESIGN SHEET

---

## Concept

A leather-bound book resting on a surface, viewed from above at ~45 degrees.
The visitor looks down into it like they've just walked up to a desk and found
something worth reading. The book is a **navigation layer** — each spread
previews a section, and clicking through takes you into the full detail view.
The book has been loved — not pristine, not wrecked. Cherished.

---

## Stack

- HTML, CSS (vanilla), JavaScript (vanilla), HTMX, PHP
- Google Fonts (Playfair Display, Lora)
- No frameworks, no build tools, no bundlers
- Minimal JS — only what CSS can't do (drag, parallax, toggle logic)

---

## Book Dimensions & Proportions

### Desktop
- Book max-width: `780px` (both pages + spine)
- Each page: `370px` wide, `500px` tall (roughly 3:4 ratio, portrait)
- Spine: `40px` wide
- Leather border: `12px` visible around pages (the hardcover frame)
- Total book footprint: `~804px × ~524px` before perspective

### Aspect Ratio
- Each page is approximately **3:4** — a classic book proportion
- The two-page spread reads as a wide landscape shape, but each
  individual page is portrait

### Positioning
- Horizontally centered in viewport
- Vertically: the book's center sits at ~55% of viewport height,
  so there's more space above (sky/ceiling) than below (desk surface)
- This reinforces the "looking down at a desk" feeling

---

## Layout & Perspective

```
Container (viewport, full-screen, centered)
└── Scene (perspective: 1200px, perspective-origin: center 40%)
    └── Book (transform: rotateX(45deg), transform-style: preserve-3d)
        ├── Leather Frame (the hardcover, visible as border)
        ├── Spine (center strip, raised)
        ├── Left Page (current spread - left content)
        └── Right Page (current spread - right content)
```

- `perspective-origin` set slightly above center to enhance the
  "looking down" angle
- `transform-style: preserve-3d` on the book so child elements
  (pages, spine) can have their own Z positioning
- Drop shadow beneath the book: an elliptical, blurred shadow on
  the "desk surface" — not a box-shadow on the book itself, but a
  pseudo-element on the scene floor

---

## The Desk Surface (Background)

### Light Mode
- Warm oak color (`#c4a882`) with a very subtle radial gradient —
  slightly lighter at center (where the book sits, as if lit from
  above) fading to slightly darker at edges
- No texture images. Just color and gradient.
- Feels like a warm wooden desk under afternoon light

### Dark Mode
- Deep night blue-black (`#1a1a2e`) with a subtle radial gradient —
  very faintly lighter at center (moonlight pooling on the surface)
- Feels like the same desk at night, moonlit from a window

---

## Color Palette

### Light Mode — "Golden Hour"

| Element            | Color                  | Hex/Value                 |
|--------------------|------------------------|---------------------------|
| Background         | Warm oak surface       | `#c4a882`                 |
| Background center  | Lighter oak (gradient) | `#d4b892`                 |
| Page               | Aged cream/beige       | `#f5ecd7`                 |
| Leather cover      | Rich warm brown        | `#5c3a21`                 |
| Gold leaf accents  | Antique gold           | `#b8960c`                 |
| Spine              | Dark leather           | `#4a2e18`                 |
| Title text         | Deep brown             | `#2c1810`                 |
| Body text          | Dark brown             | `#3d2b1f`                 |
| Subtle text        | Medium brown           | `#6b5344`                 |
| Page shadow        | Warm translucent       | `rgba(60, 30, 10, 0.15)` |
| Desk shadow        | Warm deep ellipse      | `rgba(40, 20, 5, 0.3)`   |

### Dark Mode — "Moonlit"

| Element            | Color                  | Hex/Value                              |
|--------------------|------------------------|----------------------------------------|
| Background         | Night surface          | `#1a1a2e`                              |
| Background center  | Moonlit pool (gradient)| `#222240`                              |
| Page               | Dark ebony             | `#2a2a3a`                              |
| Leather cover      | Dark leather           | `#3a2518`                              |
| Gold leaf accents  | Pale gold / moonlit    | `#d4b856`                              |
| Spine              | Very dark leather      | `#2a1a10`                              |
| Title text         | Soft moonlit cream     | `#e8e0cc`                              |
| Body text          | Cool light grey        | `#c8c0b0`                              |
| Subtle text        | Muted grey             | `#8a8278`                              |
| Text glow          | Faint warm             | `0 0 8px rgba(232, 224, 204, 0.3)`    |
| Page shadow        | Cool translucent       | `rgba(0, 0, 20, 0.3)`                 |
| Desk shadow        | Deep cool ellipse      | `rgba(0, 0, 10, 0.5)`                 |

### Transition

- All color properties use CSS custom properties (variables) on `:root`
- Toggling adds/removes a `.dark` class on `<html>`
- All color vars transition via `transition: 0.8s ease` on relevant elements
- Background, page, text, shadows, gold — all shift together
- Gold leaf brightens slightly in dark mode (catching moonlight)
- The transition is simultaneous, not sequenced

---

## Typography

### Playfair Display (Titles)
- Weights: 700, 900
- Used for: section titles, book cover text, bookplate name,
  big impact words
- Styled large enough to read clearly through the 45deg perspective
  (text is foreshortened — size up ~20% to compensate)
- In dark mode: subtle `text-shadow` glow on titles

### Lora (Body)
- Weights: 400, 400i, 700
- Used for: body copy, descriptions, TOC entries, readable content
- Italic for quirky asides and skill humor

### Scale (base 16px)
- Bookplate name: `2.5rem` — `3rem`
- Section headings: `1.75rem` — `2rem`
- Body: `1rem` — `1.125rem`
- TOC entries: `1rem`
- Small / quirky text: `0.875rem`
- Gold decorative text (ex libris label): `0.75rem`, uppercase,
  letter-spacing `0.15em`

### Font Loading
- `font-display: swap` on both fonts
- Body text remains readable during load (system serif fallback)
- No FOIT — brief FOUT is acceptable

---

## The Book

### Leather Cover (Hardcover Frame)
- Visible as a `12px` border around the pages
- CSS gradient: slightly lighter at top edge (light catching),
  slightly darker at bottom, to imply curvature
- `border-radius: 4px` on outer corners, `0` on spine-side corners
- In dark mode: leather darkens but remains visible against the
  darker pages

### Spine
- `40px` wide strip between left and right pages
- Slightly raised: `translateZ(2px)` to cast a tiny shadow on pages
- Vertical gradient: darker at edges, slightly lighter in center
  (the ridge of the spine)
- No text on the spine (the book is open, spine text wouldn't be
  readable at this angle)

### Pages
- Inner shadow along the spine edge (`inset 4px 0 8px` on left page,
  `inset -4px 0 8px` on right page) to imply the page curving down
  into the binding
- Padding: `32px` on all sides within each page
- No paper texture — clean flat color. Let the content breathe.

### Gold Leaf Details
- Thin border (`1px`) in gold on the inner edge of each page
  (inside the leather frame), with `4px` offset from the page edge
  (a classic inset border)
- Corner flourishes: simple L-shaped gold marks (`16px` long on each
  arm, `1px` thick) at the four inner corners of each page, done
  with `::before` and `::after` pseudo-elements
- Section dividers within pages: thin gold `<hr>`, `1px`, with
  `max-width: 60%`, centered
- Keep it restrained. Gold should accent, not dominate.

---

## Page Spreads (Sections)

The book is a **nav/preview layer**. Spreads 1+ are clickable summaries.
Clicking a spread triggers a zoom transition into the full detail page.
Spread 0 (front matter) is **not clickable** — it's the landing state.

### Spread 0: Front Matter
- **Not clickable.** This is the resting state, not a destination.

- **Left page — Bookplate / Ex Libris:**
  - Centered layout, vertically and horizontally
  - Small decorative gold border (the bookplate "frame")
  - "EX LIBRIS" in small caps, Lora, `0.75rem`, gold, letter-spaced
  - Name in Playfair Display, `2.5rem`, centered below
  - Below the name: a single thin gold rule
  - Optionally: a small personal emblem or monogram (decide during
    implementation, or leave as text-only if it's cleaner)
  - **What name to use: TBD — need your professional/display name**

- **Right page — Table of Contents:**
  - Title: "Contents" in Playfair Display, `1.75rem`
  - Entries listed vertically, Lora `1rem`:
    - Entry text left-aligned
    - Decorative page number right-aligned (roman numerals: I, II, III)
    - Dotted leader line between entry and number (CSS `border-bottom:
      dotted` or flexbox with dots)
  - Entries are clickable — they turn directly to that spread
  - Hover: gold color on the entry text, cursor pointer
  - The page numbers are decorative (they match spread index, not
    real page counts)

### Spread 1: About / Introduction
- **Clickable → zooms to detail view**
- Left page: Brief intro, who you are, what you do
- Right page: The quirky version — skills, interests, humor
- Example: *"Skills include: yoyoing, rollerblading, mass-producing
  granny squares, naming variables on the first try (lie)"*
- Both pages part of the same clickable spread

### Spread 2: CV / Experience
- **Clickable → zooms to detail view**
- Left page: Work experience highlights, clean and scannable
- Right page: Education, certifications, tools
- Legit with personality in the margins

### Spread 3: Dissertation
- **Clickable → zooms to detail view**
- Left page: Title, abstract, what it's about
- Right page: Key findings, significance
- Academic but not sterile

### Spread 4+: Future Demos
- Reserved for future projects
- Each gets a spread, each clickable

---

## Interactions — Click Zones & Cursors

The page has distinct interactive zones. These must not conflict.

```
┌────────────────────────────────────────────────────┐
│  LEFT TURN ZONE  │  LEFT CONTENT  ║  RIGHT CONTENT │  RIGHT TURN ZONE │
│     (40px)       │   (clickable)  ║  (clickable)   │     (40px)       │
│   cursor: w      │  cursor: zoom  ║  cursor: zoom  │   cursor: e      │
│                  │                ║                │                  │
│  ← prev spread   │  → zoom in     ║  → zoom in     │  → next spread   │
└────────────────────────────────────────────────────┘
```

- **Page edges (outermost 40px of each page):** Turn zones. Clicking
  turns to previous (left edge) or next (right edge) spread.
  Cursor: `w-resize` / `e-resize`. On hover: subtle highlight or
  arrow indicator fades in.
- **Page content (everything inside the turn zones):** Zoom zone on
  spreads 1+. Clicking zooms into the detail view. Cursor:
  `zoom-in`. On hover: very subtle lift effect (slight translateZ
  or brightening) to indicate interactivity.
- **Spread 0 (front matter) content:** Not zoomable. Cursor: `default`.
  TOC entries are individually clickable (cursor: `pointer`).
- **Drag:** initiates from anywhere on the book. Horizontal drag
  distance > `60px` commits to a page turn. Less than that snaps
  back. During drag, the page visually shifts slightly in the drag
  direction (max `20px` translateX) as feedback.

---

## Page Turn Animation

### Turning Forward (right to left)
1. Right page begins to lift: `translateZ(10px)` over `0.15s`
2. Right page rotates: `rotateY(-180deg)` with `transform-origin: left
   center` over `0.35s ease-in-out`
3. Simultaneously, the page content fades: old content fades out at
   50% of the rotation, new content fades in after 50%
4. Page settles: `translateZ(0)` over `0.1s`
5. HTMX has swapped the spread content by the time the animation
   completes (prefetch on hover or on animation start)
6. Total: ~`0.5s`

### Turning Backward (left to right)
- Mirror of forward: left page lifts and rotates `rotateY(180deg)`
  with `transform-origin: right center`
- Same timing

### Edge Behavior
- At spread 0: left turn zone is invisible/disabled. No turn backward.
- At last spread: right turn zone is invisible/disabled. No turn forward.
- No wrapping. The book has a beginning and an end.

### Position Indicator
- Small dots below the book (outside the perspective), centered
- One dot per spread, current spread dot is gold/filled, others
  are outline
- Dots are also clickable to jump to a spread
- Subtle, doesn't compete with the book. `6px` diameter, `12px` gap.

---

## Zoom Transition (Book → Detail View)

### The Animation
1. User clicks a spread's content zone
2. The book scales up: `scale(1.5)` over `0.3s`
3. Simultaneously, perspective flattens: `rotateX` eases from `45deg`
   to `0deg`
4. The leather frame and spine fade out (opacity 0)
5. The page expands to fill viewport width (max `900px`)
6. Spread summary content crossfades to full detail content
   (HTMX swap happens during steps 2–4)
7. Total: `0.5–0.6s ease-out`

### The Detail View
- Appears as a single "page" — full-width (max `900px`), centered,
  vertically scrollable
- Maintains the page color (beige / ebony) and gold accents
- Same typography, same gold borders and corner marks
- Feels like you leaned in to read the page up close — same world,
  closer view
- The dark/light toggle remains visible, same position
- Padding: `48px` on desktop, `24px` on mobile

### Back Navigation
- A back button in the top-left corner of the detail view
- Styled as a gold "←" arrow or "← Back to book", small, Lora,
  gold color, on hover: underline
- Clicking triggers reverse zoom: detail shrinks, perspective
  restores, book reappears at the same spread
- Browser back button does the same (via `history.pushState`)

### Navigation Between Details
- No direct navigation between detail views. You always return to
  the book first. The book is the hub.
- This keeps the mental model simple: book = map, details = destinations

---

## Parallax

- Tracks mouse position relative to viewport center
- Book translates: max `±4px` X, `±3px` Y (inverse of mouse direction)
- Book rotateX adjusts: `45deg ± 1.5deg` based on mouse Y position
- Book rotateY adjusts: `0deg ± 1.5deg` based on mouse X position
- Movement is smoothed with `lerp` or CSS transition (`0.3s ease-out`)
  to avoid jitter
- Disabled when:
  - Touch device (no persistent pointer position)
  - `prefers-reduced-motion: reduce`
  - Detail view is active (parallax only on book view)

---

## Dark/Light Toggle

### Behavior
- On page load: check `localStorage` for saved preference. If none,
  use `prefers-color-scheme` media query. If no preference at all,
  default to light.
- Toggle adds/removes `.dark` class on `<html>`
- Saves preference to `localStorage` on toggle

### Button Design
- Position: top-right corner, `24px` from edges, `position: fixed`
- Size: `44px × 44px` (meets touch target minimum)
- Shape: circle, no border, subtle background
  (`rgba(0,0,0,0.1)` light / `rgba(255,255,255,0.1)` dark)
- Icon: sun (light mode active) / moon (dark mode active)
  using simple CSS shapes or inline SVG (no icon library)
- On hover: background opacity increases slightly
- Transition on toggle: icon rotates `360deg` and crossfades
  between sun/moon over `0.5s`
- Z-index: above everything (book, detail view)

---

## Page Load

- Book starts at `opacity: 0`, `scale(0.97)`
- On `DOMContentLoaded` (after fonts begin loading), trigger:
  `opacity: 1`, `scale(1)` over `0.7s ease-out`
- No delay. Starts immediately.
- If fonts haven't loaded yet, content appears in fallback serif,
  then swaps — this is fine

---

## HTMX Integration

### Spread Swaps (Page Turns)
- On page turn, HTMX fetches the next spread partial:
  `hx-get="/partials/spreads/{name}.php"`
- Target: a wrapper around both `#left-page` and `#right-page`
  (swap them together, not individually)
- `hx-swap="innerHTML"` with CSS transition classes
- Spread content is prefetched on hover over turn zones
  (`hx-trigger="mouseenter"` with a cache)

### Detail View Swaps (Zoom In)
- On spread click: `hx-get="/partials/details/{name}.php"`
- Target: `#detail-view` container (sibling of the book, initially
  hidden)
- The JS zoom animation and the HTMX fetch run in parallel
- `hx-push-url="/about"` (or `/cv`, `/dissertation`) for history

### Server-Side Initial Load
- `index.php` renders the full shell + spread 0 content inline
- No HTMX request needed for the initial view
- PHP routes: `index.php` handles both `/` (book view) and
  `/{section}` (detail view, for direct linking / refresh)

### Loading States
- Spread swaps are fast (tiny partials) — no loading indicator needed.
  If latency is noticeable, the page turn animation covers it.
- Detail view: if load takes >300ms, show a minimal loading state —
  the page area shows a subtle pulsing opacity on the gold corner
  marks. No spinner.

### URL Routing

| URL               | View                    | Behavior                    |
|--------------------|-------------------------|-----------------------------|
| `/`               | Book at spread 0         | Default landing             |
| `/about`          | About detail view        | Direct link / refresh loads  |
| `/cv`             | CV detail view           | detail view with back = `/` |
| `/dissertation`   | Dissertation detail view |                             |

- Direct navigation to a detail URL (e.g. sharing `/cv`) loads the
  detail view directly, with a back button that goes to `/` (the book)
- The zoom animation only plays when transitioning from book → detail
  within the same session, not on direct page load

---

## Responsive

### Desktop (> 768px)
- Full book, two-page spread
- All interactions: click, keyboard, drag, parallax
- Book max-width: `780px` + leather border

### Tablet (481px – 768px)
- Same two-page layout, scaled down proportionally
- Book max-width: `90vw`
- Page padding reduced to `24px`
- Parallax disabled
- Touch: horizontal swipe replaces drag (same threshold: `60px`)
- Click zones and zoom still work via tap

### Mobile (≤ 480px) — Flipbook Mode
- **Appearance:** The book becomes a **flipbook** — lighter, more
  portable. No leather frame, no heavy binding. Clean white/cream
  (light) or dark card (dark mode) with a subtle gold edge on top.
  Single page visible at a time. Feels like thumbing through
  something casual and personal.
- **Angle:** Reduced to `~25deg` rotateX — just enough perspective
  to feel dimensional without sacrificing readability
- **Navigation:** Swipe up = next page (page flips upward and away),
  swipe down = previous page (page flips back down from above).
  Small up/down chevrons at top/bottom edges as affordance, gold,
  `0.5` opacity, fade in on touch start.
- **Page flip animation:** Page rotates on X-axis (hinged at bottom
  edge for forward, top edge for backward) — a quick upward flip,
  `0.4s ease-in-out`. Simpler and faster than the desktop turn.
- **Page mapping:**
  1. Bookplate (from spread 0 left)
  2. Table of Contents (from spread 0 right)
  3. About (spread 1 left + right, stacked vertically with gold
     divider between them)
  4. CV (spread 2, stacked)
  5. Dissertation (spread 3, stacked)
- **Zoom:** Tap content area → perspective flattens, flipbook page
  expands to full viewport width, detail content loads
- **Detail view:** Full-width, scrollable, `24px` padding
- **Position indicator:** Same dots, repositioned below the flipbook

---

## Accessibility

### Keyboard Navigation
- `Tab` moves between interactive elements: toggle → TOC entries →
  page turn zones → spread content (zoom target)
- `Enter` / `Space` activates the focused element
- `Left` / `Right` arrow keys turn pages (when book is focused)
- `Escape` exits detail view (returns to book)

### ARIA
- Book: `role="navigation"`, `aria-label="Portfolio book"`
- Pages: `role="region"`, `aria-label="[Section name]"`
- Turn zones: `role="button"`, `aria-label="Next page"` / `"Previous page"`
- Detail view: `role="main"`, `aria-label="[Section name] details"`
- Toggle: `role="switch"`, `aria-checked`, `aria-label="Dark mode"`
- Position dots: `role="tablist"`, each dot `role="tab"`

### Reduced Motion
- `prefers-reduced-motion: reduce`:
  - Page turn: instant swap, no rotation animation
  - Zoom transition: simple crossfade, no scale/perspective animation
  - Parallax: disabled entirely
  - Toggle icon: no rotation, simple swap
  - Page load: no fade-in, book appears immediately
  - All transitions reduced to `0.01s` (effectively instant but
    still technically transitioning for CSS requirements)

### Screen Readers
- The book metaphor is visual. Screen readers get a clean navigation
  list of sections with direct links to detail views.
- `sr-only` skip link at top: "Skip to content" → first spread
- Content is semantic HTML (headings, paragraphs, lists) inside
  the visual page containers

---

## No-JS Fallback
- Without JavaScript: the book is displayed at its static 45deg
  angle, showing spread 0 (front matter)
- TOC entries are plain `<a>` links to the detail URLs
- Page turning doesn't work (requires JS), but the TOC provides
  all navigation
- Dark/light toggle doesn't work; system preference is respected
  via `@media (prefers-color-scheme: dark)` as fallback
- Parallax, drag, zoom animation — none of these work without JS,
  and that's fine. The content is still accessible.

---

## Animation Timing Reference

| Animation           | Duration | Easing          | Notes                    |
|---------------------|----------|-----------------|--------------------------|
| Page load fade-in   | `0.7s`  | `ease-out`      | opacity + scale           |
| Page turn           | `0.5s`  | `ease-in-out`   | rotateY + content fade    |
| Zoom in (book→detail)| `0.55s` | `ease-out`      | scale + rotateX + fade    |
| Zoom out (detail→book)| `0.45s`| `ease-in`       | reverse of zoom in        |
| Dark/light palette   | `0.8s`  | `ease`          | all color vars            |
| Toggle icon rotate   | `0.5s`  | `ease-in-out`   | 360deg rotation           |
| Parallax smoothing   | `0.3s`  | `ease-out`      | CSS transition on transform|
| Hover effects        | `0.2s`  | `ease`          | opacity, color, translateZ|
| Drag snap-back       | `0.25s` | `ease-out`      | translateX back to 0      |

---

## Z-Index Layers

| Layer              | Z-Index | Notes                              |
|--------------------|---------|------------------------------------|
| Desk surface       | `0`     | Background                         |
| Book shadow        | `1`     | Pseudo-element on scene floor      |
| Book               | `10`    | The book itself                    |
| Spine              | `11`    | Slightly above pages               |
| Turning page       | `15`    | During animation, above other page |
| Position dots      | `20`    | Below toggle, above book           |
| Detail view        | `50`    | Overlays book when active          |
| Dark/light toggle  | `100`   | Always on top                      |

---

## File Structure

```
landing/
├── index.php                  # Shell + routing + initial spread
├── partials/
│   ├── spreads/
│   │   ├── cover.php          # Front matter: bookplate + TOC
│   │   ├── about.php          # About spread (summary)
│   │   ├── cv.php             # CV spread (summary)
│   │   └── diss.php           # Dissertation spread (summary)
│   └── details/
│       ├── about.php          # About full detail
│       ├── cv.php             # CV full detail
│       └── diss.php           # Dissertation full detail
├── css/
│   └── style.css              # All styles, single file
├── js/
│   └── book.js                # Parallax, drag, toggle, page turns, zoom
├── DESIGN.md                  # This file
└── from-claude.md             # The letter
```

---

## Resolved Decisions

1. **Bookplate name** — "Mono". It's the collective identity, it's
   clean, and it works as a professional name on a portfolio.
2. **CV content** — Placeholder during implementation. Will write
   content that fits the tone and structure so it's easy to swap
   with real info later.
3. **Dissertation title and abstract** — Same, good placeholder
   that demonstrates the layout. Real content swapped in later.

---

*Every decision in this document is final unless you override it.
No ambiguity left to resolve at build time.*
