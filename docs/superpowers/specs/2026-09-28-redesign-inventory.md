# Inventory: Next.js public site at /Users/wisdomhambolu/Projects.nosync/website

Paths are relative to that root. Pages live in `src/app/(site)/`.

## 0. Global design tokens (`src/app/globals.css`)

**Colours** (hex, lines 21-31):

| Token | Hex | Notes |
|---|---|---|
| green | `#84c224` | Fill/glow only. It fails contrast as text on white (2.4:1). |
| green-600 | `#6fa61c` | Text-safe green: links, eyebrows. |
| green-100 | `#eaf6d6` | |
| ink | `#0e0e2c` | Navy; used for headings and dark sections. |
| ink-800 | `#1b1f29` | Footer background. |
| grey-50 | `#f7f8f5` | |
| grey-100 | `#f1f1ef` | |
| grey-300 | `#d7d9d6` | |
| grey-500 | `#676767` | Muted body text. |
| grey-700 | `#4b4f58` | Default body text colour. |
| gold | `#e6a700` | Unused. |

**Shadows**
- `shadow-card`: `0 10px 30px rgb(14 14 44/.08)`
- `shadow-card-lg`: `0 24px 60px rgb(14 14 44/.16)`

**Radius**
- `--radius` is 0.625rem.
- Tailwind `rounded-2xl` in this project is about 18px (radius × 1.8). `rounded-xl` is about 14px. `rounded-3xl` is about 22px.

**Base styles**
- Body: `bg-white`, Inter, `leading-relaxed`, grey-700.
- h1–h4: Sora (`font-heading`), `leading-[1.1]`, `tracking-[-0.02em]`, ink.
- Smooth scroll is on. `:target` gets `scroll-margin-top: 7rem`.

**Utilities**
- `wrap`: max-width 1240px, 24px side padding.
- `eyebrow`: Sora, 12px, bold, tracking 0.14em, uppercase, green-600.
- `eyebrow-on-ink`: same, but in green.
- `brand-glow`: absolutely positioned circle with `radial-gradient(rgb(132 194 36/.3), transparent 65%)`.
- `reveal`: when JS is ready, fades up (opacity 0 → 1, translateY 24px, 0.7s ease).
- Ken Burns keyframe: scale 1 → 1.03 with translateY -0.5%.

**Fonts** (`src/app/(site)/layout.tsx:14-32`)
- Inter is the sans (`--font-sans`), variable weight.
- Sora is the display face (`--font-display`), weights 400/500/600/700/800.
- Geist Mono is loaded for mono text.
- `lang="en-GB"`.
- `revalidate=300` (line 38).

**Layout order** (layout.tsx:88-106): ConsentProvider → skip link to `#main` → SiteHeader → `<main id="main">` → SiteFooter → AnnouncementModal (if one is active) → RevealProvider → Toaster.

**Metadata**
- Title template: `"Elevation Church Manchester | %s"`.
- Default title: `"Elevation Church Manchester | Making Greatness Common"`.
- Description: "A Spirit-filled church family in Manchester on one mission: making greatness common. Join us Sundays at 10:30am, Mary Seacole Building, University of Salford."
- OG locale `en_GB`.
- OG/Twitter images are the static `src/app/opengraph-image.png` and `twitter-image.png`. Favicons are `src/app/icon.png` and `apple-icon.png`.

**Shared section primitives** (`src/components/section.tsx`)
- **`Section`**: `py-16 sm:py-24`, `scroll-mt-28`.
  - Tones: `default` (white), `grey` (`bg-grey-50`), `ink` (`bg-ink`, white text, plus a glow at the bottom-left: -200px/-120px, 500px, opacity 60).
  - Content sits inside `wrap`.
- **`SectionHeading`**: `mb-13`, max-width 620px.
  - Order: eyebrow, then h2 at `clamp(30px,4vw,46px)` bold with `mt-3.5 mb-3.5`, then lead at `text-lg` (grey-500, or white/60 on ink).
  - Props: `align` = left | center; `tone` = default | onInk.
- **`PageHero`**: `bg-ink`, `pt-[70px] pb-15` (60px).
  - Glow at the top-right: -200px/-100px, 500px.
  - h1 is `clamp(34px,5vw,54px)`, extrabold.
  - Lead is `text-lg`, white/66, max-width 560px.
  - Every interior page uses it; I call it the "Dark PageHero" below.

**UI primitives used on pages**
- **shadcn `Card`**: `rounded-xl`, `ring-1 ring-foreground/10`, 16px vertical padding. `CardContent` adds 16px horizontal padding. It is small and flat, and differs from the bespoke `rounded-2xl` cards elsewhere.
- **`Badge secondary`**: pill (`rounded-4xl`), `bg-secondary` (a very light lavender-grey), 12px text.
- **`Accordion`**: Base UI; items separated by `border-b`; chevron down/up icons.

---

## 1. Pages, top to bottom

### Home — `page.tsx` (301 lines)

**1. Hero** (lines 137-190)
- Full-bleed `section`, `bg-ink`, `min-h-dvh`.
- It uses `-mt-[76px] sm:-mt-[88px]` so it sits under the sticky header.
- Background is `HeroSlideshow` (images from settings `hero`), plus a `brand-glow` at the top-right (-160/-120, 600px, blur 20px).
- Content column is max-width 760px, top padding `calc(76px+3.5rem)` (sm: `calc(88px+4rem)`), `pb-14`.
- h1, `clamp(42px,6vw,76px)` extrabold white: "Making greatness **common.**" (the word "common." is in green).
- Paragraph at `clamp(17px,2vw,20px)`, white/82, max-width 560px: "We're a Spirit-filled family in the heart of Manchester on one mission. Wherever you're coming from, there's a place for you here."
- CTAs (both large):
  - "Plan your visit →" → `/im-new` (green)
  - "▶ Watch online" → `/watch` (ghostOnDark)
- Info list:
  - Clock icon: "Sundays 10:30am". Subline: "Doors from {doorsOpen}", or "Come a little early for a coffee" when doorsOpen is null.
  - Map pin: "Mary Seacole Building". Subline: "University of Salford · M6 6PU".
  - Label is Sora 15px bold white; subline is 13.5px white/65.

**2. "I'm new"** — `Section`, white, `id="imnew"` (lines 193-259)
- `SectionHeading`, centred:
  - Eyebrow "First time?"
  - Title "We'd love to meet you"
  - Lead "Coming to a new church can feel like a big step. Here's everything you need to feel at home before you even arrive."
- Three-column cards (`md:grid-cols-3`). Card spec:
  - White, `rounded-2xl`, `border-grey-100`.
  - Hover: lift 6px (`-translate-y-1.5`) and `shadow-card-lg`.
  - 4:3 image on a `bg-green-100` fallback, with an ink/35 gradient from the bottom.
  - 56px green icon badge, `rounded-2xl`, `shadow-card`, overhanging the image's bottom-left (`left-6`, `translate-y-1/2`).
  - Body is `p-6 pt-12`. h3 21px bold; body 15px grey-500.
  - CTA is Sora 14px semibold green-600 with an arrow; the gap widens on hover.
- Card contents:
  - "What to expect" — "Passionate worship, a practical message from the Bible, and a genuinely warm welcome. Come as you are — nobody is checking what you're wearing." CTA "Learn more" → `/im-new#what-to-expect`. Image `/im-new/what-to-expect.jpg`.
  - "Times & location" — "Sundays at 10:30am in the Mary Seacole Building on the University of Salford campus. We'll help you find your way in." CTA "Get directions" → `/im-new#find-us`. Image `/im-new/times-and-location.jpg`.
  - "Kids & teens" — "The Seeds runs every Sunday for children, including a baby class, and 412 Nation is for teenagers. They're in good hands." CTA "See their spaces" → `/im-new#kids`. Image `/im-new/kids-and-teens.jpg`.
