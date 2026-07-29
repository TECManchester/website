# Admin / CMS — build plan

Status: **built.** Phases 0–6 are live; see §11 for what each shipped.

Super admin: `communications@elevationmanchester.org`

---

## 1. Goal

One place where church staff can edit every piece of content on the site —
text, images, events, settings — and build new pages without a developer.

## 2. Core design decision

The site is 11 pages built from highly repetitive parts (35 `Section`,
24 `SectionHeading`, 9 `PageHero`). So content is modelled as **ordered blocks**
rather than page-shaped records.

A page is a list of typed blocks. The same block types compose new pages. One
editor, one renderer — rather than one system for existing pages and another
for new ones.

## 3. Where it lives

```
src/app/(admin)/admin/…     route group, its own layout — no public header/footer
src/proxy.ts                route protection (Next 16 uses proxy.ts, not middleware.ts)
```

## 4. Data model

| Table | Purpose |
| --- | --- |
| `profiles` | 1:1 with Supabase Auth user. `status`, `role_id`, name |
| `roles` | Named roles with a capability set |
| `pages` | slug, title, SEO, status, `is_system` |
| `blocks` | `page_id`, `sort_order`, `type`, `data` (jsonb), draft + published copies |
| `block_revisions` | History, for undo |
| `media` | Supabase Storage refs, alt text, dimensions |
| `site_settings` | Address, service times, socials, giving details, brand |
| `announcements` | Popup modals (see §8) |
| `events` | **Already built and working** — needs a UI only |

## 5. Auth and approval

1. Anyone can sign up with email.
2. New accounts land as `status = 'pending'` and see a holding screen. No data
   access at all — enforced by RLS, not just the UI.
3. A super admin approves them **and assigns a role at the same time**.
4. `communications@elevationmanchester.org` is seeded as `super_admin`/approved.

Protection is layered: `proxy.ts` guards the routes, and RLS policies enforce
capabilities in the database. A UI bug must not be able to expose data.

## 6. Roles and capabilities

Capabilities are granular; roles are named bundles of them, so an approver
picks a role and knows exactly what it grants.

**Capabilities**

```
pages.view  pages.create  pages.edit  pages.delete  pages.publish
events.view  events.manage
media.view  media.upload  media.delete
settings.edit
announcements.manage
users.approve  users.manage
submissions.contact.view
submissions.prayer.view     ← pastoral, sensitive
submissions.giftaid.view    ← personal + HMRC data, sensitive
```

**Predefined roles**

| Role | Grants |
| --- | --- |
| **Super admin** | Everything, including approving users and viewing prayer + Gift Aid |
| **Admin** | All content, settings, announcements, contact messages. **Not** prayer, Gift Aid, or user management |
| **Editor** | Pages, blocks, media, events. No settings, no submissions |
| **Events manager** | Events and media only |
| **Pastoral** | Prayer requests only — no content access |
| **Finance** | Gift Aid declarations only — no content access |

The last two matter: prayer requests are pastoral confidences and Gift Aid
declarations are personal data under a 6-year HMRC retention duty. Neither
should be visible to someone whose job is editing the events page.

## 7. Pages and URLs

- Creating a page asks for a title and proposes a slug, editable before saving.
- The full public URL is shown and copyable, with a live "already taken" check.
- New pages render through a catch-all route so no deploy is needed.
- Existing pages are flagged `is_system`: their slug is locked and they cannot
  be deleted, because code links to `/give`, `/events` and so on.

## 8. Announcement modals

A dismissible popup for important notices.

Fields: title, body, optional image, optional CTA label + link, `is_active`,
`starts_at` / `ends_at`, `dismiss_hours` (default 24).

Behaviour: shows on first page view when active and within its window;
dismissal is stored per-visitor with a timestamp and it stays hidden until
`dismiss_hours` has passed. Only one active announcement shows at a time.

Accessibility: focus trap, Escape to close, returns focus on close, and honours
`prefers-reduced-motion`.

## 9. Block types

Derived from what the 11 pages already use — ~13 types cover everything:

`hero-slideshow` · `page-hero` · `rich-text` · `icon-cards` · `image`
· `image-text` · `accordion` · `leadership-grid` · `event-list`
· `event-calendar` · `youtube-latest` · `cta-band` · `stats` · `form`

## 10. Media

Move to **Supabase Storage** (1 GB on the free tier). Upload and pick from a
library in the admin.

This also fixes a real problem: 17 images are committed to git today, so every
photo change currently requires a deploy.

## 11. Phasing

| Phase | Delivers |
| --- | --- |
| **0** | ✅ Auth, approval queue, roles, admin shell, route protection |
| **1** | ✅ Events CRUD + media library |
| **2** | ✅ Site settings — address, times, socials, giving, banner slides |
| **3** | ✅ Announcement modals |
| **4** | ✅ Block editor with draft/publish, revisions, preview at three widths |
| **5** | ✅ New pages with live URL check; renames leave redirects |
| **6** | ✅ Submissions inbox; contact, prayer and newsletter forms enabled |

Deliberate scope note: the 11 built-in pages stay code-rendered. Their
changeable content (address, times, socials, giving, banner) is editable via
Settings; converting their remaining fixed copy into blocks is mechanical now
the engine exists, and can be done page by page on request.

## 12. Decisions (settled 29 July 2026)

1. **Draft/preview: yes.** Pages can be held in draft, previewed at desktop and
   mobile widths, and published only by someone whose role carries
   `pages.publish`.
2. **Revision history: yes** — `block_revisions` from the start.
3. **Rich text editor: Tiptap.**
4. **Build vs buy: bespoke.** Sanity's free tier was disqualifying on facts:
   custom roles need the Growth plan ($15/seat/month) and free datasets are
   public — unacceptable for prayer and Gift Aid data. Payload (MIT, free,
   ships blocks/drafts/versions/live-preview) was the credible alternative and
   was declined for full design control and long-term ownership of the
   platform. Recorded so the decision is revisitable with its reasoning.

## 13. Additional engineering considerations (adopted)

Things not in the original brief that a production CMS needs, now part of the
plan:

- **Audit log** — every approval, role change, publish and settings change
  records who did it and when. Essential with multiple editors.
- **Cache correctness** — public pages are statically cached; every admin
  mutation calls `revalidatePath`/`revalidateTag` so edits appear immediately.
- **Concurrent-edit safety** — saves carry the revision they were based on;
  a conflicting save warns instead of silently overwriting.
- **Slug changes → redirects** — renaming a published page records a redirect
  so old links and search results keep working.
- **Gift Aid CSV export** — HMRC claims need the data out, not just visible.
- **Admin is noindexed** — `robots` disallow plus per-page noindex metadata.
- **Sign-up email confirmation trade-off** — Supabase's built-in mailer only
  reliably delivers to project team members, so self-serve sign-up uses
  auto-confirm; the approval gate (no access until a super admin approves)
  is the real control. Revisit if a custom SMTP provider is added.
- **Temp credentials** — seeded accounts get a forced password change on
  first login via the account page.
- **Media discipline** — uploads require alt text; images resized server-side.
