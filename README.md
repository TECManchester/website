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
./bin/setup.sh        # pinned WordPress + plugins (bin/versions.lock), then ./bin/seed.sh
./bin/check-env.sh    # verify versions, table prefix and database match the lock
```

## Day to day

```bash
docker compose up -d
docker compose run --rm wpcli wp <command>
docker compose run --rm node npm run build        # rebuild elevation-core blocks
docker compose run --rm composer vendor/bin/phpunit
```

## Seeding

`seed/` is the source of truth for pages and menus until the date in `seed/CUTOFF`.
`./bin/seed.sh` never overwrites a post that was edited in wp-admin. Use
`SEED_FORCE="slug other-slug" ./bin/seed.sh` to overwrite specific ones.

## Private data

`private/` (gitignored) holds the live backup and its mirror database password. It contains
personal data. See `docs/live-inventory.md` and the go-live checklist for handling and deletion.