- Centred button: "Plan my visit — everything you need to know" → `/im-new` (navy, large).

**3. `HomeWatchSection`** (grey) — see §2.

**4. `HomeEventsSection`** (white) — see §2.

**5. "Get involved"** — `Section tone="ink"`, `id="involve"` (lines 272-297)
- Heading, onInk:
  - Eyebrow "Community"
  - Title "Don't do life alone"
  - Lead "Church is more than a Sunday. Find your people, use your gifts, and grow."
- Four-column cards (`sm:2`, `lg:4`). Card spec:
  - `rounded-2xl`, `border-white/10`, `bg-white/4`, `p-7`.
  - Hover: `bg-white/8`, `border-green/40`, lift.
  - Icon tile 50px, radius 13px, `bg-green/16`, green icon.
  - h3 19px bold white; body 14px white/60.
- Card contents:
  - "Connect Groups" → `/get-involved#connect-groups`: "Small groups across Manchester. Big enough to receive you, small enough to know you."
  - "Serve on the G-Squad" → `#serve`: "Worship, welcome, kids, tech, production — more than forty teams to join."
  - "The Seeds & 412 Nation" → `#kids-and-teens`: "Safe, joyful spaces for children and teenagers, every single Sunday."
  - "Next steps" → `#next-steps`: "The Growth Track — from your first Sunday to living out your purpose."
- Watch and events sections have Suspense skeletons: grey-100 pulse blocks.

### I'm New — `im-new/page.tsx`
Meta description: "Planning your first visit … what to expect on a Sunday, where to park, and what happens with your kids."

1. **Dark PageHero**
   - Eyebrow "Plan a visit"
   - Title "Your first Sunday, made simple"
   - Lead "Walking into a new church can feel like a lot. Here's everything you need so that it doesn't."
2. **White section**
   - Heading: eyebrow "What to expect", title "The honest answers to the questions everyone asks".
   - Three-column grid (md: 2, lg: 3) of shadcn Cards. Each has a green-600 icon, an 18px semibold h3 and 14px grey-500 body. Five cards:
     - "When should I arrive?" — "We start at 10:30am. Come a little early if you'd like to say hello, and stay afterwards for coffee — we'd genuinely love to meet you." (If doorsOpen is set, it starts "Doors open at X and we start at …".)
     - "What should I wear?" — "…suits and … trainers — nobody is checking."
     - "What actually happens?" — worship, a Bible message and prayer; "Spirit-filled, warm and jargon-light".
     - "What about my children?" — The Seeds and 412 Nation.
     - "Where do I park?" — "We meet in the Mary Seacole Building… Our Protocol team will point you in the right direction."
3. **Grey section**, two columns
   - Left: heading with eyebrow "Find us", title "Where we meet", lead "We gather every Sunday at 10:30am in the Mary Seacole Building on the University of Salford campus."
   - Address block, then buttons "Open in Google Maps" (navy, external `mapsUrl`) and "Ask us a question" → `/contact` (ghost).
   - Right: map iframe inside `EmbedGate` ("Find us on the map"), 4:3, `rounded-xl` with border.
4. **White section**
   - Heading: eyebrow "For your family", title "Kids and teens are looked after", lead "They get their own space, their own team and their own thing going on — while you get to be present in the service."
   - Three cards from `kidsAndYouth`: name as h3 (Sora 20px), `forWho` as an eyebrow, then body.
5. **Ink CTA band**
   - Title "Still have a question?"
   - Lead "Send it over before you come. No question is too small."
   - Button "Get in touch" → `/contact` (green).

**No section on this page has an id.** The anchors `#what-to-expect`, `#find-us` and `#kids`, linked from the home cards and the footer, do not exist; I confirmed this with grep.

### About — `about/page.tsx`
1. **Dark PageHero**
   - Eyebrow "About us"
   - Title "A church family with one mandate"
   - Lead is `church.mission`.
2. **`#our-story`**, white, two columns (`1fr_1.2fr`)
   - Heading: eyebrow "Our story", title "How we got here".
   - Three paragraphs, `text-lg` grey-500:
     - The church began in Lagos on 10 October 2010 ("10.10.10"), founded by Pastor Godman Akinlabi and inaugurated with Rev. Sam Adeyemi.
     - It became a global family of **"expressions"** across Nigeria, the UK, Europe and the US.
     - "TEC Manchester launched on 1 May 2023, led by Pastor Tosin Babalola…"
3. **`#vision-values`**, grey
   - Heading: eyebrow "Vision & values", title "What we're built on".
   - Lead: `Everything we do traces back to one line of scripture: "He who is greatest among you shall be your servant." — Matthew 23:11.`
   - Values grid (sm: 2, lg: 3) of Cards: a green-600 letter (Sora 36px) plus the value name at 18px. The ASHLIE values are Accountability, Service, Humility, Love, Integrity, Excellence.
   - Then eyebrow "Our personality" and a row of secondary badges: Humble, Simple, Youthful, Audacious, Intelligent, Compassionate, Friendly.
4. **`#leadership`**, white
   - Heading: eyebrow "Leadership", title "The people who serve this house".
   - `LeadershipGrid`.
5. **Ink CTA band**
   - Title "What we believe"
   - Lead "The convictions underneath everything above — set out plainly, with the scripture behind each one."
   - Button "Read our statement of faith →" → `/about/what-we-believe` (green).

### What We Believe — `about/what-we-believe/page.tsx`
1. **Dark PageHero**
   - Eyebrow "Statement of faith"
   - Title "What we believe"
   - Lead "We're a Pentecostal church — Bible-centred and Spirit-filled. Here's what that actually means, in plain English."
2. **White section**, max-width 3xl
   - Accordion with **all items open by default**.
   - Seven beliefs from `church.ts:148-184`. Title is 18px semibold; body is grey-500; the scripture reference is 14px green-600 medium.
3. **Grey section**
   - Heading: eyebrow "Your next steps", title "The Growth Track", lead "Believing is the beginning. This is the path we walk together from there."
   - Two-column ordered list. Each item has a 4px green-600 left border and `pl-6`, then: step number (Sora 24px green-600), 20px h3, body, and the scripture in 14px grey-500/70.
4. **Ink CTA band**
   - Title "Questions are welcome here"
   - Lead "If something above raised a question rather than answered one, that's a good sign. Come and ask."
   - Buttons "Plan a visit" → `/im-new` (green) and "Contact us" → `/contact` (ghostOnDark).

### Watch — `watch/page.tsx` (revalidate 60)
1. **Dark PageHero**
   - Eyebrow "Messages"
   - When live: title "We're live right now", lead "Join the service from wherever you are."
   - Otherwise: title "Watch & grow", lead "Catch this week's message or dig into the archive. Live every Sunday at 10:30am."
2. **Conditional, white**
   - If a stream is live: `LivePlayer`.
   - Otherwise, if one is scheduled: `UpcomingStream`.
