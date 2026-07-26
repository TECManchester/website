# Brand assets

The official Elevation Church Manchester logo, in three variants. Every logo on
the site reads from `brand` in `src/lib/church.ts` — change the paths there, not
in components.

| File               | Variant                          | Used on                              |
| ------------------ | -------------------------------- | ------------------------------------ |
| `logo-colour.png`  | Full colour (blue + green swirl) | Header, and any light background      |
| `logo-white.png`   | All white                        | Footer, mobile menu, OG image         |
| `logo-navy.png`    | Single-colour navy               | Spare, for light backgrounds          |

Source artwork: 938 × 307 PNG with transparency.

## Derived assets

Generated from these files — regenerate if the logo ever changes:

- `src/app/icon.png` / `apple-icon.png` — the swirl mark alone, cropped to its
  bounding box and centred on white
- `src/app/opengraph-image.png` / `twitter-image.png` — the white lockup on ink
  at 1200 × 630

## Note on format

These are PNG. SVG would be better — the swirl has fine linework and the
wordmark is widely letterspaced, so at large sizes on retina the PNG will
soften. If a vector original exists, drop it in and update the paths.
