# Elevation Church Manchester — WordPress

The redesigned elevationmanchester.org as a WordPress block theme (`wp-content/themes/elevation`)
and plugin (`wp-content/plugins/elevation-core`). Spec and plans are in `docs/superpowers/`.

| Service | URL |
|---|---|
| Site | http://localhost:8080 |
| WP admin | http://localhost:8080/wp-admin |
| Mailpit (all local email) | http://localhost:8025 |
| phpMyAdmin | http://localhost:8081 |

Credentials are in `.env` (gitignored).

## Build from nothing

```bash
cp .env.example .env  # then edit the passwords in .env
./bin/setup.sh        # pinned WordPress + plugins (bin/versions.lock), then ./bin/seed.sh
./bin/check-env.sh    # verify versions, table prefix and database match the lock
```

## Day to day

```bash
docker compose up -d
docker compose run --rm wpcli wp <command>
docker compose run --rm node npm run build        # rebuild elevation-core blocks
docker compose run --rm php vendor/bin/phpunit
docker compose run --rm node npm run test:js                 # consent logic (node --test)
./bin/check-urls.sh                                          # pages 200, redesign redirects 301
./bin/check-tokens.sh / /about/                              # no raw {settings.tokens} on a page
./bin/export-page.sh about                                   # write a wp-admin edit back into seed/
docker compose run --rm -T wpcli wp elevation fixtures events /seed/fixtures/events.json   # re-date the sample events
```

## Updating the live site

The live site runs this theme and plugin; its database (pages, events, groups, forms, settings) is edited in
live wp-admin and is the source of truth there. Deploy **code only**, never the database:

```bash
git commit …                 # the package is built from the last commit
DEPLOY_URL=https://elevationmanchester.org DEPLOY_USER=<administrator> ./bin/deploy.sh
```

`bin/deploy.sh` runs `bin/package.sh` (→ `dist/elevation.zip`, `dist/elevation-core.zip`), signs in to wp-admin,
uploads both with "Replace current with uploaded" and checks the site serves the new files. It asks for the
password, or reads `DEPLOY_PASSWORD`; the three variables can also sit in `.env.deploy` (gitignored). It refuses
to target `localhost`, where the theme and plugin folders *are* this working tree.

By hand instead: Appearance → Themes → Add New Theme → Upload Theme → `dist/elevation.zip` → "Replace current
with uploaded"; Plugins → Add New Plugin → Upload Plugin → `dist/elevation-core.zip` → "Replace current with
uploaded". A change to page content in `seed/pages/` has to be repeated by hand in the live page editor. Never
run `bin/seed.sh` against live or restore a local backup over it.

## Seeding

`seed/` is the source of truth for pages and menus until the date in `seed/CUTOFF`.
`./bin/seed.sh` never overwrites a post that was edited in wp-admin. Use
`SEED_FORCE="slug other-slug" ./bin/seed.sh` to overwrite specific ones.

- `bin/fetch-live-media.sh` downloads the kept pages' images from the live site into the gitignored `seed/media/live/`, verified by `seed/media/live.sha256`.
- `seed/fixtures/events.json` holds **local-only** sample events, dated relative to the day you seed (`+9 19:00` = nine days from today at 7pm). `./bin/seed.sh` loads them with `wp elevation fixtures events`; `wp elevation fixtures remove` deletes them (Plan 6 does this before go-live). Fixtures never overwrite a real event with the same slug.
- `bin/validate-blocks.js` is pasted into the editor's console to check every page and pattern for block-validation errors. On the local stack you can instead open `http://localhost:8080/?elevation-validate-blocks=1` and read `window.elevationValidation`.

## YouTube

- Watch and Home show the church's YouTube channel (Settings → Church → YouTube): the latest videos, which open on YouTube, and the live stream while streaming. Nothing from YouTube is stored in WordPress.
- Locally, put a YouTube Data API v3 key in `.env` as `YOUTUBE_API_KEY=` and run `docker compose up -d`; the local site then shows the real channel. Without a key you see the "Watch on YouTube" panel. On live, the key goes in Settings → Church.
- Settings → Church shows whether YouTube is working (or the last error) and has "Check YouTube now".
- Thumbnails are copied into `wp-content/uploads/elevation-youtube/` so visitors' browsers never contact YouTube before they consent.

## Forms, groups and announcements

- The nine church forms are Fluent Forms, created from `seed/forms/*.json` by `bin/seed.sh`
  (`wp elevation forms seed /seed/forms`). Each has a fixed key (`contact`, `prayer`, `gift-aid`, `newsletter`,
  `g-squad`, `plan-a-visit`, `join-group`, `connect-card`, `alpha`); pages place them with the
  `elevation/form` block. Required fields and validation messages live in `wp-content/plugins/elevation-core/src/FormRules.php`.
- Required fields and field keys are set in code. Don't delete or rename fields in Fluent Forms: wording, labels
  and emails can be edited there, but a field that is deleted or renamed simply stops being checked (Gift Aid, the
  visit date and the group check always apply), and the emails and entry maps that use its key stop working.
- A form edited in wp-admin → Fluent Forms is left alone by the seed; `SEED_FORCE="form:contact" ./bin/seed.sh`
  overwrites it.
- Recipients and email wording use settings smartcodes (`{contact.welcomeInbox}`, `{service.startTime}`, …),
  so changing Settings → Church changes the next email.
- Local mail goes to Mailpit at http://localhost:8025. `./bin/submit-form.sh <key> field=value …` sends a form
  like a browser; `./bin/mail.sh` lists what arrived; `wp elevation forms reset-limits` clears the rate limit;
  `wp elevation forms purge-test-entries` removes every entry with an `@example.com` address (local only).
- Connect Groups and Announcements are in the wp-admin menu. A group is edited in the "Group details" box under its title (the classic edit screen; Excerpt, Custom Fields, Areas, Group types and Post Attributes are folded into it). The church's seven real groups come from
  `seed/groups.json` (`wp elevation groups seed`, run by `./bin/seed.sh`). A group edited in wp-admin is skipped with a
  warning; `SEED_FORCE="group:<slug>"` overwrites that one. Leader emails and images are added in wp-admin and are never
  seeded. Each group has an "Ask to join email" (empty = Settings → Church → Connect Groups inbox); a Join Group request is emailed to that one address only.
  Local sample events and a (switched-off) sample announcement come from `seed/fixtures/`; `wp elevation fixtures remove`
  deletes those fixtures (and any old sample groups), never the seeded groups.

## Private data

`private/` (gitignored) holds the live backup and its mirror database password. It contains
personal data. See `docs/live-inventory.md` and the go-live checklist for handling and deletion.