3. **Messages section** — grey if section 2 rendered, otherwise white
   - With videos: heading (eyebrow "Catch up", title "Recent messages", lead "Straight from our YouTube channel — this list updates itself."), then a 3-column `VideoCard` grid (sm: 2, gap 26px) of 12 past messages, then button "See everything on YouTube" (ghost, external `CHANNEL_URL`).
   - Fallback panel: white, `rounded-2xl`, `p-12`, centred MonitorPlay icon, h2 "Every message, on our channel".
     - Text when the API key is set but the fetch failed: "We couldn't load the archive just now. It's all on YouTube in the meantime."
     - Text when there is no key: "Full services and recent messages are on YouTube. Subscribe and you'll know the moment a new one lands."
     - Button "Watch on YouTube" (green, large).
4. **Ink CTA band**
   - Title "Better in the room"
   - Lead "Online is good. In person is better. Sundays at 10:30am, {location.full}."
   - Button "Plan a visit" → `/im-new` (green, large).

`CHANNEL_URL` is `https://www.youtube.com/@TheElevationChurchManchester` (`src/lib/youtube.ts:21-22`). It is a YouTube Data API integration (`YOUTUBE_API_KEY`) that reads the uploads playlist and classifies each video as live, upcoming or none.

### Events index — `events/page.tsx` (revalidate 300)
1. **Dark PageHero**
   - Eyebrow "What's on"
   - Title "Events & gatherings"
   - Lead "There's always something happening. Find your next step, from Sunday gatherings to city-wide conferences."
2. **White section**
   - **Sunday Gathering strip** (`mb-14`): `bg-green-100`, `border-green/40`, `rounded-2xl`, `p-7`.
     - Eyebrow "Every week", h2 "Sunday Gathering" (Sora 24px bold).
     - Clock line "Sundays at 10:30am" and map-pin line `location.full`.
     - Button "Plan your visit" → `/im-new` (navy).
   - **Two-column layout** (`lg:grid-cols-[1fr_340px]`)
     - Left: heading (eyebrow "Coming up", title "Upcoming events"), then a two-column `EventCard` grid of up to 24 events.
     - Left, when there are no events: white bordered panel with a CalendarDays icon, h3 "Nothing else in the diary just yet", text "Our Sunday gathering runs every week. Everything else gets announced on Instagram first.", and buttons "Follow on Instagram" (green, external) and "Ask what's coming up" → `/contact` (ghost).
     - Right: sticky aside (`lg:top-28`) holding `EventCalendar` with every event, past and future. It opens on the month of the next event. Caption below (12px): "Dates with a marker have something on. Tap one to see what."

### Event detail — `events/[slug]/page.tsx`
1. **Custom dark hero**
   - `bg-ink`, `py-16 sm:py-20`.
   - If the event has `image_url`, it is used as the background at `opacity-40` with an ink gradient from the bottom. A glow sits top-right.
   - Link "← All events" → `/events` (14px, white/70).
   - h1 `clamp(32px,5vw,52px)` extrabold; `summary` below it at 18px white/75.
   - Meta row with green icons:
     - Date: the range if the event is multi-day, otherwise a full date such as "Sunday 5 October 2026".
     - Time: from `formatEventTime`.
     - Venue: `event.venue`, or `location.full` if none is set.
   - If `cta_url` is set: a large green button labelled `cta_label`, or "Register" if no label. It is external when the URL starts with `http`.
2. **White section**, two columns (`1fr_320px`)
   - Main: `description` split on blank lines into 18px paragraphs. When empty: "More details coming soon. In the meantime, just turn up — you're very welcome."
   - Aside: bordered `rounded-2xl`, `p-6` box. h2 "Getting there"; the venue split on commas into lines; full-width ghost buttons "Get directions" (the settings `mapsUrl`) and "Ask a question" → `/contact`.
3. **Grey section**, only if other events exist
   - Heading: eyebrow "Also coming up", title "More events".
   - Up to three EventCards.

Metadata: title is the event title, description is `summary`, canonical is `/events/{slug}`, OG image is `image_url`.

### Get Involved — `get-involved/page.tsx`
1. **Dark PageHero**
   - Eyebrow "Belong here"
   - Title "Get involved"
   - Lead "Sunday is the front door, not the whole house. This is where church stops being an event and starts being a family."
2. **`#connect-groups`**, white, two columns
   - Heading: eyebrow "Connect Groups", title "Big enough to receive you, small enough to know you".
   - Lead: small groups by area, season or interest ("families, young couples, professionals, fitness and more").
   - Button "Find a group" → `/contact` (navy).
   - Right: Card with `bg-green-100` and `border-green/40`, Users icon, h3 "What actually happens", four bullets:
     - "Food, usually. Always conversation."
     - Working through Sunday's teaching.
     - "Praying for each other by name."
     - "Showing up when life gets hard…"
3. **`#serve`**, grey
   - Heading: eyebrow "G-Squad", title "Serve on the Greatness Squad", lead "…more than forty units to serve on…".
   - Badge cloud of the 20 `serveTeams`.
   - Button "Join the G-Squad" → `/contact` (navy).
4. **`#kids-and-teens`**, white
   - Heading: eyebrow "Kids & teens", title "Where the next generation belongs".
   - Three `kidsAndYouth` cards.
5. **`#support`**, grey
   - Heading: eyebrow "Support", title "When you need more than a Sunday", lead "These are here for anyone — you don't have to be a member, and you don't have to explain yourself first."
   - Two-column cards with a HeartHandshake icon, one per `supportMinistries` entry.
6. **`#next-steps`**, white
   - Heading: title "The Growth Track", lead "Not sure where to start? Start at the top and work down."
   - Same two-column list as on What We Believe.
7. **Ink CTA band**
   - Title "Not sure where you'd fit?"
   - Lead "Tell us a bit about yourself and we'll point you somewhere sensible."
   - Button "Talk to us" → `/contact` (green).

### Give — `give/page.tsx`
1. **Dark PageHero**
   - Eyebrow "Generosity"
   - Title "Give"
   - Lead "Your generosity fuels the mission in Manchester — Sunday gatherings, our children's and teens' work, and practical care for people who need it."
2. **White section**
   - Three-column grid:
     - **"Give online" card** (spans two columns, `border-green/50`, `shadow-md`): HandCoins icon; text "card, PayPal balance, Apple Pay or Google Pay… one-off … or recurring"; button "Give securely now" (green, external PayPal URL); note "You'll be taken to PayPal's secure donation page. A PayPal account isn't required to give by card."
     - **"Gift Aid" card** (`bg-ink`, white text): ShieldCheck icon; "adds **25%** … every £10 becomes £12.50"; "The Elevation Church UK is a registered charity in England and Wales, no. 1195403."; button "Make your declaration" → `#gift-aid` (green).
   - Separator (`my-14`).
   - Heading: eyebrow "Other ways", title "Prefer not to give online?", lead "Both of these work just as well, and Gift Aid still applies."
   - Two cards:
     - **Bank transfer**: a list of Account name, Account number (mono) and Sort code (mono). Note: "These details are also shown on screen on a Sunday. If anything you see elsewhere differs from this, please check with us in person before sending money."
     - **Cheque**: "Make cheques payable to:" followed by the payee in bold, then "Hand it to a member of the team on a Sunday…"
3. **`#gift-aid`**, grey, max-width 3xl
   - Centred heading: eyebrow "Gift Aid", title "Add 25% to your giving, at no cost to you", lead "…reclaim 25p for every £1 … You only need to do this once; it covers your future giving and the past four years."
   - `GiftAidForm` in a white `rounded-2xl` box with `shadow-card`, `p-6 sm:p-10`.
   - Footnote: "We store your declaration securely… HMRC requires us to keep it for as long as you give, and for six years afterwards."
