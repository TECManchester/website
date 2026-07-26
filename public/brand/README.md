# Brand assets

Drop the official Elevation Church Manchester logo files here, then set
`brand.hasLogoFiles = true` in `src/lib/church.ts`. Nothing else needs to change
— every logo on the site reads from there.

## Required files

| Filename          | What it is                          | Used on                                    |
| ----------------- | ----------------------------------- | ------------------------------------------ |
| `logo-colour.svg` | Blue mark + blue wordmark           | Header, and any white/light background     |
| `logo-white.svg`  | All white                           | Footer, dark hero, mobile menu             |
| `logo-navy.svg`   | Solid navy                          | Light backgrounds needing extra contrast   |

## Format

**SVG is strongly preferred** — the logo is line art with fine detail in the
swirl and the letterspaced wordmark, and it renders at everything from 38px in
the header to full width on a retina display. SVG stays sharp at every size and
is a fraction of the file size.

If only raster is available, supply PNG with transparency at **3x** the largest
display size (so at least 1140 × 348) and name them `.png` instead, updating the
paths in `src/lib/church.ts`.

Do not use JPEG — it has no transparency and will show a white box on the dark
footer.

## Also useful

- `favicon` source at 512 × 512 (the mark alone, no wordmark)
- `og-image.png` at 1200 × 630 for link previews on social media
