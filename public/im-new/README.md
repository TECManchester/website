# "We'd love to meet you" card images

Three cards on the homepage: **What to expect**, **Times & location**,
**Kids & teens**. Each has an optional photo. Without one the card shows a
green tinted panel with the icon, so it still looks deliberate — but photos
are much stronger here.

## Dimensions

| | |
| --- | --- |
| **Size** | **1200 × 900 px** (4:3) |
| Minimum | 800 × 600 |
| Format | JPEG, sRGB, quality 80–85 |
| File size | Under 400 KB each |

The cards render about 380 px wide, so 1200 px covers retina with room to
spare. They crop to 4:3 — anything else gets centre-cropped and may lose the
edges.

## What each one should show

**What to expect** — the room mid-service. Worship, the congregation engaged,
a sense of what a Sunday actually feels like. Not an empty auditorium.

**Times & location** — the building, the entrance, or people arriving. Helps
someone recognise the place when they turn up. The Mary Seacole Building
exterior or the welcome desk both work.

**Kids & teens** — The Seeds or 412 Nation in action. Parents look at this
one hardest. **Needs parental consent for every child who is recognisable.**

## Composition

A green icon badge sits over the **bottom-left corner** of each image, and a
soft dark gradient runs across the bottom third. So:

- Keep faces in the **upper two-thirds** and away from the bottom-left
- Avoid anything important in the bottom 25%

Warm, bright, candid — the same look as the banner photos. These sit on white,
so they can be brighter than the hero images.

## Naming

```
what-to-expect.jpg
times-and-location.jpg
kids-and-teens.jpg
```

Then set `image` on the matching entry in `newHereCards` in
`src/app/page.tsx`, e.g. `image: "/im-new/what-to-expect.jpg"`.