4. **White section**, centred
   - h2 "Thank you"
   - Text: "Every gift, of every size, goes towards making greatness common in this city…"
   - Button "Ask about giving" → `/contact` (ghost).

### Prayer — `prayer/page.tsx`
1. **Dark PageHero**
   - Eyebrow "Prayer"
   - Title "Let us pray with you"
   - Lead "Whatever you're carrying, you don't have to carry it on your own. Tell us and our team will pray."
2. **White section**, two columns (`1.4fr_1fr`)
   - Left: `PrayerForm`.
   - Right: three `rounded-xl`, `p-6` boxes:
     - "Who sees this?" (`bg-grey-50`): pastoral team only; never published; not shared unless the visitor ticks the box.
     - "Need to talk to someone?" (`bg-grey-50`): free confidential counselling and Family Life; "Email info@elevationmanchester.org and we'll arrange it."
     - "If it's an emergency" (`border-destructive/30`, `bg-destructive/5`): "…not monitored around the clock… call **999**… urgent mental health support, call **111**, or Samaritans free on **116 123**, any time."

### Contact — `contact/page.tsx`
1. **Dark PageHero**
   - Eyebrow "Say hello"
   - Title "Get in touch"
   - Lead "Questions about visiting, joining a Connect Group, serving, or anything else — this reaches a real person."
2. **White section**, two columns (`1.4fr_1fr`)
   - Left: `ContactForm`.
   - Right: an aside with green-600 icons and 18px Sora headings:
     - "Where we meet": address, plus "Get directions" link (new tab).
     - "Sunday service": "Sundays at 10:30am".
     - "Email": mailto link.
     - "Phone": tel link.
     - "Follow us": list of the social name in ink plus the handle.
3. **Full-width map** (`border-t`): `EmbedGate` map, 420px high.

### Privacy — `privacy/page.tsx` (338 lines)
- **Dark PageHero**
  - Eyebrow "Legal"
  - Title "Privacy notice"
  - Lead "What we collect, why we collect it, how long we keep it, and what you can ask us to do about it."
- Single white section, max-width 760px. Opens with "Last updated 2 August 2026." (`LAST_UPDATED`, line 22).
- h2s are Sora 24px bold with `mt-12`. Section ids, in order:
  - `#who-we-are`: controller, charity number, venue.
  - `#what-we-collect`: h3s for contact, prayer (special category data, explicit consent, separate prayer inbox), Gift Aid (legal obligation, HMRC), mailing list (consent), admin accounts.
  - `#how-long`: retention per data type.
  - `#who-we-share-with`: Supabase (EU, Frankfurt), Vercel, Resend, Google, HMRC.
  - `#cookies`: no cookies of its own; localStorage holds the consent choice and dismissed announcements; admin login cookie; embeds are click-gated. The `ConsentControls` widget is embedded here.
  - `#your-rights`: response within one month.
  - `#complaints`: ICO link `https://ico.org.uk/make-a-complaint/` and phone 0303 123 1113.
  - `#changes`.
- Footer line: "Looking for something else? Get in touch" → `/contact`.

### `[slug]` — CMS pages (`[slug]/page.tsx`)
- Reads `pages` (slug, title, description) and `blocks` (type and `published` JSON, ordered by `sort`) from Supabase, then renders them with `BlockRenderer`.
- Slugs in `RESERVED_SLUGS` return 404 (`src/lib/blocks.ts:121-127`).
- A missing slug is looked up in the `redirects` table (`from_slug` → `to_slug`); otherwise it returns 404.

---

## 2. Shared components (`src/components`)

### site-header.tsx
**Structure**
- Client component. The header is `sticky top-0 z-100 border-b`, 76px tall (sm: 88px), inside `wrap`.
- Left: `Logo` linking to `/` with `aria-label="Elevation Church Manchester — home"`.
- Desktop nav (`lg+`): links are Sora 14.5px medium, `px-3.5 py-2.5`, `rounded-[9px]`, `gap-1.5`.
- Right side (`lg+`): "Plan a Visit" → `/im-new` (ghost; ghostOnDark over the hero) and "Give" → `/give` (green).
- Hamburger below `lg`.

**States**
- The page counts as scrolled when `scrollY > 80`.
- On the home page, before scrolling (the "overHero" state):
  - The header is transparent. Links are white/85, with `hover:bg-white/10`; the active link is green.
  - The white and ink logo variants are stacked and crossfade over 300ms.
- Otherwise:
  - The header is `bg-white/92` with `backdrop-blur-xl` and `border-grey-100`. Links are ink with `hover:bg-grey-50 hover:text-green-600`; the active link is green-600.
- Once scrolled, it adds the shadow `0 6px 24px rgb(14 14 44/.07)`.
- A link is active when the pathname starts with its href.

**Mobile menu**
- Full-screen `bg-ink` panel at `z-200`, `p-7`. It slides in from the right over 350ms with `cubic-bezier(.4,0,.2,1)`, and is `inert` when closed.
- Top row: white logo and an X button.
- Links are Sora 26px semibold white, `py-3.5`, with a `border-b border-white/10` divider.
- Bottom: "Sundays at 10:30am" (14px white/60), then full-width large buttons "Plan a Visit" (ghostOnDark) and "Give" (green).
- Opening it locks body scroll. Escape closes it, as does clicking any link.
- **About's `children` sub-items are never rendered.** There is no dropdown in either the desktop or mobile menu.

### site-footer.tsx
**Container**
- `bg-ink-800`, `pt-16 pb-8`, text white/60.
- Grid: `md:2`, `lg:[1.6fr_1fr_1fr_1fr]`, `mb-11`.

**Column 1**
- White logo.
- Mission text, 14.5px, max-width 280px.
- Social icons: 40px squares, radius 11px, `bg-white/6`, hover `bg-green` with ink text, 18px SVG icons for YouTube, Instagram, Facebook and X. `aria-label` is "TEC Manchester on {name}".

**Link columns**
- Headings are Sora 14px, uppercase, tracking 0.1em, white.
- Links are 14.5px with `mb-[11px]` and `hover:text-green`.

**Practical strip**
- `rounded-[14px]`, `bg-white/4`, `px-6 py-5`.
- Items: "Sundays 10:30am" (clock), "Mary Seacole Building, University of Salford, M6 6PU" (pin), email, phone.

**Bottom bar**
- `border-t border-white/8`, 13px.
- "© {year} Elevation Church Manchester. An expression of The Elevation Church."
- "Privacy & cookies" → `/privacy`, then "·", then "The Elevation Church UK · registered charity no. 1195403".

### btn.tsx (`Btn` / `BtnLink`) — the site button
- **Base**: pill (`rounded-full`), Sora semibold, `gap-2`. Hover lifts 2px under `motion-safe`. Focus shows a 2px green-600 outline with offset 2.
- **Variants**:
  - `green`: `bg-green`, ink text, hover `bg-green-600`.
  - `navy`: `bg-ink`, white text, hover `#20204a`.
  - `ghost`: 1.5px `grey-300` border, ink text, hover border ink.
  - `ghostOnDark`: 1.5px `white/35` border, white text, hover border white.
- **Sizes**:
  - `default`: 24px × 13px padding, 15px text.
  - `lg`: 30px × 16px padding, 16px text.
- **`block`**: full width.
- `external` renders `<a target=_blank rel=noreferrer>`.
- `button-link.tsx` (`ButtonLink`) wraps the shadcn Button. It is legacy and not used on the public pages.

