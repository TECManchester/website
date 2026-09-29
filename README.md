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
```

## Seeding

`seed/` is the source of truth for pages and menus until the date in `seed/CUTOFF`.
`./bin/seed.sh` never overwrites a post that was edited in wp-admin. Use
`SEED_FORCE="slug other-slug" ./bin/seed.sh` to overwrite specific ones.

- `bin/fetch-live-media.sh` downloads the kept pages' images from the live site into the gitignored `seed/media/live/`, verified by `seed/media/live.sha256`.
- `bin/validate-blocks.js` is pasted into the editor's console to check every page and pattern for block-validation errors. On the local stack you can instead open `http://localhost:8080/?elevation-validate-blocks=1` and read `window.elevationValidation`.

## Private data

`private/` (gitignored) holds the live backup and its mirror database password. It contains
personal data. See `docs/live-inventory.md` and the go-live checklist for handling and deletion.
