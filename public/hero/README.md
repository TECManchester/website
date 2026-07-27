# Hero photography spec

Drop images in this folder, then list them in `heroSlides` in
`src/lib/church.ts`. With no images the hero falls back to the gradient, so
nothing breaks while you're gathering them.

---

## 1. Dimensions

| | |
| --- | --- |
| **Size** | **2560 × 1440 px** (16:9) |
| Minimum | 1920 × 1080 — below this it softens on large screens |
| Format | JPEG (not PNG — photos compress far better as JPEG) |
| Colour | sRGB |
| File size | Under 1.5 MB each before upload |
| Quality | Export at 80–85. Above that you're adding bytes, not detail |

Don't sharpen, add borders, watermarks, or burn text into the image. The site
draws all text over the top, live.

---

## 2. The single most important rule: keep the subject RIGHT of centre

The headline sits on the **left**. On desktop the left ~45% is covered by a dark
wash and the words "Making greatness common."

**Put faces and action in the right half.** A photo with the subject dead-centre
looks fine in the camera roll and gets half-hidden behind the headline here.

```
┌──────────────────────────────────────────────┐
│  ████████████████                            │
│  ██ HEADLINE  ██        ← SUBJECT HERE →     │
│  ██ SITS HERE ██          faces, worship,    │
│  ████████████████         welcome, hands     │
│                                              │
│  ░░░░░ keep this band calm — buttons ░░░░░   │
└──────────────────────────────────────────────┘
   ← 45% covered →
```

---

## 3. Mobile

This is where most hero images fall apart. On a phone the hero is roughly
**390 × 640** — portrait. A 16:9 landscape gets cropped to about **a third of its
width**, so anything near the left or right edge disappears.

Two ways to handle it:

**Option A — one image, set a focal point (simplest)**
Leave generous space around the subject and set `focal` in `heroSlides`:

```ts
{ src: "/hero/worship.jpg", alt: "...", focal: "object-[65%_40%]" }
```

That's "65% across, 40% down" — the point that stays in frame as the crop
narrows. Default is centre.

**Option B — supply a portrait crop too (best results)**
Also export **1200 × 1600 (3:4)** versions. Tell me and I'll add `<picture>`
art direction so phones get the portrait crop and desktops get the landscape.
This is what the crop-heavy option can't match, and it's worth it for the first
slide at least.

---

## 4. What the photos should look like

The design is dark ink with a lime-green accent, and every image sits under a
dark wash. That drives the brief:

**Expose slightly bright.** Images get darkened by the overlay. A photo that's
already moody goes to mud. Shoot or edit a stop brighter than feels right.

**Keep the right side clean.** Busy backgrounds behind the headline area turn to
noise. Depth of field helps — a soft background makes text sit better.

**People, not the building.** A visitor's real question is *"will I fit in
here?"* Faces answer it; an empty auditorium doesn't. Aim for a mix that shows
the range of who actually comes on a Sunday.

**Candid over posed.** Mid-worship, mid-conversation, mid-laugh. Someone looking
at the camera and smiling reads as a stock photo.

**Warm tones sit well with the green.** Golden light, warm skin tones, warm
wood. Cold blue-grey fights the palette.

### A good set of 3–5 slides

1. **Wide worship** — hands up, room full, from the back or side. Sets the scale.
2. **One face, close** — someone genuinely caught in the moment. This is the
   emotional one.
3. **Welcome** — a hug, a handshake, coffee, conversation in the foyer. Answers
   "will anyone talk to me?"
4. **Kids or teens** — The Seeds or 412 Nation, if you have consent. Parents look
   for this before anything else.
5. **Manchester** — the city, the campus, something that locates you. Says "this
   church is *here*."

### Avoid

- Screenshots or frame-grabs from the livestream — too soft, wrong aspect
- Anything with a logo, lower-third or slide already burned in
- Heavy filters, vignettes, or HDR
- Backs of heads only
- Stock photography of a church that isn't yours

---

## 5. Consent

Anyone recognisable needs to be happy appearing on a public website, and for
**under-18s that means parental consent**, in line with your safeguarding
policy. Check before sending photos, not after they're live.

---

## 6. Naming

Lowercase, hyphens, descriptive:

```
worship-sunday-wide.jpg
welcome-foyer.jpg
the-seeds-kids.jpg
```

Then in `src/lib/church.ts`:

```ts
export const heroSlides: HeroSlide[] = [
  {
    src: "/hero/worship-sunday-wide.jpg",
    alt: "The congregation worshipping together on a Sunday morning",
    focal: "object-[60%_40%]",
  },
];
```

The `alt` text is read aloud by screen readers — describe what's happening, not
"hero image 1".