### hero-slideshow.tsx
**Timing**
- `SLIDE_MS = 6500`, `FADE_MS = 1200`, crossfading between absolutely positioned layers.
- The active slide gets `kenburns 9s ease-out forwards`.
- Auto-advance does not run when there are fewer than two slides, when `prefers-reduced-motion` is set (the fade also becomes 0ms), or when the tab is hidden (`visibilitychange`).
- There are no controls or dots.

**Images**
- Next/Image `fill` with `object-cover`, quality 90.
- The first slide has `priority`; the first two load eagerly.
- Each slide's `focal` object-position class keeps the subject in frame.

**Scrims**
- A left-to-right wash: `from-ink/45 via-ink/10` when the slide is `preTreated`, otherwise `from-ink/95 via-ink/70`.
- A bottom-up ink wash: opacity 90 on mobile, 55 from `sm`.
- A top wash for nav legibility: `from-ink/80`, 160px tall.

**No slides**: a radial gradient fallback (`#26265c` / `#1a1a3f`).

### event-card.tsx
- Card: `rounded-2xl`, `border-grey-100`, white, hover lift and `shadow-card-lg`. The whole card links to `/events/{slug}`.
- Image area: 16:9 on `bg-ink`. The image scales to 105% on hover. Without an image, a radial `#2a2a5e` gradient. An ink/50 gradient runs from the bottom.
- **Date chip** at the top-left (14px inset): white, radius 11px, `shadow-card`. Day number is Sora 20px extrabold ink; month is 11px bold uppercase green-600.
- Body (`p-5.5`, 22px):
  - h3 20px bold, turning green-600 on hover.
  - Summary, 14px, clamped to two lines.
  - Clock line with the time, or a calendar line with the date range for multi-day events.
  - Pin line with `venue`, or `location.venue` if none is set.

### event-calendar.tsx
- Client component. White `rounded-2xl` card, `p-6`, `shadow-card`.
- Header: month title (Sora 18px bold, e.g. "October 2026") with 32px round prev/next buttons.
- Grid: seven columns, Monday first, weekday letters "M T W T F S S".
- Day cells:
  - A day with events is a button: `bg-green-100`, `rounded-lg`, a 4px dot at the bottom, hover `bg-green`.
  - The selected day is `bg-ink` with white text.
  - Other days are plain grey-500 text.
- Clicking a day toggles a list under a `border-t`: title (Sora semibold) and time, linking to the event.
- Changing month clears the selection.
- Date keys are YYYY-MM-DD strings computed on the server in Europe/London time.

### home-events-section.tsx
- White Section.
- Header row: eyebrow "What's on", h2 "This week at Elevation" (`clamp(30px,4vw,46px)`), and button "View all →" → `/events` (ghost).
- **With events**: a three-column grid of up to three EventCards, then a strip (`bg-green-100`, `border-green/40`, `rounded-2xl`, `p-6`): eyebrow "Every week", h3 "Sunday Gathering · 10:30am", `location.full`, button "Plan your visit" (navy).
- **Without events**:
  - A card spanning two columns with an ink → ink-800 gradient and a glow: eyebrow "Every week", h3 "Sunday Gathering" (26px), time and "Mary Seacole Building, M6 6PU", button "Plan your visit" (green).
  - A white card with a 54px `green-100` Sparkles tile: "More coming soon" / "Conferences, socials and midweek gatherings get announced on Instagram first." and button "Follow along" (ghost, Instagram).

### home-watch-section.tsx
- Grey Section, two columns (`1.3fr_1fr`).
- **Left**: a 16:9 link tile (`bg-ink-800`, `rounded-2xl`, `shadow-card-lg`) showing the thumbnail with an ink gradient.
  - Top-left: `LiveBadge`, or a chip "Latest message" / "Every message, on YouTube" (`bg-ink/70`, blurred, 12px).
  - Centre: an 82px white/92 play button that turns green and scales to 108% on hover.
- **Right**:
  - Eyebrow "On air now" or "Messages".
  - h2 at 34px: the video title, or "Missed a Sunday?" when there is no video.
  - Copy when not live: "Full services and recent messages go up on our YouTube channel. Subscribe and you'll know the moment a new one lands." When live: "We're streaming right now — join us from wherever you are."
  - Buttons "Watch live" / "Watch now" (green, external) and "All messages" → `/watch` (ghost).

### live-player.tsx
- **`LiveBadge`**: pill `#D64545`, 12px bold uppercase white, with a pinging white dot. Label "Live now".
- **`LivePlayer`**: two columns. A 16:9 `youtube-nocookie` iframe inside `EmbedGate kind="video"`, then the badge, a 34px title and "We're streaming right now — come and join us." Buttons "Watch on YouTube" (green) and "Join us in person" → `/im-new` (ghost).
- **`UpcomingStream`**: `green-100` strip. Eyebrow "Next stream", title, and a London-time date such as "Sunday 5 October, 10:30". Button "Set a reminder" (navy, links to the YouTube URL).

### video-card.tsx
- 16:9 thumbnail, radius 14px, `shadow-card`; lifts 4px on hover.
- Centred 56px white/90 play circle that turns green on hover.
- Duration chip at the bottom-right (`bg-ink/80`).
- h3 18px bold, then a date such as "5 Oct 2026" in 13.5px grey-500.
- Opens the YouTube URL in a new tab.

### leadership-grid.tsx
- Three-column list (sm: 2).
- Portrait: 4:5, `rounded-2xl`, `shadow-card`; the image scales to 105% on hover.
- A bottom 40% gradient (`ink/85` → transparent) holds the name (Sora 20px bold white) and role (12px bold uppercase, tracking 0.14em, green).
- The bio sits below the card at 15px grey-500.

### announcement-modal.tsx
- Base UI Dialog.
- Backdrop: `bg-ink/60` with `backdrop-blur-sm`, `z-300`.
- Panel: max-width 448px (`max-w-md`), `rounded-3xl`, white, `shadow-2xl`.
  - Optional 16:9 image on top.
  - `p-7`: title (Sora 24px bold), body (15px grey-500, `pre-line`).
  - Buttons: CTA (green `btn`, label `cta_label` or "Find out more"; clicking it also dismisses) and "Not now" (ghost).
- A fixed 40px round close button at the top-right (`bg-white/10`, blurred).
- The rules are in §5.

### embed-gate.tsx and consent-provider.tsx / consent-controls.tsx
**EmbedGate**
- A placeholder box: `bg-grey-100`, dashed `border-grey-300`, `rounded-xl`, `p-8`, centred.
- Contents: a 48px white/80 icon tile (map pin or play), the title (Sora bold), a green pill button "Show the map" / "Play the video", and a 12px note "Loads from Google Maps" / "Loads from YouTube".
- The button is disabled until the client is ready.
- Clicking it loads only that one embed and does not change the site-wide setting.
- If the site-wide consent is "granted", the embed renders immediately.

**Consent storage**
- localStorage key `ecm.consent.embeds`, value `"granted"` or `"declined"`.
- Changes fire a custom `ecm:consent-changed` event and sync across tabs through the `storage` event.
- **There is no cookie banner, by design.**

**ConsentControls** (privacy page only)
- Status text, then buttons "Allow maps & videos", "Keep them off" and "Clear my choice".

### reveal.tsx
- An IntersectionObserver (`rootMargin` "0px 0px -10% 0px", threshold 0.05) adds `is-visible` to `.reveal` elements.
- It sets `data-reveal-ready` on `<html>` first.
- A MutationObserver picks up content added by client-side navigation.
- It is skipped entirely under reduced motion.

