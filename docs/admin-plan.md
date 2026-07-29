# Admin / CMS — build plan

Status: **proposed, not started.** No admin code exists today; `/admin` is a 404
and Supabase Auth is unused.

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
| **0** | Auth, approval queue, roles, admin shell, route protection |
| **1** | Events CRUD + media library — **staff stop needing a developer for events** |
| **2** | Site settings — address, times, socials, giving |
| **3** | Announcement modals |
| **4** | Block editor; the 11 existing pages converted |
| **5** | Create new pages on the fly |
| **6** | Submissions inbox; enable the three disabled forms |

Phases 0–3 deliver most of the day-to-day value. Phase 4 is the largest single
chunk — converting 11 pages is the bulk of the work.

## 12. Open decisions

1. **Draft/preview**, or do edits go live immediately? Preview is safer with
   several editors; instant is simpler.
2. **Revision history** — recommended, and cheap if built in from the start.
3. **Rich text editor** — recommend Tiptap.

## 13. Considered and rejected

**Buying a CMS (Payload, Sanity) instead of building.** Payload would give
roughly 80% of this, maintained by someone else — a real consideration for an
organisation that may lose its technical volunteer.

Rejected because the project is already on Supabase with the schema and RLS
patterns established, an off-the-shelf CMS would add a second auth system and a
heavy dependency, and the site needs a bespoke look. Worth revisiting if the
block editor proves more work than expected.