### logo.tsx
- Next/Image, 44px tall (sm: 52px), `w-auto`.
- `tone="white"` uses `/brand/logo-white.png`; `"ink"` uses `/brand/logo-colour.png`. `logo-navy.png` is unused.
- The artwork is 938×307.
- A typographic fallback exists but is unused, because `hasLogoFiles` is true.

### social-icons.tsx
- Inline SVG brand marks for YouTube, Instagram, Facebook and X, with `fill="currentColor"`.

### block-renderer.tsx (CMS block types, `src/lib/blocks.ts:18-119`)
| Block | Renders as |
|---|---|
| `page-hero` | `PageHero` with eyebrow, title and lead |
| `rich-text` | Tiptap document in a white Section, max-width 3xl |
| `image` | 16:9 `rounded-2xl` figure, max-width 4xl, with optional caption; section `py-8/12` |
| `date-card` | White `rounded-3xl` card with `shadow-card`: an ink tile with a Sora 48px green day and uppercase month, then title, weekday, time and place |
| `icon-cards` | Up to four white `rounded-2xl` `p-7` cards with title and body, three columns |
| `accordion` | Accordion of items with title and body |
| `cta-band` | Ink Section with title, lead and up to two buttons (green or ghostOnDark) |
| `stats` | Up to four big Sora numbers with labels, top and bottom borders |
| `event-list` | Upcoming EventCards, limit 1–6 |
| `youtube-latest` | `HomeWatchSection` |
| `form` | contact / prayer / newsletter (inside an ink `rounded-3xl` box) / giftaid |

---

## 3. Settings and content model

### Live override mechanism
- `src/lib/settings.ts:79-129` reads the `site_settings` table (key → jsonb) and merges it, group by group, over the defaults in `church.ts`.
- Overridable keys: `church`, `service`, `location`, `contact`, `socials`, `giving`, `hero`.
- If the database is unavailable, the defaults are used.
- `location.full`, `mapsUrl` and `embedUrl` are computed (lines 57-69).

### Defaults (`src/lib/church.ts`)

**church** (lines 8-24)
| Field | Value |
|---|---|
| name | "Elevation Church Manchester" |
| legalName | "The Elevation Church UK" |
| shortName | "TEC Manchester" |
| tagline | "Making Greatness Common" |
| mission | "To empower you to achieve the highest level of distinction and greatness in life, serving God and humanity with passion." |
| bedrockScripture | "Matthew 23:11" — "He who is greatest among you shall be your servant." |
| launched | "1 May 2023" |
| charityNumber | "1195403" |
| registeredOffice | "Crown House, 27 Old Gloucester Street, London WC1N 3AX" (not in the settings model and not rendered) |

**service** (lines 26-38)
- day "Sunday"
- startTime "10:30am"
- doorsOpen `null`
- There is deliberately no end time.

**location** (lines 40-60)
- venue "Mary Seacole Building"
- campus "University of Salford"
- city "Manchester"
- postcode "M6 6PU"
- country "United Kingdom"
- mapsQuery "Mary Seacole Building, University of Salford, M6 6PU"
- full: "Mary Seacole Building, University of Salford, Manchester M6 6PU"
- mapsUrl: `https://www.google.com/maps/search/?api=1&query=…`
- embedUrl: `https://www.google.com/maps?q=…&output=embed`

**contact** (lines 63-71)
- email "info@elevationmanchester.org"
- phone label "07469 062220", tel "+447469062220"

**socials** (lines 80-101)
| Name | Handle | URL |
|---|---|---|
| YouTube | @TheElevationChurchManchester | https://www.youtube.com/@TheElevationChurchManchester |
| Instagram | @elevationmanchester | https://www.instagram.com/elevationmanchester/ |
| Facebook | @elevationmanchester | https://www.facebook.com/elevationmanchester |
| X | @elevationmanche | https://x.com/elevationmanche |

**leadership** (lines 107-126). Hard-coded; not in the settings model.
- "Pastor Tosin Babalola" / "Resident Pastor, Manchester" / `/leadership/pastor-tosin-babalola.jpg`
  - Bio: "Pastor Tosin leads the Manchester expression of The Elevation Church, which launched on 1 May 2023."
- "Pastor Godman Akinlabi" / "Lead Pastor & Founder" / `/leadership/pastor-godman-akinlabi.jpg`
  - Bio: "…founded The Elevation Church in Lagos, Nigeria on 10 October 2010, and leads the global family of expressions alongside Pastor Bola Akinlabi."
- "Pastor Bola Akinlabi" / "Founding Pastor" / `/leadership/pastor-bola-akinlabi.jpg`
  - Bio: "Pastor Bola serves alongside Pastor Godman in leading The Elevation Church globally."

**Other hard-coded content**
- values (129-136): ASHLIE.
- personality (138-146).
- beliefs (148-184), each with title, body and scripture:
  1. One God, three persons (Deuteronomy 6:4)
  2. Jesus Christ (Matthew 1:18–25; John 14:6)
  3. The Bible (2 Timothy 3:16)
  4. Salvation (Romans 3:23; Romans 10:9; Ephesians 2:8)
  5. Death, resurrection and return (1 Corinthians 15:4; Acts 1:11; 1 Thessalonians 4:16–17)
  6. Baptism and the Lord's Supper (Matthew 28:19; Matthew 26:26–29)
  7. The Holy Spirit and healing (Mark 16:17–18; Acts 1:8; James 5:14–15; 1 Peter 2:24)
- growthTrack (187-212):
  - 01 Know God — "Begin a relationship with Jesus." (John 17:3)
  - 02 Find Freedom — "Take the Membership Class and join a Connect Group." (John 8:32–36)
  - 03 Discover Purpose — "Grow through TECi and Maturity School." (1 Peter 2:9; Ephesians 2:10)
  - 04 Make Greatness Common — "Serve on the G-Squad and step into leadership." (Matthew 23:11)
- kidsAndYouth (214-230):
  - The Seeds / "Children's Church, including a baby class"
  - 412 Nation / "Teens Church"
  - Surge / "Youth ministry" / "The Elevation Church's global youth ministry."
- serveTeams (233-254): Care, Family Life, Men of Honour, Missions, Worship, Ushering, Hospitality & Guest Management, Protocol & Traffic Management, The Jewels (women), Maturity, Surge (youth), 4One, Production, Multimedia, Setup & Sound, Media & Broadcasting, Membership, Communications, Prayer, The Seeds.
- supportMinistries (256-264):
  - Family Life: "Marriage, premarital and parenting counselling."
  - Counselling: "Confidential support when life is hard."
  - CareerPro: "Career counselling and professional guidance."
  - Care Unit: "Benevolence and practical support for those in need."

**giving** (266-276)
| Field | Value |
|---|---|
| paypalUrl | "https://www.paypal.com/donate/?hosted_button_id=L3ZEPY5K8QV6Y&source=qr" |
| bank.accountName | "The Elevation Church UK MAN" |
| bank.accountNumber | "49654219" |
| bank.sortCode | "23-05-80" |
| chequePayableTo | "The Elevation Church UK" |
| giftAidAvailable | true (not in the settings model) |

**heroSlides** (305-336). Every slide is `preTreated: true`.
| Image | Focal class | Alt text |
|---|---|---|
| `/hero/hero-worship.jpg` | `object-[62%_30%]` | "Members of the congregation worshipping together on a Sunday morning" |
| `/hero/hero-welcome.jpg` | `object-[64%_28%]` | "Two young members smiling and making a heart shape with their hands" |
| `/hero/hero-kids.jpg` | `object-[66%_32%]` | "Two children from The Seeds smiling together on a Sunday morning" |
| `/hero/hero-welcome-desk.jpg` | `object-[68%_28%]` | "Two members smiling outside the welcome entrance to our venue" |
| `/hero/hero-city.jpg` | `object-[70%_26%]` | "A member standing outside our venue on the University of Salford campus" |

**brand** (338-350)
- logo colour / white / navy: `/brand/logo-*.png`
- aspect 938×307

**siteUrl** (`src/lib/site.ts`): `NEXT_PUBLIC_SITE_URL`, falling back to "https://elevationmanchester.org".

---

## 4. Events model

### Table `public.events`
Defined in `supabase/migrations/20260725000000_initial_schema.sql`, with `time_tbc` added in `20260727000000_event_time_tbc.sql`.

| Field | Type |
|---|---|
| id | uuid |
| slug | text, unique, not null |
| title | text, not null |
| summary | text |
| description | text (plain; blank lines become paragraph breaks) |
| starts_at | timestamptz, not null |
| ends_at | timestamptz (check: ≥ starts_at) |
| venue | text |
| image_url | text |
| cta_label | text |
| cta_url | text |
| is_featured | bool, default false ("countdown treatment", **unused on the public site**) |
| is_published | bool, default false |
| time_tbc | bool, default false |
| created_at, updated_at | timestamps; `updated_at` maintained by trigger |

- RLS: select only where `is_published`.
- Index on `starts_at` where published.

### Functions in `src/lib/events.ts`
- **`getUpcomingEvents(limit)`** (21-40): `starts_at >= today at 00:00` in the server's timezone (UTC on Vercel), ascending. A multi-day event that started on an earlier day is dropped, even though the comment says otherwise.
- **`getAllEvents()`**: every published event, for the calendar.
- **`getEventBySlug()`**.
- **Past events**: there is no archive page. They only appear as calendar markers and remain reachable by URL.
- **Recurring events**: there is no recurrence model. The "Sunday Gathering" is a hard-coded strip on the home and events pages. The schema also has unused `sermons`, `sermon_series`, `connect_groups`, `visit_plans` and `group_join_requests` tables.

### Time formatting (all in Europe/London)
- `formatEventTime` (136-148):
  - `time_tbc` → "Time to be confirmed".
  - Otherwise "7:00 pm", or "7:00 pm – 9:30 pm" when the end is on the same day.
  - A multi-day event shows only the start time.
- `isMultiDay`: start and end fall on different days (day-month comparison).
- `formatEventDateRange`: "18 Oct – 20 Oct".
- `formatEventDate`: "Sunday 5 October 2026".
- `londonDateKey`: YYYY-MM-DD.

### Admin input (`src/lib/actions/admin-events.ts:60-100`)
- The form takes a date, a start time and an end time on **the same date**, so the admin cannot create multi-day events.
- TBC events are stored at 12:00 London time.
- The slug is generated by `slugify`: lowercase, `&` → "and", non-alphanumeric → "-", max 80 characters.
- The CTA URL must start with `https://` or `/`.

### URL and assets
- **Event URL**: `/events/{slug}`.
- Event images in `public/events/`: `greatness-community-summer-hangout.jpg`, `jewels-chill-and-cheer.jpg`, `men-of-honour-august.jpg`.

---

## 5. Announcements model

### Table `public.announcements` (`20260729030000_announcements.sql`)
| Field | Type / default |
|---|---|
| id | uuid |
| title | text, not null |
| body | text, not null |
| image_url | text |
| cta_label | text |
| cta_url | text |
| is_active | bool, default false |
| starts_at, ends_at | timestamptz, nullable; check: ends_at > starts_at |
| dismiss_hours | int, default 24, check 1–720 |
| created_by | uuid |
| created_at, updated_at | timestamps; `updated_at` maintained by trigger |

RLS: select where `is_active`.

### Selection (`src/lib/announcements.ts:8-26`)
- `is_active = true`, with `starts_at` null or ≤ now, and `ends_at` null or ≥ now.
- The newest `updated_at` wins; one announcement at most.
- Activating an announcement in the admin deactivates all others (`admin-announcements.ts` `deactivateOthers`).
- It is shown site-wide on every public page (layout.tsx:101).

### Display rules (`announcement-modal.tsx`)
- Dismissals are stored in localStorage under `ecm-announcement-{id}-{Date.parse(updated_at)}`, holding the timestamp.
- Because the key includes `updated_at`, editing an announcement makes it show again.
- It is open when there is no stored key, or when `nowMs − dismissedAt > dismiss_hours × 3,600,000`.
- `nowMs` comes from the server render, so with ISR it can be up to about 5 minutes stale.
- It never opens during SSR or hydration.
- Every way of closing it records a dismissal: Escape, backdrop click, "Not now", the X button, and the CTA.

---

## 6. Forms (`src/lib/actions/submissions.ts`; components in `src/components/*-form.tsx`)

**Common to all forms**
- The forms use `noValidate` and validate on the server; they are all live (`FORMS_ENABLED`).
- **Rate limit**: 5 submissions per 10 minutes per bucket (lines 90-101). Message: "That's a few submissions in a short time. Please wait about N minute(s) and try again."
- **Honeypot**: the server checks the `website` and `company` fields and returns a fake success if either is filled (lines 80-82). **None of the form components renders those fields**, so the check never triggers.
- **Supabase not configured**: "Our form isn't connected yet — sorry. Please email us at {email}…"
- **Error box**: `role=alert`, destructive colour. Field errors appear under each field.
- **Success**: the form is replaced by a `green-100` box with a `border-green/50` border and a CheckCircle icon.

**Contact** (`contact-form.tsx`)
- Fields (two-column grid):
  - "Your name *" (`name`)
  - "Email *" (`email`)
  - "Phone" (`phone`)
  - "What's it about?" (`subject`, placeholder "Visiting, Connect Groups, serving…")
  - "Your message *" (`message`, textarea, 6 rows)
- Validation messages:
  - "Please tell us your name."
  - "We need an email address to reply to." / "That doesn't look like a valid email address."
  - "Please write your message."
- Length limits: name 120, email 254, phone 40, subject 200, message 5000.
- Button: "Send message" ("Sending…" while pending). This is the shadcn Button (navy, `rounded-lg`, 36px tall), not the pill `Btn`.
- Success: h2 "Message received" with "Thank you — your message is with us and we'll be in touch soon."
- Stored in `contact_messages`.
- Email: sent to `EMAIL_TO` with reply-to set to the sender. Subject "Website enquiry: {subject}", or "New website enquiry".

**Prayer** (`prayer-form.tsx`)
- Fields:
  - "Your name" (optional; hint "Optional — you're welcome to stay anonymous.")
  - "Email" (hint "Only if you'd like us to follow up.")
  - "Phone"
  - "What can we pray for? *" (`request`, 6 rows)
- Checkboxes:
  - `share_with_team`: "Share this with our wider prayer team." with hint "Leave unticked and only the pastoral team will see it."
  - `is_urgent`: "This is urgent."
- Validation: "Please tell us what we can pray for."; email is checked only if one is given.
- Button: "Send prayer request" (shadcn Button).
- Success: h2 "We're praying" with "Thank you — we've received your request and our prayer team will be praying."
- Stored in `prayer_requests`.
- Email: sent to `PRAYER_INBOX`, falling back to `EMAIL_TO`. Subject "URGENT prayer request" or "New prayer request"; the body includes the share flag.

**Gift Aid** (`gift-aid-form.tsx`; wording in `src/lib/gift-aid.ts`)
- First, a grey box with the declaration, which is stored verbatim: "Please treat as Gift Aid donations all qualifying gifts of money made from the date of this declaration and in the past four years. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference."
- Version: `hmrc-2016-enduring-v1`.
- **"Your details"**:
  - Title select: —, Mr, Mrs, Miss, Ms, Dr, Rev, Pastor.
  - "First name *", with the note "Please give your full first name, not an initial."
  - "Surname *".
- **"Your home address"**, with the note "HMRC requires your home address to identify you as a UK taxpayer. A work or c/o address can't be accepted.":
  - "House name or number, and street *"
  - "Address line 2"
  - "Town or city" (default "Manchester")
  - "Postcode *" (uppercase)
- **"How we reach you"** (optional): Email, Phone.
- **Declaration checkbox** in a `green-100` box: "**Yes, I want to Gift Aid my giving.** I confirm the declaration above and that I am a UK taxpayer."
- Button: "Submit my declaration" (green pill `Btn`, large).
- HMRC notes after the button:
  - "Please tell us if you:" want to cancel this declaration / change your name or home address / no longer pay sufficient tax on your income and/or capital gains.
  - The higher-rate taxpayer note.
  - The charity line.
- Validation:
  - First name must be at least 2 characters after removing dots and spaces ("HMRC needs your full first name, not an initial.").
  - Surname at least 2 characters.
  - Address required; if it has no digit and is under 4 characters: "Please include your house name or number — HMRC requires it."
  - Postcode must match `/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i` and is normalised to "M6 6PU" format.
  - Declaration must be ticked ("Please confirm the declaration so we can claim Gift Aid.").
- Success: "Declaration received" with "Thank you — your Gift Aid declaration is recorded. Every £10 you give is now worth £12.50 to the church, at no extra cost to you." plus "Please let us know if you change your name or address, stop paying enough tax, or want to cancel."
- Stored in `gift_aid_declarations`. Database checks enforce the same rules, and rows are never deleted (`cancelled_at` instead).
- Email: sent to `EMAIL_TO`, subject "New Gift Aid declaration", containing only the name and postcode.

**Newsletter** (`newsletter-form.tsx`)
- Appears only as a CMS `form` block.
- A single email field (sr-only label "Email address", placeholder "you@email.com") in a white pill input, plus a green "Subscribe" button. Max width 480px; on ink.
- Error: "Please enter a valid email address."
- Success: "You're on the list — thank you."
- Upserts into `newsletter_subscribers` by email.
- There is no double opt-in (the schema has a `confirmed_at` column but nothing uses it), no consent checkbox, and no notification email.

**Email transport**: Resend (`src/lib/email.ts:19-31`), configured with `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` and `PRAYER_INBOX`.

---

## 7. Header navigation and footer

**Header nav** (`src/lib/church.ts:352-369`)
| Label | Href |
|---|---|
| I'm New | /im-new |
| About | /about |
| Watch | /watch |
| Events | /events |
| Get Involved | /get-involved |
| Prayer | /prayer |
| Contact | /contact |

- About has defined children that are not rendered: Our Story `/about#our-story`, Vision & Values `/about#vision-values`, Leadership `/about#leadership`, What We Believe `/about/what-we-believe`.
- Header CTAs: "Plan a Visit" → `/im-new` (ghost) and "Give" → `/give` (green). "Give" is not in the nav list.

**Footer columns** (`site-footer.tsx:7-35`)
- **Visit**:
  - Plan a visit `/im-new`
  - What to expect `/im-new#what-to-expect` *(broken anchor)*
  - Times & location `/im-new#find-us` *(broken)*
  - Kids & youth `/im-new#kids` *(broken)*
- **Explore**: Watch messages `/watch`, Events `/events`, Get involved `/get-involved`, Give `/give`.
- **Connect**: Contact us `/contact`, Prayer request `/prayer`, Connect Groups `/get-involved#connect-groups`, What we believe `/about/what-we-believe`.
- Then the brand column, practical strip and bottom bar described in §2.

---

## 8. Other notable items

**`next.config.ts`**
- **No redirects or rewrites.** Redirects exist only in the database: the `redirects` table used by `[slug]`.
- `images.qualities` is `[75, 90]`.
- Remote image hosts: `i.ytimg.com`, `yt3.ggpht.com`, and the Supabase host.
- Server actions body limit: 12mb.

**CSP** (next.config.ts, around lines 58-73)
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com`
- `img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://yt3.ggpht.com`
- `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://maps.google.com`
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co`
- `frame-ancestors 'none'`, `form-action 'self'`, `upgrade-insecure-requests`

Other headers:
- X-Frame-Options DENY
- nosniff
- Referrer-Policy strict-origin-when-cross-origin
- Permissions-Policy: camera, microphone, geolocation and interest-cohort all disabled
- HSTS 2 years with preload
- `/admin/*`: `no-store` and `X-Robots-Tag: noindex`

**Proxy** (`src/proxy.ts`): only protects `/admin`, via the Supabase session.

**Sitemap and robots**
- `src/app/sitemap.ts` lists 11 static routes, all weekly:
  - `/` 1
  - `/im-new` 0.9
  - `/give` 0.9
  - `/about`, `/watch`, `/events`, `/get-involved` 0.8
  - `/about/what-we-believe`, `/prayer`, `/contact` 0.7
  - `/privacy` 0.3
- **Event pages and CMS pages are not in the sitemap.**
- `robots.ts`: allow `/`, disallow `/admin`, points to the sitemap.

**Revalidation**
- Layout: 300s.
- `/events` and `/events/[slug]`: 300s.
- `/watch`: 60s.
- YouTube channel lookup cached for 1 day; video lists for 60s.

**Photo specs** (`public/*/README.md`)
- **Hero**:
  - 2560×1440 (16:9), minimum 1920×1080, JPEG sRGB, quality 80–85, under 1.5MB.
  - Keep the subject **right of centre**, since the left ~45% sits under the headline wash.
  - On mobile (about 390×640) the crop is about a third of the width; set a focal point, or optionally supply a 1200×1600 (3:4) portrait version.
  - Expose slightly bright; candid shots of people; warm tones.
  - Avoid livestream grabs, burned-in text or logos, heavy filters, and stock photos.
  - Parental consent is required for under-18s.
- **im-new cards**:
  - 1200×900 (4:3), minimum 800×600, under 400KB.
  - Keep faces in the upper two-thirds and away from the bottom-left, where the icon badge sits; nothing important in the bottom 25%.
- **Events**:
  - 1920×1080 (16:9), under 500KB; optionally 2560×1440 for the detail banner.
  - Keep the top-left clear for the date chip.
  - Name the file after the event slug.
- **Brand**:
  - PNG 938×307 in colour, white and navy variants.
  - The icon and OG images in `src/app` are generated from these.
  - An SVG original would be better if one exists.

**Other public files**: `public/leadership/*.jpg` (three 4:5 portraits). The default Next SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) are unused.

**Other findings**
- The home and footer anchors `/im-new#what-to-expect`, `#find-us` and `#kids` are broken; `im-new/page.tsx` has no ids.
- The About dropdown children are never rendered.
- The watch page's meta description hard-codes "Sundays at 10:30am", and so does the contact page's. Both will go stale if the service time is changed in settings.
- `/events` and home-events use the compiled `socials` from `church.ts` for the Instagram link, not the settings override.
- There is no custom 404 page in `(site)`.
- `docs/admin-plan.md` exists and covers admin planning; I did not review it.
