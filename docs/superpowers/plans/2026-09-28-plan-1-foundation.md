# Plan 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pinned, reproducible local WordPress running the new `elevation` block theme (design tokens, header, footer) and the `elevation-core` plugin (Church Settings, settings bindings and inline tokens, the Site Manager role, the block build pipeline, and a seed CLI with a hash guard). One command builds it from nothing.

**Architecture:** Docker Compose runs WordPress 7.1.2 on PHP 8.3 with MariaDB 10.6 and table prefix `wp6d_` (both match live), plus Mailpit, and tool containers for Node and Composer. Pure PHP classes (`Settings`, `Tokens`, `SeedGuard`) hold the logic and are unit-tested with PHPUnit and no WordPress. Thin WordPress glue files wire them into hooks, an admin page, a Block Bindings source, a `render_block` filter and a WP-CLI command. The theme is a block theme: `theme.json` carries the redesign's tokens, template parts carry the header and footer, and a small view script adds the header states core can't express.

**Tech Stack:** Docker Compose, WordPress 7.1.2, PHP 8.3, MariaDB 10.6, WP-CLI 2, PHPUnit 11 (Composer 2 container), `@wordpress/scripts` (Node 22 container), Mailpit.

**Spec:** `docs/superpowers/specs/2026-09-28-wordpress-redesign-design.md` (plus `2026-09-28-redesign-inventory.md` for exact visual values). Roadmap: `docs/superpowers/plans/2026-09-28-roadmap.md`.

## Global Constraints

- Database **MariaDB 10.6**, table prefix **`wp6d_`**, PHP **8.3**, WordPress core **7.1.2** (spec §8).
- Every Docker image is pinned by tag **and** digest. Every plugin is pinned by version in `bin/versions.lock` (spec §8).
- Palette only: green `#84C224` (fills only, never text on white), green-600 `#6FA61C`, green-100 `#EAF6D6`, ink `#0E0E2C`, ink-800 `#1B1F29`, grey-50 `#F7F8F5`, grey-100 `#F1F1EF`, grey-300 `#D7D9D6`, grey-500 `#676767`, grey-700 `#4B4F58`, white. Core palettes, gradients and duotones disabled (spec §5.2).
- Fonts are self-hosted. Sora for headings (line-height 1.1, letter-spacing −0.02em, ink); Inter for body (grey-700, line-height 1.625). No requests to Google Fonts (spec §5.2).
- Layout: contentSize 760px, wideSize 1240px, 24px side padding (spec §5.2).
- Header: sticky, 76px (88px ≥640px); collapses to the overlay menu **below 1024px**; transparent over the hero on the front page until 80px of scroll (spec §5.3).
- Settings never output `youtube.apiKey`. Token and binding values are always HTML-escaped (spec §6.1).
- `manage_church_settings` belongs to Administrator and Site Manager only. Site Manager = Editor + `manage_church_settings` + `edit_theme_options`, and **no** `manage_options` (spec §7).
- The seed never overwrites a post edited by hand unless `--force` is given, and refuses to run after the cut-off date in `seed/CUTOFF` (spec §9).
- Local mail goes to Mailpit only (spec §2).
- Git tracks only our code: the theme, `elevation-core`, mu-plugins, `bin/`, `seed/`, `docs/` and the Docker config. `private/` is never tracked.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **A settings value containing HTML or quotes** (e.g. venue `Mary's <Hall>`): tokens and bindings render it escaped, with no broken markup or injection. Pinned by `TokensTest::test_escapes_html_in_values` (Task 3).
- **A mistyped token** (`{service.statTime}`): left visible as written, so an editor spots it, rather than silently blanked. Pinned by `TokensTest::test_unknown_key_is_left_as_written` (Task 3).
- **A required setting saved blank** (contact email cleared by accident): falls back to the default, not an empty `mailto:`. Pinned by `SettingsTest::test_blank_required_value_falls_back_to_default` (Task 2).
- **Re-running the seed after a page was edited in wp-admin**: the page is skipped with a warning, not overwritten. Pinned by `SeedGuardTest::test_hand_edited_post_is_skipped` (Task 3) and the CLI check in Task 9 Step 6.
- **The header with JS disabled, or after reloading halfway down the front page**: the header is readable, solid without JS and in the correct state on load. Pinned by the browser checks in Task 7 Step 7.

---

## File structure

```
docker-compose.yml                      (rewrite) pinned images, prefix, mailpit, node/composer tools
.env / .env.example                     (modify) unchanged keys
.gitignore                              (rewrite) allow-list our code
README.md                               (rewrite) new workflow
bin/versions.lock                       (create) core + plugin pins
bin/setup.sh                            (rewrite) install from lock, then seed
bin/check-env.sh                        (create) verify versions/prefix/db against the lock
bin/seed.sh                             (create) build the site from seed/
bin/post-import.sh                      (delete) replaced by seed.sh
seed/CUTOFF                             (create) "none" until the cut-off is set
seed/navigation/header.html             (create) header menu
seed/pages/home.html                    (create) placeholder home (replaced in Plan 2)
wp-content/mu-plugins/local-dev.php     (modify) route mail to Mailpit
wp-content/plugins/elevation-core/
  elevation-core.php                    bootstrap: constants, requires, block registration
  composer.json, phpunit.xml.dist       tests
  package.json, package-lock.json       block build
  src/Settings.php                      pure: defaults, resolve, get, flatten/unflatten, publicValues
  src/Tokens.php                        pure: {dotted.key} replacement with escaping
  src/SeedGuard.php                     pure: create/update/skip/unchanged decision
  includes/settings.php                 WP: option access, helpers, cache
  includes/settings-page.php            WP: Settings → Church admin screen + sanitising
  includes/bindings.php                 WP: Block Bindings source + render_block token filter
  includes/roles.php                    WP: capability + Site Manager role
  includes/cli.php                      WP-CLI: `wp elevation seed`
  src/blocks/social-links/              block.json, index.js, render.php, style.css
  build/                                compiled blocks (committed)
  tests/SettingsTest.php, TokensTest.php, SeedGuardTest.php
wp-content/themes/elevation/
  style.css, functions.php, theme.json
  assets/fonts/{inter,sora}-latin-wght.woff2, OFL.txt
  assets/images/logo-colour.png, logo-white.png
  assets/css/site.css                   header, footer, block styles
  assets/js/header.js                   scroll/over-hero state, overlay extras, active link
  parts/header.html, parts/footer.html
  patterns/header-logo.php, patterns/footer-logo.php
  templates/index.html, page.html, front-page.html, 404.html
```

---

### Task 1: Pinned, reproducible environment

This replaces the current local environment. **The current local database and imported media are
disposable**: the spec rebuilds everything from seed. The live backup in `private/` and the mirror
are untouched.

**Files:**
- Rewrite: `docker-compose.yml`, `bin/setup.sh`, `.gitignore`, `README.md`
- Create: `bin/versions.lock`, `bin/check-env.sh`
- Modify: `wp-content/mu-plugins/local-dev.php`
- Delete: `bin/post-import.sh`

**Interfaces:**
- Produces: the `wpcli` service (runs `wp` with `/seed` mounted read-only), the `node` and
  `composer` tool services (profile `tools`, working dir = the `elevation-core` plugin), `mailpit`
  (UI http://localhost:8025, SMTP `mailpit:1025`), and the `bin/versions.lock` variables `WP_CORE`
  and `PLUGINS` (space-separated `slug@version:active|inactive`).

- [ ] **Step 1: Write `bin/versions.lock`**

```bash
# Pinned versions. bin/setup.sh installs exactly these; bin/check-env.sh verifies them.
# Upgrade deliberately: bump here (and the image digest in docker-compose.yml), re-run, re-test.
WP_CORE=7.1.2
DB_MAJOR=10.6
TABLE_PREFIX=wp6d_
PLUGINS="fluentform@6.2.14:active redirection@5.10.1:active smartcrawl-seo@3.16.4:active wp-smushit@4.3.3:active fluent-smtp@2.4.1:inactive defender-security@6.2.4:inactive hummingbird-performance@3.21.2:inactive wpvivid-backuprestore@0.9.136:inactive"
```

- [ ] **Step 2: Rewrite `docker-compose.yml`**

```yaml
name: elevationmanchester

# wp-config.php in the official image reads these at runtime, so WordPress and WP-CLI must share them.
x-wp-env: &wp-env
  WORDPRESS_DB_HOST: db
  WORDPRESS_DB_NAME: ${DB_NAME}
  WORDPRESS_DB_USER: ${DB_USER}
  WORDPRESS_DB_PASSWORD: ${DB_PASSWORD}
  WORDPRESS_TABLE_PREFIX: wp6d_
  WORDPRESS_DEBUG: "1"
  WORDPRESS_CONFIG_EXTRA: |
    define('WP_ENVIRONMENT_TYPE', 'local');
    define('WP_DEBUG_DISPLAY', false);
    define('WP_DEBUG_LOG', true);
    define('WP_MEMORY_LIMIT', '512M');

services:
  db:
    # Matches live (MariaDB 10.6.28). MariaDB 11 collations do not import into 10.6.
    image: mariadb:10.6@sha256:40153feb479c0da88b5cfe3f50f44c91f7baf05a1b7bcc5beb7eb37a890a8f16
    restart: unless-stopped
    environment:
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 30

  wordpress:
    image: wordpress:7.1.2-php8.3-apache@sha256:8ae73d594a154e30b112e8d085afbc0895acf7651d8f53ef63aefb42e30822d5
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "${WP_PORT}:80"
    environment: *wp-env
    volumes:
      - wp_core:/var/www/html
      - ./wp-content:/var/www/html/wp-content
      - ./config/uploads.ini:/usr/local/etc/php/conf.d/uploads.ini:ro

  wpcli:
    image: wordpress:cli-2-php8.3@sha256:0f7f0f895c379bb7b60b8f09562811084ac0424d544747f76d95cc785feccac0
    profiles: ["cli"]
    user: "33:33"
    depends_on:
      db:
        condition: service_healthy
    environment:
      <<: *wp-env
      HOME: /tmp
    volumes:
      - wp_core:/var/www/html
      - ./wp-content:/var/www/html/wp-content
      - ./seed:/seed:ro
      - ./private/vendor:/vendor:ro

  mailpit:
    image: axllent/mailpit@sha256:ed9b00c609e77e99c79b93f1178255ebc271868920f2c69a8d166bd5634ed10d
    restart: unless-stopped
    ports:
      - "8025:8025"

  phpmyadmin:
    image: phpmyadmin:5@sha256:0b38dba8580a95729813799e36623042ac5e23af19d8c50f8003b19f4b980726
    restart: unless-stopped
    depends_on:
      - db
    ports:
      - "8081:80"
    environment:
      PMA_HOST: db
      UPLOAD_LIMIT: 256M

  node:
    image: node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c
    profiles: ["tools"]
    working_dir: /app
    volumes:
      - ./wp-content/plugins/elevation-core:/app

  composer:
    image: composer:2@sha256:9715c7f69044da2a212a5fbde29ee7da24e364d426560ae6367b060236f847d7
    profiles: ["tools"]
    working_dir: /app
    volumes:
      - ./wp-content/plugins/elevation-core:/app

volumes:
  db_data:
  wp_core:
```

- [ ] **Step 3: Route local mail to Mailpit**

Replace the last block of `wp-content/mu-plugins/local-dev.php` (the `pre_wp_mail` filter and its
comment) with:

```php
// Deliver all local mail to Mailpit (http://localhost:8025) instead of the outside world.
add_action( 'phpmailer_init', function ( $mailer ) {
	$mailer->isSMTP();
	$mailer->Host        = 'mailpit';
	$mailer->Port        = 1025;
	$mailer->SMTPAuth    = false;
	$mailer->SMTPAutoTLS = false;
} );
```

- [ ] **Step 4: Write `bin/check-env.sh`**

```bash
#!/usr/bin/env bash
# Verify the running environment matches bin/versions.lock. Exits non-zero on any mismatch.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; source bin/versions.lock; set +a

wp() { docker compose run --rm -T wpcli wp "$@" 2>/dev/null; }
fail=0
check() { # label expected actual
  if [ "$2" = "$3" ]; then echo "ok    $1 = $3"; else echo "FAIL  $1: expected $2, got $3"; fail=1; fi
}

check "core" "$WP_CORE" "$(wp core version)"
check "table prefix" "$TABLE_PREFIX" "$(wp eval 'global $wpdb; echo $wpdb->prefix;')"
db_version=$(wp db query "SELECT VERSION()" --skip-column-names)
check "db major" "$DB_MAJOR" "$(echo "$db_version" | cut -d. -f1-2)"

for entry in $PLUGINS; do
  slug=${entry%%@*}; rest=${entry#*@}; version=${rest%%:*}; state=${rest#*:}
  check "plugin $slug version" "$version" "$(wp plugin get "$slug" --field=version || echo missing)"
  check "plugin $slug status" "$state" "$(wp plugin get "$slug" --field=status || echo missing)"
done
exit $fail
```

- [ ] **Step 5: Rewrite `bin/setup.sh`**

```bash
#!/usr/bin/env bash
# Build the local environment from bin/versions.lock, then seed the redesigned site.
#   SKIP_SEED=1 ./bin/setup.sh   installs WordPress and plugins only.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; source bin/versions.lock; set +a

wp() { docker compose run --rm -T wpcli wp "$@"; }

mkdir -p private/vendor
docker compose up -d --wait db wordpress mailpit
echo "Waiting for WordPress core files..."
until docker compose exec -T wordpress test -f /var/www/html/wp-config.php; do sleep 2; done

actual=$(wp core version)
if [ "$actual" != "$WP_CORE" ]; then
  echo "WordPress core is $actual but bin/versions.lock pins $WP_CORE: update the wordpress image in docker-compose.yml" >&2
  exit 1
fi

if ! wp core is-installed 2>/dev/null; then
  wp core install --url="$WP_URL" --title="$WP_TITLE" \
    --admin_user="$WP_ADMIN_USER" --admin_password="$WP_ADMIN_PASSWORD" \
    --admin_email="$WP_ADMIN_EMAIL" --skip-email
fi

for entry in $PLUGINS; do
  slug=${entry%%@*}; rest=${entry#*@}; version=${rest%%:*}; state=${rest#*:}
  if [ "$(wp plugin get "$slug" --field=version 2>/dev/null || true)" != "$version" ]; then
    wp plugin install "$slug" --version="$version" --force
  fi
  if [ "$state" = "active" ]; then wp plugin activate "$slug"; else wp plugin deactivate "$slug" 2>/dev/null || true; fi
done

# Licensed plugin, never in git: installed only if its zip has been placed in private/vendor/.
if [ -f private/vendor/fluentformpro.zip ]; then
  wp plugin install /vendor/fluentformpro.zip --force --activate
fi

# Default themes and plugins WordPress ships with are not part of the site.
wp plugin delete akismet hello 2>/dev/null || true

if [ "${SKIP_SEED:-0}" != "1" ]; then
  ./bin/seed.sh
fi
echo "Done: $WP_URL/wp-admin (user: $WP_ADMIN_USER, password in .env). Mail: http://localhost:8025"
```

`bin/seed.sh` doesn't exist until Task 9, so this task runs with `SKIP_SEED=1`.

- [ ] **Step 6: Rewrite `.gitignore`**

```gitignore
.env
.DS_Store
private/
import/

# WordPress content: only our own code is tracked.
wp-content/*
!wp-content/mu-plugins/
!wp-content/themes/
wp-content/themes/*
!wp-content/themes/elevation/
!wp-content/plugins/
wp-content/plugins/*
!wp-content/plugins/elevation-core/
wp-content/plugins/elevation-core/node_modules/
wp-content/plugins/elevation-core/vendor/
```

- [ ] **Step 7: Delete the old import-era files and rebuild from nothing**

```bash
rm -f bin/post-import.sh
docker compose down -v
rm -rf wp-content/plugins/* wp-content/themes/* wp-content/uploads wp-content/upgrade wp-content/debug.log
chmod +x bin/setup.sh bin/check-env.sh
SKIP_SEED=1 ./bin/setup.sh
```

Expected: it finishes with `Done: http://localhost:8080/wp-admin ...`.

- [ ] **Step 8: Verify versions and prefix**

Run: `./bin/check-env.sh`
Expected: every line starts `ok`, and it exits 0. That includes `core = 7.1.2`, `table prefix = wp6d_`, `db major = 10.6`, and the 8 plugins with their lock status.

- [ ] **Step 9: Verify mail reaches Mailpit**

```bash
docker compose run --rm -T wpcli wp eval 'var_dump( wp_mail( "check@example.com", "Mailpit check", "ok" ) );'
curl -s http://localhost:8025/api/v1/messages | python3 -c "import sys,json; m=json.load(sys.stdin)['messages']; print(len(m), m[0]['Subject'] if m else '')"
```

Expected: `bool(true)`, then `1 Mailpit check`.

- [ ] **Step 10: Rewrite `README.md`**

````markdown
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
````

- [ ] **Step 11: Commit**

```bash
git add docker-compose.yml bin/versions.lock bin/setup.sh bin/check-env.sh .gitignore README.md \
  wp-content/mu-plugins/local-dev.php config/uploads.ini .env.example
git commit -m "Pin the local environment to live's database and prefix, add Mailpit and tool containers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `elevation-core` skeleton and `Settings`

**Files:**
- Create: `wp-content/plugins/elevation-core/elevation-core.php`, `composer.json`, `phpunit.xml.dist`, `src/Settings.php`, `tests/SettingsTest.php`

**Interfaces:**
- Produces:
  - `Elevation\Core\Settings::defaults(): array`
  - `Settings::resolve(array $stored): array`, which merges the stored values over the defaults
    (blank required values fall back) and adds derived values
  - `Settings::get(array $settings, string $key): mixed` (dotted key; `null` if missing)
  - `Settings::flatten(array $tree): array<string, scalar>` and
    `Settings::unflatten(array $flat): array`
  - `Settings::publicValues(array $settings): array<string, scalar>`, which flattens the settings
    minus `Settings::SECRET_KEYS`
  - Constants `Settings::OPTION = 'elevation_settings'` and
    `Settings::SECRET_KEYS = ['youtube.apiKey']`
- Derived keys added by `resolve()`: `location.full`, `location.mapsUrl`, `location.embedUrl`.
  `contact.prayerInbox` falls back to `contact.email`.

- [ ] **Step 1: Write the plugin bootstrap and test tooling**

`wp-content/plugins/elevation-core/elevation-core.php`:

```php
<?php
/**
 * Plugin Name: Elevation Core
 * Description: Church Settings, content types and blocks for Elevation Church Manchester.
 * Version: 0.1.0
 * Requires at least: 7.1
 * Requires PHP: 8.3
 * Text Domain: elevation-core
 */

defined( 'ABSPATH' ) || exit;

define( 'ELEVATION_CORE_VERSION', '0.1.0' );
define( 'ELEVATION_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'ELEVATION_CORE_URL', plugin_dir_url( __FILE__ ) );

require_once ELEVATION_CORE_DIR . 'src/Settings.php';
```

`composer.json`:

```json
{
  "name": "elevation/core",
  "type": "wordpress-plugin",
  "require-dev": {
    "phpunit/phpunit": "^11.5"
  },
  "autoload-dev": {
    "psr-4": {
      "Elevation\\Core\\": "src/",
      "Elevation\\Core\\Tests\\": "tests/"
    }
  },
  "config": {
    "platform": { "php": "8.3" }
  }
}
```

`phpunit.xml.dist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php" colors="true" failOnWarning="true">
  <testsuites>
    <testsuite name="unit">
      <directory>tests</directory>
    </testsuite>
  </testsuites>
</phpunit>
```

Run: `docker compose run --rm composer install`
Expected: `vendor/` is created with PHPUnit 11.

- [ ] **Step 2: Write the failing tests**

`tests/SettingsTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Settings;
use PHPUnit\Framework\TestCase;

final class SettingsTest extends TestCase {

	public function test_defaults_match_the_redesign(): void {
		$s = Settings::resolve( [] );
		$this->assertSame( 'Sunday', Settings::get( $s, 'service.day' ) );
		$this->assertSame( '10:30am', Settings::get( $s, 'service.startTime' ) );
		$this->assertSame( 'Mary Seacole Building', Settings::get( $s, 'location.venue' ) );
		$this->assertSame( 'info@elevationmanchester.org', Settings::get( $s, 'contact.email' ) );
		$this->assertSame( 'info@elevationmanchester.org', Settings::get( $s, 'contact.welcomeInbox' ) );
		$this->assertSame( '1195403', Settings::get( $s, 'church.charityNumber' ) );
		$this->assertSame( 'G-0Q3764FCYN', Settings::get( $s, 'analytics.ga4MeasurementId' ) );
	}

	public function test_stored_value_overrides_default(): void {
		$s = Settings::resolve( [ 'service' => [ 'startTime' => '11:00am' ] ] );
		$this->assertSame( '11:00am', Settings::get( $s, 'service.startTime' ) );
		$this->assertSame( 'Sunday', Settings::get( $s, 'service.day' ) );
	}

	public function test_blank_required_value_falls_back_to_default(): void {
		$s = Settings::resolve( [ 'contact' => [ 'email' => '   ' ] ] );
		$this->assertSame( 'info@elevationmanchester.org', Settings::get( $s, 'contact.email' ) );
	}

	public function test_optional_value_may_be_blank(): void {
		$s = Settings::resolve( [ 'service' => [ 'doorsOpen' => '' ] ] );
		$this->assertSame( '', Settings::get( $s, 'service.doorsOpen' ) );
	}

	public function test_unknown_stored_keys_are_ignored(): void {
		$s = Settings::resolve( [ 'service' => [ 'bogus' => 'x' ], 'nope' => [ 'a' => 'b' ] ] );
		$this->assertNull( Settings::get( $s, 'service.bogus' ) );
		$this->assertNull( Settings::get( $s, 'nope.a' ) );
	}

	public function test_derived_location_values(): void {
		$s = Settings::resolve( [] );
		$this->assertSame(
			'Mary Seacole Building, University of Salford, Manchester M6 6PU',
			Settings::get( $s, 'location.full' )
		);
		$this->assertSame(
			'https://www.google.com/maps/search/?api=1&query=Mary%20Seacole%20Building%2C%20University%20of%20Salford%2C%20M6%206PU',
			Settings::get( $s, 'location.mapsUrl' )
		);
		$this->assertSame(
			'https://www.google.com/maps?q=Mary%20Seacole%20Building%2C%20University%20of%20Salford%2C%20M6%206PU&output=embed',
			Settings::get( $s, 'location.embedUrl' )
		);
	}

	public function test_prayer_inbox_falls_back_to_contact_email(): void {
		$s = Settings::resolve( [ 'contact' => [ 'email' => 'hello@example.org' ] ] );
		$this->assertSame( 'hello@example.org', Settings::get( $s, 'contact.prayerInbox' ) );

		$s = Settings::resolve( [ 'contact' => [ 'prayerInbox' => 'pastors@example.org' ] ] );
		$this->assertSame( 'pastors@example.org', Settings::get( $s, 'contact.prayerInbox' ) );
	}

	public function test_get_returns_branches_and_null_for_missing(): void {
		$s = Settings::resolve( [] );
		$this->assertIsArray( Settings::get( $s, 'socials' ) );
		$this->assertNull( Settings::get( $s, 'service.nothing' ) );
		$this->assertNull( Settings::get( $s, '' ) );
	}

	public function test_flatten_and_unflatten_round_trip(): void {
		$tree = [ 'a' => [ 'b' => 'x', 'c' => [ 'd' => 'y' ] ], 'e' => 'z' ];
		$flat = Settings::flatten( $tree );
		$this->assertSame( [ 'a.b' => 'x', 'a.c.d' => 'y', 'e' => 'z' ], $flat );
		$this->assertSame( $tree, Settings::unflatten( $flat ) );
	}

	public function test_public_values_exclude_secrets(): void {
		$s   = Settings::resolve( [ 'youtube' => [ 'apiKey' => 'SECRET' ] ] );
		$pub = Settings::publicValues( $s );
		$this->assertArrayNotHasKey( 'youtube.apiKey', $pub );
		$this->assertSame( 'TheElevationChurchManchester', $pub['youtube.channelHandle'] );
		$this->assertSame( '10:30am', $pub['service.startTime'] );
	}
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `docker compose run --rm composer vendor/bin/phpunit`
Expected: FAIL with `Class "Elevation\Core\Settings" not found`.

- [ ] **Step 4: Implement `src/Settings.php`**

```php
<?php
namespace Elevation\Core;

/**
 * Church Settings: defaults (from the redesign's src/lib/church.ts), merge rules and derived values.
 * Pure — no WordPress calls — so it can be unit-tested.
 */
final class Settings {

	public const OPTION      = 'elevation_settings';
	public const SECRET_KEYS = [ 'youtube.apiKey' ];

	public static function defaults(): array {
		return [
			'church'    => [
				'name'             => 'Elevation Church Manchester',
				'legalName'        => 'The Elevation Church UK',
				'shortName'        => 'TEC Manchester',
				'tagline'          => 'Making Greatness Common',
				'mission'          => 'To empower you to achieve the highest level of distinction and greatness in life, serving God and humanity with passion.',
				'bedrockReference' => 'Matthew 23:11',
				'bedrockText'      => 'He who is greatest among you shall be your servant.',
				'launched'         => '1 May 2023',
				'charityNumber'    => '1195403',
			],
			'service'   => [
				'day'       => 'Sunday',
				'startTime' => '10:30am',
				'doorsOpen' => '',
			],
			'location'  => [
				'venue'     => 'Mary Seacole Building',
				'campus'    => 'University of Salford',
				'city'      => 'Manchester',
				'postcode'  => 'M6 6PU',
				'country'   => 'United Kingdom',
				'mapsQuery' => 'Mary Seacole Building, University of Salford, M6 6PU',
			],
			'contact'   => [
				'email'        => 'info@elevationmanchester.org',
				'phoneLabel'   => '07469 062220',
				'phoneTel'     => '+447469062220',
				'prayerInbox'  => '',
				'welcomeInbox' => 'info@elevationmanchester.org',
			],
			'socials'   => [
				'youtube'   => [ 'name' => 'YouTube', 'handle' => '@TheElevationChurchManchester', 'url' => 'https://www.youtube.com/@TheElevationChurchManchester' ],
				'instagram' => [ 'name' => 'Instagram', 'handle' => '@elevationmanchester', 'url' => 'https://www.instagram.com/elevationmanchester/' ],
				'facebook'  => [ 'name' => 'Facebook', 'handle' => '@elevationmanchester', 'url' => 'https://www.facebook.com/elevationmanchester' ],
				'x'         => [ 'name' => 'X', 'handle' => '@elevationmanche', 'url' => 'https://x.com/elevationmanche' ],
			],
			'giving'    => [
				'paypalUrl'         => 'https://www.paypal.com/donate/?hosted_button_id=L3ZEPY5K8QV6Y&source=qr',
				'bankAccountName'   => 'The Elevation Church UK MAN',
				'bankAccountNumber' => '49654219',
				'bankSortCode'      => '23-05-80',
				'chequePayableTo'   => 'The Elevation Church UK',
			],
			'analytics' => [
				'ga4MeasurementId' => 'G-0Q3764FCYN',
			],
			'youtube'   => [
				'channelHandle' => 'TheElevationChurchManchester',
				'apiKey'        => '',
			],
		];
	}

	/** Merge stored values over defaults, then add derived values. */
	public static function resolve( array $stored ): array {
		$settings = self::merge( self::defaults(), $stored );

		$loc = $settings['location'];
		$settings['location']['full']     = sprintf( '%s, %s, %s %s', $loc['venue'], $loc['campus'], $loc['city'], $loc['postcode'] );
		$settings['location']['mapsUrl']  = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode( $loc['mapsQuery'] );
		$settings['location']['embedUrl'] = 'https://www.google.com/maps?q=' . rawurlencode( $loc['mapsQuery'] ) . '&output=embed';

		if ( '' === $settings['contact']['prayerInbox'] ) {
			$settings['contact']['prayerInbox'] = $settings['contact']['email'];
		}
		return $settings;
	}

	/**
	 * Only keys present in $defaults survive. A blank stored string falls back to a non-blank
	 * default, so a required value can't be cleared by accident. Keys whose default is '' are optional.
	 */
	private static function merge( array $defaults, array $stored ): array {
		$out = [];
		foreach ( $defaults as $key => $default ) {
			$value = $stored[ $key ] ?? null;
			if ( is_array( $default ) ) {
				$out[ $key ] = self::merge( $default, is_array( $value ) ? $value : [] );
			} elseif ( is_scalar( $value ) && ( '' !== trim( (string) $value ) || '' === $default ) ) {
				$out[ $key ] = trim( (string) $value );
			} else {
				$out[ $key ] = $default;
			}
		}
		return $out;
	}

	public static function get( array $settings, string $key ): mixed {
		if ( '' === $key ) {
			return null;
		}
		$node = $settings;
		foreach ( explode( '.', $key ) as $part ) {
			if ( ! is_array( $node ) || ! array_key_exists( $part, $node ) ) {
				return null;
			}
			$node = $node[ $part ];
		}
		return $node;
	}

	/** @return array<string, scalar> */
	public static function flatten( array $tree, string $prefix = '' ): array {
		$flat = [];
		foreach ( $tree as $key => $value ) {
			$path = '' === $prefix ? (string) $key : $prefix . '.' . $key;
			if ( is_array( $value ) ) {
				$flat += self::flatten( $value, $path );
			} else {
				$flat[ $path ] = $value;
			}
		}
		return $flat;
	}

	public static function unflatten( array $flat ): array {
		$tree = [];
		foreach ( $flat as $path => $value ) {
			$node = &$tree;
			foreach ( explode( '.', (string) $path ) as $part ) {
				if ( ! isset( $node[ $part ] ) || ! is_array( $node[ $part ] ) ) {
					$node[ $part ] = [];
				}
				$node = &$node[ $part ];
			}
			$node = $value;
			unset( $node );
		}
		return $tree;
	}

	/** @return array<string, scalar> Every scalar setting except secrets, keyed by dotted path. */
	public static function publicValues( array $settings ): array {
		return array_diff_key( self::flatten( $settings ), array_flip( self::SECRET_KEYS ) );
	}
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `docker compose run --rm composer vendor/bin/phpunit`
Expected: `OK (10 tests, ...)`.

- [ ] **Step 6: Commit**

```bash
git add wp-content/plugins/elevation-core
git commit -m "Add elevation-core with Church Settings defaults, merge rules and derived values

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `Tokens` and `SeedGuard`

**Files:**
- Create: `wp-content/plugins/elevation-core/src/Tokens.php`, `src/SeedGuard.php`, `tests/TokensTest.php`, `tests/SeedGuardTest.php`

**Interfaces:**
- Produces:
  - `Elevation\Core\Tokens::replace(string $html, callable $lookup): string`. `$lookup(string $key): ?scalar`
    returns `null` for unknown keys; the token is then left as written. Values are escaped with
    `ENT_QUOTES`.
  - `Elevation\Core\SeedGuard::hash(string $content): string` (sha1 after normalising line endings
    and trimming).
  - `SeedGuard::decide(?string $storedHash, ?string $currentContent, string $newContent, bool $force): string`,
    which returns one of `SeedGuard::CREATE`, `UPDATE`, `UNCHANGED` or `SKIP`.

- [ ] **Step 1: Write the failing tests**

`tests/TokensTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\Tokens;
use PHPUnit\Framework\TestCase;

final class TokensTest extends TestCase {

	private function lookup( array $values ): callable {
		return static fn ( string $key ) => $values[ $key ] ?? null;
	}

	public function test_replaces_known_tokens(): void {
		$out = Tokens::replace(
			'<p>{service.day}s at {service.startTime}</p>',
			$this->lookup( [ 'service.day' => 'Sunday', 'service.startTime' => '10:30am' ] )
		);
		$this->assertSame( '<p>Sundays at 10:30am</p>', $out );
	}

	public function test_escapes_html_in_values(): void {
		$out = Tokens::replace( '<p>{location.venue}</p>', $this->lookup( [ 'location.venue' => "Mary's <Hall> & \"Co\"" ] ) );
		$this->assertSame( '<p>Mary&#039;s &lt;Hall&gt; &amp; &quot;Co&quot;</p>', $out );
	}

	public function test_replaces_inside_attributes(): void {
		$out = Tokens::replace( '<a href="mailto:{contact.email}">x</a>', $this->lookup( [ 'contact.email' => 'info@example.org' ] ) );
		$this->assertSame( '<a href="mailto:info@example.org">x</a>', $out );
	}

	public function test_unknown_key_is_left_as_written(): void {
		$out = Tokens::replace( '<p>{service.statTime}</p>', $this->lookup( [ 'service.startTime' => '10:30am' ] ) );
		$this->assertSame( '<p>{service.statTime}</p>', $out );
	}

	public function test_non_token_braces_are_untouched(): void {
		$html = '<style>a{color:red}</style><script>var o={a:1};</script><p>{notatoken}</p>';
		$this->assertSame( $html, Tokens::replace( $html, $this->lookup( [] ) ) );
	}

	public function test_numeric_values_are_stringified(): void {
		$out = Tokens::replace( '{site.year}', $this->lookup( [ 'site.year' => 2026 ] ) );
		$this->assertSame( '2026', $out );
	}
}
```

`tests/SeedGuardTest.php`:

```php
<?php
namespace Elevation\Core\Tests;

use Elevation\Core\SeedGuard;
use PHPUnit\Framework\TestCase;

final class SeedGuardTest extends TestCase {

	public function test_missing_post_is_created(): void {
		$this->assertSame( SeedGuard::CREATE, SeedGuard::decide( null, null, 'new', false ) );
	}

	public function test_identical_content_is_unchanged(): void {
		$h = SeedGuard::hash( 'same' );
		$this->assertSame( SeedGuard::UNCHANGED, SeedGuard::decide( $h, 'same', 'same', false ) );
	}

	public function test_untouched_post_is_updated(): void {
		$h = SeedGuard::hash( 'v1' );
		$this->assertSame( SeedGuard::UPDATE, SeedGuard::decide( $h, 'v1', 'v2', false ) );
	}

	public function test_hand_edited_post_is_skipped(): void {
		$h = SeedGuard::hash( 'v1' );
		$this->assertSame( SeedGuard::SKIP, SeedGuard::decide( $h, 'v1 edited in wp-admin', 'v2', false ) );
	}

	public function test_existing_post_never_seeded_is_skipped(): void {
		$this->assertSame( SeedGuard::SKIP, SeedGuard::decide( null, 'someone else wrote this', 'v2', false ) );
	}

	public function test_force_overwrites_a_hand_edit(): void {
		$h = SeedGuard::hash( 'v1' );
		$this->assertSame( SeedGuard::UPDATE, SeedGuard::decide( $h, 'edited', 'v2', true ) );
	}

	public function test_force_with_identical_content_is_unchanged(): void {
		$this->assertSame( SeedGuard::UNCHANGED, SeedGuard::decide( null, 'same', 'same', true ) );
	}

	public function test_hash_ignores_line_endings_and_outer_whitespace(): void {
		$this->assertSame( SeedGuard::hash( "a\nb" ), SeedGuard::hash( "  a\r\nb\n" ) );
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `docker compose run --rm composer vendor/bin/phpunit`
Expected: FAIL with `Class "Elevation\Core\Tokens" not found` and `Class "Elevation\Core\SeedGuard" not found`.

- [ ] **Step 3: Implement `src/Tokens.php`**

```php
<?php
namespace Elevation\Core;

/**
 * Inline settings tokens: "{service.startTime}" in any rendered block becomes the setting's value.
 * Only keys the lookup knows are replaced, so CSS/JS braces and typos pass through untouched.
 */
final class Tokens {

	private const PATTERN = '/\{([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)\}/';

	/** @param callable(string): (string|int|float|bool|null) $lookup */
	public static function replace( string $html, callable $lookup ): string {
		if ( ! str_contains( $html, '{' ) ) {
			return $html;
		}
		return preg_replace_callback(
			self::PATTERN,
			static function ( array $m ) use ( $lookup ): string {
				$value = $lookup( $m[1] );
				if ( null === $value || ! is_scalar( $value ) ) {
					return $m[0];
				}
				return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' );
			},
			$html
		) ?? $html;
	}
}
```

- [ ] **Step 4: Implement `src/SeedGuard.php`**

```php
<?php
namespace Elevation\Core;

/**
 * Decides what the seed may do to a post. A post whose content no longer matches the hash stored
 * when it was last seeded has been edited by hand, and is left alone unless forced.
 */
final class SeedGuard {

	public const CREATE    = 'create';
	public const UPDATE    = 'update';
	public const UNCHANGED = 'unchanged';
	public const SKIP      = 'skip';

	public static function hash( string $content ): string {
		return sha1( trim( str_replace( "\r\n", "\n", $content ) ) );
	}

	public static function decide( ?string $storedHash, ?string $currentContent, string $newContent, bool $force ): string {
		if ( null === $currentContent ) {
			return self::CREATE;
		}
		$current = self::hash( $currentContent );
		if ( $current === self::hash( $newContent ) ) {
			return self::UNCHANGED;
		}
		if ( $force ) {
			return self::UPDATE;
		}
		return ( null !== $storedHash && $storedHash === $current ) ? self::UPDATE : self::SKIP;
	}
}
```

Add both classes to the plugin bootstrap, after the `Settings.php` require in `elevation-core.php`:

```php
require_once ELEVATION_CORE_DIR . 'src/Tokens.php';
require_once ELEVATION_CORE_DIR . 'src/SeedGuard.php';
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `docker compose run --rm composer vendor/bin/phpunit`
Expected: `OK (24 tests, ...)`.

- [ ] **Step 6: Commit**

```bash
git add wp-content/plugins/elevation-core
git commit -m "Add settings token replacement and the seed hash guard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Settings in WordPress — helpers, bindings, tokens, roles, admin screen

**Files:**
- Create: `wp-content/plugins/elevation-core/includes/settings.php`, `includes/bindings.php`, `includes/roles.php`, `includes/settings-page.php`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`

**Interfaces:**
- Consumes: `Settings::resolve/get/publicValues/flatten/unflatten/defaults`, `Tokens::replace`.
- Produces:
  - `elevation_settings(): array` (resolved, plus `site.year`)
  - `elevation_setting(string $key): mixed`
  - `elevation_public_setting(string $key): string|int|float|bool|null`, which returns `null` for
    secrets and unknown keys
  - Block Bindings source `elevation/settings` with args `{ "key": "<dotted>" }`
  - A `render_block` filter that applies tokens to all blocks
  - Capability `manage_church_settings`; role `site_manager` ("Site Manager")
  - Admin screen Settings → Church (`options-general.php?page=elevation-church`)

- [ ] **Step 1: Write `includes/settings.php`**

```php
<?php
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

/** Resolved Church Settings for this request, plus request-time values like the year. */
function elevation_settings(): array {
	static $cache = null;
	if ( null === $cache ) {
		$stored            = get_option( Settings::OPTION, [] );
		$cache             = Settings::resolve( is_array( $stored ) ? $stored : [] );
		$cache['site']     = [ 'year' => (int) wp_date( 'Y' ) ];
	}
	return $cache;
}

function elevation_setting( string $key ): mixed {
	return Settings::get( elevation_settings(), $key );
}

/** Scalar, non-secret setting for public output (tokens and bindings); null otherwise. */
function elevation_public_setting( string $key ): string|int|float|bool|null {
	static $public = null;
	$public ??= Settings::publicValues( elevation_settings() );
	return $public[ $key ] ?? null;
}
```

- [ ] **Step 2: Write `includes/bindings.php`**

```php
<?php
use Elevation\Core\Tokens;

defined( 'ABSPATH' ) || exit;

// Whole-element bindings: a paragraph, heading or button whose content is one setting.
add_action( 'init', function () {
	register_block_bindings_source( 'elevation/settings', [
		'label'              => __( 'Church Settings', 'elevation-core' ),
		'get_value_callback' => function ( array $args ) {
			$value = elevation_public_setting( (string) ( $args['key'] ?? '' ) );
			return null === $value ? null : esc_html( (string) $value );
		},
	] );
} );

// Inline tokens inside ordinary text and attributes, e.g. "Sundays at {service.startTime}".
add_filter( 'render_block', function ( string $html ): string {
	return Tokens::replace( $html, 'elevation_public_setting' );
}, 20 );
```

- [ ] **Step 3: Write `includes/roles.php`**

```php
<?php
defined( 'ABSPATH' ) || exit;

const ELEVATION_ROLES_VERSION = '1';

/** Site Manager = Editor + Church Settings + menus/Site Editor, without core site settings. */
function elevation_install_roles(): void {
	get_role( 'administrator' )?->add_cap( 'manage_church_settings' );

	$caps = get_role( 'editor' )?->capabilities ?? [];
	$caps['manage_church_settings'] = true;
	$caps['edit_theme_options']     = true;

	remove_role( 'site_manager' );
	add_role( 'site_manager', __( 'Site Manager', 'elevation-core' ), $caps );
	update_option( 'elevation_roles_version', ELEVATION_ROLES_VERSION );
}

add_action( 'init', function () {
	if ( get_option( 'elevation_roles_version' ) !== ELEVATION_ROLES_VERSION ) {
		elevation_install_roles();
	}
} );
```

- [ ] **Step 4: Write `includes/settings-page.php`**

```php
<?php
use Elevation\Core\Settings;

defined( 'ABSPATH' ) || exit;

const ELEVATION_SETTINGS_PAGE = 'elevation-church';

/** Fields shown as a textarea rather than a one-line input. */
const ELEVATION_SETTINGS_TEXTAREAS = [ 'church.mission', 'church.bedrockText' ];

add_action( 'admin_init', function () {
	register_setting( ELEVATION_SETTINGS_PAGE, Settings::OPTION, [
		'type'              => 'array',
		'sanitize_callback' => 'elevation_sanitize_settings',
		'default'           => [],
	] );
} );

// options.php checks manage_options by default; Site Managers don't have it.
add_filter( 'option_page_capability_' . ELEVATION_SETTINGS_PAGE, fn () => 'manage_church_settings' );

add_action( 'admin_menu', function () {
	add_options_page(
		__( 'Church Settings', 'elevation-core' ),
		__( 'Church', 'elevation-core' ),
		'manage_church_settings',
		ELEVATION_SETTINGS_PAGE,
		'elevation_render_settings_page'
	);
} );

// Settings → Church is under the Settings menu, which Site Managers otherwise can't see.
add_action( 'admin_menu', function () {
	if ( current_user_can( 'manage_church_settings' ) && ! current_user_can( 'manage_options' ) ) {
		add_menu_page( __( 'Church Settings', 'elevation-core' ), __( 'Church', 'elevation-core' ),
			'manage_church_settings', ELEVATION_SETTINGS_PAGE, 'elevation_render_settings_page', 'dashicons-building', 80 );
	}
}, 11 );

/** Keep only known keys; clean each by what it holds. Blank values fall back at read time. */
function elevation_sanitize_settings( $input ): array {
	$input   = is_array( $input ) ? Settings::flatten( wp_unslash( $input ) ) : [];
	$allowed = Settings::flatten( Settings::defaults() );
	$clean   = [];
	foreach ( $allowed as $key => $default ) {
		if ( ! array_key_exists( $key, $input ) ) {
			continue;
		}
		$value = (string) $input[ $key ];
		if ( preg_match( '/(email|Inbox)$/', $key ) ) {
			$clean[ $key ] = sanitize_email( $value );
		} elseif ( preg_match( '/(url|Url)$/', $key ) ) {
			$clean[ $key ] = esc_url_raw( $value );
		} elseif ( in_array( $key, ELEVATION_SETTINGS_TEXTAREAS, true ) ) {
			$clean[ $key ] = sanitize_textarea_field( $value );
		} else {
			$clean[ $key ] = sanitize_text_field( $value );
		}
	}
	return Settings::unflatten( $clean );
}

function elevation_settings_label( string $key ): string {
	$last = substr( $key, strrpos( $key, '.' ) + 1 );
	return ucfirst( strtolower( trim( preg_replace( '/([A-Z0-9]+)/', ' $1', $last ) ) ) );
}

function elevation_render_settings_page(): void {
	if ( ! current_user_can( 'manage_church_settings' ) ) {
		return;
	}
	$stored = get_option( Settings::OPTION, [] );
	$stored = Settings::flatten( is_array( $stored ) ? $stored : [] );
	$groups = [];
	foreach ( Settings::flatten( Settings::defaults() ) as $key => $default ) {
		$groups[ strtok( $key, '.' ) ][ $key ] = $default;
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Church Settings', 'elevation-core' ); ?></h1>
		<p><?php esc_html_e( 'These details appear across the website. Leave a field blank to use the default shown.', 'elevation-core' ); ?></p>
		<form method="post" action="options.php">
			<?php settings_fields( ELEVATION_SETTINGS_PAGE ); ?>
			<?php foreach ( $groups as $group => $fields ) : ?>
				<h2><?php echo esc_html( ucfirst( $group ) ); ?></h2>
				<table class="form-table" role="presentation">
					<?php foreach ( $fields as $key => $default ) :
						$name  = Settings::OPTION . '[' . str_replace( '.', '][', $key ) . ']';
						$id    = 'elevation-' . str_replace( '.', '-', $key );
						$value = $stored[ $key ] ?? '';
						$type  = preg_match( '/(email|Inbox)$/', $key ) ? 'email' : ( preg_match( '/(url|Url)$/', $key ) ? 'url' : 'text' );
						if ( 'youtube.apiKey' === $key ) {
							$type = 'password';
						}
						?>
						<tr>
							<th scope="row"><label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( elevation_settings_label( $key ) ); ?></label></th>
							<td>
								<?php if ( in_array( $key, ELEVATION_SETTINGS_TEXTAREAS, true ) ) : ?>
									<textarea class="large-text" rows="3" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" placeholder="<?php echo esc_attr( $default ); ?>"><?php echo esc_textarea( $value ); ?></textarea>
								<?php else : ?>
									<input class="regular-text" type="<?php echo esc_attr( $type ); ?>" id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" placeholder="<?php echo esc_attr( 'password' === $type ? '' : $default ); ?>" autocomplete="off">
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				</table>
			<?php endforeach; ?>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

// Resolved settings are cached per request; nothing to clear across requests.
```

- [ ] **Step 5: Wire the files into the bootstrap**

Append to `elevation-core.php`:

```php
require_once ELEVATION_CORE_DIR . 'includes/settings.php';
require_once ELEVATION_CORE_DIR . 'includes/bindings.php';
require_once ELEVATION_CORE_DIR . 'includes/roles.php';
require_once ELEVATION_CORE_DIR . 'includes/settings-page.php';

register_activation_hook( __FILE__, 'elevation_install_roles' );
```

- [ ] **Step 6: Verify in WordPress**

```bash
wp() { docker compose run --rm -T wpcli wp "$@"; }
wp plugin activate elevation-core
wp eval 'echo elevation_setting("location.full"), "\n", var_export(elevation_public_setting("youtube.apiKey"), true), "\n";'
wp eval 'echo do_blocks("<!-- wp:paragraph --><p>{service.day}s at {service.startTime}, {service.statTime}</p><!-- /wp:paragraph -->");'
wp eval 'echo do_blocks("<!-- wp:paragraph {\"metadata\":{\"bindings\":{\"content\":{\"source\":\"elevation/settings\",\"args\":{\"key\":\"contact.email\"}}}}} --><p>x</p><!-- /wp:paragraph -->");'
wp user create smtest sm@example.test --role=site_manager --user_pass="$(openssl rand -hex 12)"
wp eval --user=smtest 'var_dump(current_user_can("manage_church_settings"), current_user_can("edit_theme_options"), current_user_can("manage_options"));'
wp option update elevation_settings '{"service":{"startTime":"11:00am"},"contact":{"email":""}}' --format=json
wp eval 'echo elevation_setting("service.startTime"), " ", elevation_setting("contact.email"), "\n";'
wp option delete elevation_settings
wp user delete smtest --yes
```

Expected, in order:
- `Mary Seacole Building, University of Salford, Manchester M6 6PU` and `NULL`
- `<p>Sundays at 10:30am, {service.statTime}</p>`
- `<p>info@elevationmanchester.org</p>`
- `bool(true) bool(true) bool(false)`
- `11:00am info@elevationmanchester.org`

- [ ] **Step 7: Verify the admin screen as a Site Manager**

In the browser at http://localhost:8080/wp-admin (logged in as the `.env` admin), open
Settings → Church. It should show groups Church, Service, Location, Contact, Socials, Giving,
Analytics, Youtube, with the defaults as placeholders. Change "Start time" to `11:15am`, save, and
confirm the field shows `11:15am`. Then clear it and save again.

Then run `wp user create smtest2 sm2@example.test --role=site_manager --user_pass=<a generated password>`
and log in as that user in a private window. The **Church** menu item should appear. Saving
should work, and `options-general.php` should say "Sorry, you are not allowed to access this
page." Delete the user afterwards.

- [ ] **Step 8: Commit**

```bash
git add wp-content/plugins/elevation-core
git commit -m "Add Church Settings screen, bindings source, inline tokens and the Site Manager role

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Block build pipeline and the `social-links` block

**Files:**
- Create: `wp-content/plugins/elevation-core/package.json` (and the generated `package-lock.json`), `src/blocks/social-links/{block.json,index.js,render.php,style.css}`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`
- Generated and committed: `build/blocks/social-links/*`

**Interfaces:**
- Consumes: `elevation_setting('socials')`, `elevation_setting('church.shortName')`.
- Produces: the block `elevation/social-links` (no attributes), and the convention that every
  `build/blocks/*/block.json` is registered automatically.

- [ ] **Step 1: Write `package.json` and install `@wordpress/scripts`**

```json
{
  "name": "elevation-core",
  "private": true,
  "scripts": {
    "build": "wp-scripts build --webpack-src-dir=src/blocks --output-path=build/blocks --webpack-copy-php",
    "start": "wp-scripts start --webpack-src-dir=src/blocks --output-path=build/blocks --webpack-copy-php"
  }
}
```

Run: `docker compose run --rm node npm install --save-dev --save-exact @wordpress/scripts`
Expected: `package.json` gains an exact `@wordpress/scripts` version and `package-lock.json` is created.

- [ ] **Step 2: Write the block**

`src/blocks/social-links/block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "elevation/social-links",
  "title": "Church social links",
  "category": "widgets",
  "icon": "share",
  "description": "Icon links to the church's social accounts, taken from Church Settings.",
  "supports": { "html": false },
  "textdomain": "elevation-core",
  "editorScript": "file:./index.js",
  "style": "file:./style-index.css",
  "render": "file:./render.php"
}
```

`src/blocks/social-links/index.js`:

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './style.css';

registerBlockType( metadata.name, {
	edit: () => (
		<div { ...useBlockProps() }>
			<ServerSideRender block={ metadata.name } />
		</div>
	),
} );
```

`src/blocks/social-links/render.php`:

```php
<?php
/**
 * Social icon links from Church Settings. Brand paths are the redesign's (src/components/social-icons.tsx).
 */
defined( 'ABSPATH' ) || exit;

$elevation_icons = [
	'youtube'   => 'M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.5 15.5v-7l6.5 3.5z',
	'instagram' => 'M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.1 15.6 2.1 15.2 2.1 12s0-3.6.1-4.9C2.3 3.9 3.9 2.3 7.1 2.2 8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1018.6 12 6.6 6.6 0 0012 5.4zm0 10.9A4.3 4.3 0 1116.3 12 4.3 4.3 0 0112 16.3zm6.8-11.1a1.5 1.5 0 11-1.5-1.5 1.5 1.5 0 011.5 1.5z',
	'facebook'  => 'M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z',
	'x'         => 'M18.9 2H22l-6.8 7.8L23 22h-6.6l-4.6-6-5.3 6H2.4l7.1-8.1L1.7 2h6.7l4.3 5.7zm-1.1 18h1.7L6.4 3.7H4.6z',
];
$elevation_church  = (string) elevation_setting( 'church.shortName' );
$elevation_socials = (array) elevation_setting( 'socials' );
?>
<ul <?php echo get_block_wrapper_attributes( [ 'class' => 'social-links' ] ); ?>>
	<?php foreach ( $elevation_socials as $elevation_key => $elevation_social ) :
		if ( empty( $elevation_social['url'] ) || empty( $elevation_icons[ $elevation_key ] ) ) {
			continue;
		}
		?>
		<li>
			<a href="<?php echo esc_url( $elevation_social['url'] ); ?>" target="_blank" rel="noreferrer"
				aria-label="<?php echo esc_attr( sprintf( '%s on %s', $elevation_church, $elevation_social['name'] ) ); ?>">
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="<?php echo esc_attr( $elevation_icons[ $elevation_key ] ); ?>"/></svg>
			</a>
		</li>
	<?php endforeach; ?>
</ul>
```

`src/blocks/social-links/style.css`:

```css
.social-links {
	display: flex;
	gap: 10px;
	list-style: none;
	margin: 0;
	padding: 0;
}
.social-links a {
	display: grid;
	place-items: center;
	width: 40px;
	height: 40px;
	border-radius: 11px;
	background: rgb(255 255 255 / 0.06);
	color: #fff;
	transition: background-color 0.2s ease, color 0.2s ease;
}
.social-links a:hover,
.social-links a:focus-visible {
	background: var(--wp--preset--color--green);
	color: var(--wp--preset--color--ink);
}
.social-links svg {
	width: 18px;
	height: 18px;
}
```

- [ ] **Step 3: Register every built block**

Append to `elevation-core.php`:

```php
// Every compiled block in build/blocks/ registers itself from its block.json.
add_action( 'init', function () {
	foreach ( glob( ELEVATION_CORE_DIR . 'build/blocks/*/block.json' ) as $block_json ) {
		register_block_type( dirname( $block_json ) );
	}
} );
```

- [ ] **Step 4: Build and verify**

```bash
docker compose run --rm node npm run build
ls wp-content/plugins/elevation-core/build/blocks/social-links
docker compose run --rm -T wpcli wp eval 'echo render_block( [ "blockName" => "elevation/social-links", "attrs" => [], "innerBlocks" => [], "innerHTML" => "", "innerContent" => [] ] );'
```

Expected:
- The `ls` lists `block.json`, `index.js`, `index.asset.php`, `render.php`, `style-index.css`.
- The eval prints a `<ul class="wp-block-elevation-social-links social-links">` containing 4
  links, including `aria-label="TEC Manchester on YouTube"`.

- [ ] **Step 5: Commit**

```bash
git add wp-content/plugins/elevation-core
git commit -m "Add the block build pipeline and the social-links block

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `elevation` theme — tokens, fonts, block styles, templates

**Files:**
- Create: `wp-content/themes/elevation/{style.css,functions.php,theme.json}`, `assets/fonts/*`, `assets/images/logo-colour.png`, `assets/images/logo-white.png`, `assets/css/site.css`, `templates/{index,page,front-page,404}.html`, `parts/header.html` and `parts/footer.html` (placeholders, completed in Tasks 7–8)

**Interfaces:**
- Produces:
  - Preset slugs used by every later plan: colours `green`, `green-600`, `green-100`, `ink`,
    `ink-800`, `grey-50`, `grey-100`, `grey-300`, `grey-500`, `grey-700`, `white`; fonts `inter`,
    `sora`; font sizes `x-small` (12px), `small` (14px), `card` (15px), `medium` (18px), `large`
    (20px), `x-large` (24px), `section`, `page-hero`, `hero`; spacing `10`–`60` (`60` = section
    padding); shadows `card`, `card-lg`.
  - Block styles: `core/button` → `navy`, `ghost`, `ghost-on-dark`; `core/paragraph` → `eyebrow`,
    `eyebrow-on-ink`; `core/group` → `card`, `card-ink`, `strip-green`; `core/image` →
    `rounded-2xl`.
  - Utility class `is-size-lg` on `core/button` for the large size.
  - The `<main id="main">` wrapper in every template.

- [ ] **Step 1: Fetch fonts and logos**

```bash
T=wp-content/themes/elevation
mkdir -p $T/assets/fonts $T/assets/images $T/assets/css $T/assets/js $T/templates $T/parts $T/patterns
curl -fsSL -o $T/assets/fonts/inter-latin-wght.woff2 "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2"
curl -fsSL -o $T/assets/fonts/sora-latin-wght.woff2  "https://cdn.jsdelivr.net/fontsource/fonts/sora:vf@latest/latin-wght-normal.woff2"
curl -fsSL -o $T/assets/fonts/OFL.txt "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt"
cp ~/Projects.nosync/website/public/brand/logo-colour.png ~/Projects.nosync/website/public/brand/logo-white.png $T/assets/images/
file $T/assets/fonts/*.woff2
```

Expected: both fonts report `Web Open Font Format (Version 2)`.

- [ ] **Step 2: Write `style.css` and `functions.php`**

`style.css`:

```css
/*
Theme Name: Elevation
Description: Block theme for Elevation Church Manchester, from the 2026 redesign.
Version: 0.1.0
Requires at least: 7.1
Requires PHP: 8.3
Text Domain: elevation
*/
```

`functions.php`:

```php
<?php
defined( 'ABSPATH' ) || exit;

const ELEVATION_THEME_VERSION = '0.1.0';

add_action( 'after_setup_theme', function () {
	add_editor_style( 'assets/css/site.css' );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'elevation-site', get_theme_file_uri( 'assets/css/site.css' ), [], ELEVATION_THEME_VERSION );
	wp_enqueue_script( 'elevation-header', get_theme_file_uri( 'assets/js/header.js' ), [], ELEVATION_THEME_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
} );

add_action( 'init', function () {
	$styles = [
		'core/button'    => [ 'navy' => 'Navy', 'ghost' => 'Ghost', 'ghost-on-dark' => 'Ghost on dark' ],
		'core/paragraph' => [ 'eyebrow' => 'Eyebrow', 'eyebrow-on-ink' => 'Eyebrow on dark' ],
		'core/group'     => [ 'card' => 'Card', 'card-ink' => 'Card on dark', 'strip-green' => 'Green strip' ],
		'core/image'     => [ 'rounded-2xl' => 'Rounded' ],
	];
	foreach ( $styles as $block => $variants ) {
		foreach ( $variants as $name => $label ) {
			register_block_style( $block, [ 'name' => $name, 'label' => $label ] );
		}
	}
	register_block_pattern_category( 'elevation', [ 'label' => __( 'Elevation', 'elevation' ) ] );
} );
```

- [ ] **Step 3: Write `theme.json`**

```json
{
  "$schema": "https://schemas.wp.org/trunk/theme.json",
  "version": 3,
  "settings": {
    "appearanceTools": true,
    "useRootPaddingAwareAlignments": true,
    "layout": { "contentSize": "760px", "wideSize": "1240px" },
    "color": {
      "custom": false,
      "customGradient": false,
      "customDuotone": false,
      "defaultPalette": false,
      "defaultGradients": false,
      "defaultDuotone": false,
      "palette": [
        { "slug": "green", "color": "#84C224", "name": "Green (fills only)" },
        { "slug": "green-600", "color": "#6FA61C", "name": "Green text" },
        { "slug": "green-100", "color": "#EAF6D6", "name": "Green tint" },
        { "slug": "ink", "color": "#0E0E2C", "name": "Ink" },
        { "slug": "ink-800", "color": "#1B1F29", "name": "Ink 800" },
        { "slug": "grey-50", "color": "#F7F8F5", "name": "Grey 50" },
        { "slug": "grey-100", "color": "#F1F1EF", "name": "Grey 100" },
        { "slug": "grey-300", "color": "#D7D9D6", "name": "Grey 300" },
        { "slug": "grey-500", "color": "#676767", "name": "Grey 500" },
        { "slug": "grey-700", "color": "#4B4F58", "name": "Grey 700" },
        { "slug": "white", "color": "#FFFFFF", "name": "White" }
      ]
    },
    "typography": {
      "customFontSize": false,
      "defaultFontSizes": false,
      "fluid": false,
      "fontFamilies": [
        {
          "slug": "inter",
          "name": "Inter",
          "fontFamily": "Inter, ui-sans-serif, system-ui, sans-serif",
          "fontFace": [
            { "fontFamily": "Inter", "fontStyle": "normal", "fontWeight": "100 900", "fontDisplay": "swap", "src": [ "file:./assets/fonts/inter-latin-wght.woff2" ] }
          ]
        },
        {
          "slug": "sora",
          "name": "Sora",
          "fontFamily": "Sora, ui-sans-serif, system-ui, sans-serif",
          "fontFace": [
            { "fontFamily": "Sora", "fontStyle": "normal", "fontWeight": "100 800", "fontDisplay": "swap", "src": [ "file:./assets/fonts/sora-latin-wght.woff2" ] }
          ]
        }
      ],
      "fontSizes": [
        { "slug": "x-small", "size": "12px", "name": "Extra small" },
        { "slug": "small", "size": "14px", "name": "Small" },
        { "slug": "card", "size": "15px", "name": "Card" },
        { "slug": "medium", "size": "18px", "name": "Medium" },
        { "slug": "large", "size": "20px", "name": "Large" },
        { "slug": "x-large", "size": "24px", "name": "Extra large" },
        { "slug": "section", "size": "clamp(30px, 4vw, 46px)", "name": "Section heading" },
        { "slug": "page-hero", "size": "clamp(34px, 5vw, 54px)", "name": "Page heading" },
        { "slug": "hero", "size": "clamp(42px, 6vw, 76px)", "name": "Hero" }
      ]
    },
    "spacing": {
      "defaultSpacingSizes": false,
      "units": [ "px", "rem", "%", "vw" ],
      "spacingSizes": [
        { "slug": "10", "size": "0.5rem", "name": "2XS" },
        { "slug": "20", "size": "1rem", "name": "XS" },
        { "slug": "30", "size": "1.5rem", "name": "S" },
        { "slug": "40", "size": "2rem", "name": "M" },
        { "slug": "50", "size": "3.25rem", "name": "L" },
        { "slug": "60", "size": "clamp(4rem, 8vw, 6rem)", "name": "Section" }
      ]
    },
    "shadow": {
      "defaultPresets": false,
      "presets": [
        { "slug": "card", "shadow": "0 10px 30px rgb(14 14 44 / 0.08)", "name": "Card" },
        { "slug": "card-lg", "shadow": "0 24px 60px rgb(14 14 44 / 0.16)", "name": "Card large" }
      ]
    }
  },
  "styles": {
    "color": { "background": "var(--wp--preset--color--white)", "text": "var(--wp--preset--color--grey-700)" },
    "typography": { "fontFamily": "var(--wp--preset--font-family--inter)", "fontSize": "1rem", "lineHeight": "1.625" },
    "spacing": {
      "padding": { "left": "24px", "right": "24px" },
      "blockGap": "1.5rem"
    },
    "elements": {
      "heading": {
        "color": { "text": "var(--wp--preset--color--ink)" },
        "typography": { "fontFamily": "var(--wp--preset--font-family--sora)", "fontWeight": "700", "lineHeight": "1.1", "letterSpacing": "-0.02em" }
      },
      "h1": { "typography": { "fontSize": "var(--wp--preset--font-size--page-hero)", "fontWeight": "800" } },
      "h2": { "typography": { "fontSize": "var(--wp--preset--font-size--section)" } },
      "h3": { "typography": { "fontSize": "21px" } },
      "h4": { "typography": { "fontSize": "var(--wp--preset--font-size--medium)" } },
      "link": {
        "color": { "text": "var(--wp--preset--color--green-600)" },
        ":hover": { "color": { "text": "var(--wp--preset--color--ink)" } }
      },
      "button": {
        "color": { "background": "var(--wp--preset--color--green)", "text": "var(--wp--preset--color--ink)" },
        "typography": { "fontFamily": "var(--wp--preset--font-family--sora)", "fontWeight": "600", "fontSize": "15px", "lineHeight": "1.2" },
        "border": { "radius": "9999px" },
        "spacing": { "padding": { "top": "13px", "bottom": "13px", "left": "24px", "right": "24px" } },
        ":hover": { "color": { "background": "var(--wp--preset--color--green-600)", "text": "var(--wp--preset--color--ink)" } }
      }
    },
    "blocks": {
      "core/navigation": {
        "typography": { "fontFamily": "var(--wp--preset--font-family--sora)", "fontSize": "14.5px", "fontWeight": "500" }
      }
    }
  },
  "templateParts": [
    { "name": "header", "title": "Header", "area": "header" },
    { "name": "footer", "title": "Footer", "area": "footer" }
  ]
}
```

- [ ] **Step 4: Write `assets/css/site.css` (block styles; header and footer are added in Tasks 7–8)**

```css
/* ---------- Base ---------- */
html { scroll-behavior: smooth; }
:target { scroll-margin-top: 7rem; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

/* ---------- Buttons ---------- */
.wp-block-button__link { transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }
@media (prefers-reduced-motion: no-preference) {
	.wp-block-button__link:hover { transform: translateY(-2px); }
}
.wp-block-button__link:focus-visible { outline: 2px solid var(--wp--preset--color--green-600); outline-offset: 2px; }
.wp-block-button.is-style-navy .wp-block-button__link { background: var(--wp--preset--color--ink); color: #fff; }
.wp-block-button.is-style-navy .wp-block-button__link:hover { background: #20204a; color: #fff; }
.wp-block-button.is-style-ghost .wp-block-button__link { background: transparent; color: var(--wp--preset--color--ink); border: 1.5px solid var(--wp--preset--color--grey-300); }
.wp-block-button.is-style-ghost .wp-block-button__link:hover { background: transparent; border-color: var(--wp--preset--color--ink); }
.wp-block-button.is-style-ghost-on-dark .wp-block-button__link { background: transparent; color: #fff; border: 1.5px solid rgb(255 255 255 / 0.35); }
.wp-block-button.is-style-ghost-on-dark .wp-block-button__link:hover { background: transparent; color: #fff; border-color: #fff; }
.wp-block-button.is-size-lg .wp-block-button__link { padding: 16px 30px; font-size: 16px; }

/* ---------- Text ---------- */
.is-style-eyebrow,
.is-style-eyebrow-on-ink {
	font-family: var(--wp--preset--font-family--sora);
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: var(--wp--preset--color--green-600);
}
.is-style-eyebrow-on-ink { color: var(--wp--preset--color--green); }

/* ---------- Surfaces ---------- */
.wp-block-group.is-style-card {
	background: #fff;
	border: 1px solid var(--wp--preset--color--grey-100);
	border-radius: 18px;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.wp-block-group.is-style-card-ink {
	background: rgb(255 255 255 / 0.04);
	border: 1px solid rgb(255 255 255 / 0.1);
	border-radius: 18px;
	padding: 28px;
	transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}
.wp-block-group.is-style-strip-green {
	background: var(--wp--preset--color--green-100);
	border: 1px solid rgb(132 194 36 / 0.4);
	border-radius: 18px;
	padding: 28px;
}
.wp-block-image.is-style-rounded-2xl img { border-radius: 18px; }
```

- [ ] **Step 5: Write the templates and placeholder parts**

`templates/page.html` (and a copy saved as `templates/front-page.html` and `templates/index.html`):

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","anchor":"main","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}},"layout":{"type":"default"}} -->
<main id="main" class="wp-block-group" style="margin-top:0;margin-bottom:0">
<!-- wp:post-content {"layout":{"type":"constrained"}} /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

`templates/404.html`:

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","anchor":"main","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}},"layout":{"type":"default"}} -->
<main id="main" class="wp-block-group" style="margin-top:0;margin-bottom:0">
<!-- wp:group {"align":"full","backgroundColor":"ink","textColor":"white","style":{"spacing":{"padding":{"top":"70px","bottom":"60px"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<div class="wp-block-group alignfull has-white-color has-ink-background-color has-text-color has-background" style="padding-top:70px;padding-bottom:60px">
<!-- wp:paragraph {"className":"is-style-eyebrow-on-ink"} --><p class="is-style-eyebrow-on-ink">404</p><!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white"} --><h1 class="wp-block-heading has-white-color has-text-color">Page not found</h1><!-- /wp:heading -->
<!-- wp:paragraph {"style":{"color":{"text":"rgba(255,255,255,0.66)"}},"fontSize":"medium"} --><p class="has-text-color has-medium-font-size" style="color:rgba(255,255,255,0.66)">That page has moved or never existed. These will get you back on track.</p><!-- /wp:paragraph -->
<!-- wp:buttons --><div class="wp-block-buttons">
<!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/">Home</a></div><!-- /wp:button -->
<!-- wp:button {"className":"is-style-ghost-on-dark"} --><div class="wp-block-button is-style-ghost-on-dark"><a class="wp-block-button__link wp-element-button" href="/im-new">I'm new</a></div><!-- /wp:button -->
<!-- wp:button {"className":"is-style-ghost-on-dark"} --><div class="wp-block-button is-style-ghost-on-dark"><a class="wp-block-button__link wp-element-button" href="/contact">Contact us</a></div><!-- /wp:button -->
</div><!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

`parts/header.html` and `parts/footer.html` for now (Tasks 7–8 replace them):

```html
<!-- wp:site-title /-->
```

- [ ] **Step 6: Activate and verify**

```bash
wp() { docker compose run --rm -T wpcli wp "$@"; }
wp theme activate elevation
wp theme delete twentytwentyfive twentytwentyfour twentytwentythree 2>/dev/null || true
curl -s http://localhost:8080/does-not-exist | grep -o -E 'Page not found|inter-latin-wght.woff2|sora-latin-wght.woff2|fonts.googleapis' | sort -u
```

Expected: `Page not found`, `inter-latin-wght.woff2`, `sora-latin-wght.woff2`, and **no**
`fonts.googleapis`.

Then open http://localhost:8080/does-not-exist in the browser. The page should show an ink band
with the white Sora heading "Page not found", a green pill "Home" button, and two outlined white
pill buttons.

- [ ] **Step 7: Commit**

```bash
git add wp-content/themes/elevation
git commit -m "Add the elevation block theme with the redesign's tokens, fonts and block styles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Header

**Files:**
- Create: `wp-content/themes/elevation/patterns/header-logo.php`, `assets/js/header.js`
- Rewrite: `wp-content/themes/elevation/parts/header.html`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append the header section)

**Interfaces:**
- Consumes: the tokens `{church.name}`, `{service.day}` and `{service.startTime}` (Task 4); the
  block styles `ghost`, `ghost-on-dark` and `has-custom-width` (Task 6).
- Produces:
  - Header template part classes: `.site-header`, `.site-header__inner`, `.site-logo`
    (`__ink` / `__white`), `.site-nav`, `.site-header__ctas`, `.site-header__overlay-extra`,
    `.site-header__service`.
  - State classes on the `header.wp-block-template-part` element: `is-scrolled` and
    `is-over-hero`. Plan 2's home hero relies on `is-over-hero` and the header heights.
  - CSS custom property `--header-h` (76px, or 88px ≥640px).
  - The header's Navigation block has no `ref`; it renders the site's `wp_navigation` post (Task 9
    seeds one).

- [ ] **Step 1: Write the logo pattern**

`patterns/header-logo.php`:

```php
<?php
/**
 * Title: Header logo
 * Slug: elevation/header-logo
 * Inserter: no
 */
$elevation_ink   = esc_url( get_theme_file_uri( 'assets/images/logo-colour.png' ) );
$elevation_white = esc_url( get_theme_file_uri( 'assets/images/logo-white.png' ) );
?>
<!-- wp:html -->
<a class="site-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="{church.name} — home">
	<img class="site-logo__ink" src="<?php echo $elevation_ink; ?>" alt="" width="938" height="307" decoding="async">
	<img class="site-logo__white" src="<?php echo $elevation_white; ?>" alt="" width="938" height="307" decoding="async">
</a>
<!-- /wp:html -->
```

- [ ] **Step 2: Write `parts/header.html`**

```html
<!-- wp:group {"className":"site-header","layout":{"type":"constrained"}} -->
<div class="wp-block-group site-header">
<!-- wp:group {"align":"wide","className":"site-header__inner","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide site-header__inner">
<!-- wp:pattern {"slug":"elevation/header-logo"} /-->

<!-- wp:group {"className":"site-header__right","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group site-header__right">
<!-- wp:navigation {"overlayMenu":"always","overlayBackgroundColor":"ink","overlayTextColor":"white","className":"site-nav","layout":{"type":"flex","justifyContent":"right","flexWrap":"nowrap"}} /-->

<!-- wp:buttons {"className":"site-header__ctas","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-buttons site-header__ctas">
<!-- wp:button {"className":"is-style-ghost"} --><div class="wp-block-button is-style-ghost"><a class="wp-block-button__link wp-element-button" href="/im-new">Plan a Visit</a></div><!-- /wp:button -->
<!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/give">Give</a></div><!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"site-header__overlay-extra","layout":{"type":"default"}} -->
<div class="wp-block-group site-header__overlay-extra">
<!-- wp:paragraph {"className":"site-header__service"} --><p class="site-header__service">{service.day}s at {service.startTime}</p><!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"width":100,"className":"is-style-ghost-on-dark is-size-lg"} --><div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-ghost-on-dark is-size-lg"><a class="wp-block-button__link wp-element-button" href="/im-new">Plan a Visit</a></div><!-- /wp:button -->
<!-- wp:button {"width":100,"className":"is-size-lg"} --><div class="wp-block-button has-custom-width wp-block-button__width-100 is-size-lg"><a class="wp-block-button__link wp-element-button" href="/give">Give</a></div><!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
```

- [ ] **Step 3: Write `assets/js/header.js`**

```js
/**
 * Header behaviour core Navigation doesn't provide:
 * - solid/scrolled state after 80px, transparent "over hero" state on the front page;
 * - the service line, CTA buttons and white logo shown inside the mobile overlay;
 * - "active" link when the current path starts with the link's path (e.g. /about/what-we-believe).
 */
( () => {
	const header = document.querySelector( '.site-header' );
	if ( ! header ) {
		return;
	}
	const part = header.closest( '.wp-block-template-part' ) || header;
	const isHome = document.body.classList.contains( 'home' );

	const update = () => {
		const scrolled = window.scrollY > 80;
		part.classList.toggle( 'is-scrolled', scrolled );
		part.classList.toggle( 'is-over-hero', isHome && ! scrolled );
	};
	update();
	window.addEventListener( 'scroll', update, { passive: true } );
	window.addEventListener( 'pageshow', update );

	const dialog = header.querySelector( '.wp-block-navigation__responsive-dialog' );
	const content = header.querySelector( '.wp-block-navigation__responsive-container-content' );
	const extra = header.querySelector( '.site-header__overlay-extra' );
	const logo = header.querySelector( '.site-logo' );
	if ( dialog && logo ) {
		const overlayLogo = logo.cloneNode( true );
		overlayLogo.classList.add( 'site-logo--overlay' );
		overlayLogo.setAttribute( 'tabindex', '-1' );
		dialog.prepend( overlayLogo );
	}
	if ( content && extra ) {
		content.append( extra );
	}

	const here = window.location.pathname.replace( /\/+$/, '' ) || '/';
	header.querySelectorAll( '.site-nav a.wp-block-navigation-item__content' ).forEach( ( link ) => {
		const path = new URL( link.href, window.location.origin ).pathname.replace( /\/+$/, '' ) || '/';
		if ( path !== '/' && ( here === path || here.startsWith( path + '/' ) ) && ! link.hash ) {
			link.classList.add( 'is-active' );
		}
	} );
} )();
```

- [ ] **Step 4: Append the header CSS to `assets/css/site.css`**

```css
/* ---------- Header ---------- */
:root { --header-h: 76px; }
@media (min-width: 640px) { :root { --header-h: 88px; } }

.wp-site-blocks > header.wp-block-template-part {
	position: sticky;
	top: var(--wp-admin--admin-bar--height, 0px);
	z-index: 100;
	background: rgb(255 255 255 / 0.92);
	-webkit-backdrop-filter: blur(24px);
	backdrop-filter: blur(24px);
	border-bottom: 1px solid var(--wp--preset--color--grey-100);
	transition: background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.wp-site-blocks > header.wp-block-template-part.is-scrolled { box-shadow: 0 6px 24px rgb(14 14 44 / 0.07); }
.wp-site-blocks > header.wp-block-template-part.is-over-hero {
	background: transparent;
	-webkit-backdrop-filter: none;
	backdrop-filter: none;
	border-bottom-color: transparent;
	box-shadow: none;
}
.wp-site-blocks > header + * { margin-block-start: 0; }

.site-header__inner { min-height: var(--header-h); gap: 24px; }
.site-header__right { gap: 12px; }

/* Logo: colour and white stacked for the cross-fade. */
.site-logo { position: relative; display: block; flex-shrink: 0; }
.site-logo img { display: block; height: 44px; width: auto; transition: opacity 0.3s ease; }
@media (min-width: 640px) { .site-logo img { height: 52px; } }
.site-logo__white { position: absolute; inset: 0; opacity: 0; }
.is-over-hero .site-logo__ink { opacity: 0; }
.is-over-hero .site-logo__white { opacity: 1; }

/* Links */
.site-nav .wp-block-navigation-item__content {
	padding: 10px 14px;
	border-radius: 9px;
	color: var(--wp--preset--color--ink);
	transition: background-color 0.2s ease, color 0.2s ease;
}
.site-nav .wp-block-navigation-item__content:hover { background: var(--wp--preset--color--grey-50); color: var(--wp--preset--color--green-600); }
.site-nav .wp-block-navigation-item__content.is-active,
.site-nav .current-menu-item > .wp-block-navigation-item__content { color: var(--wp--preset--color--green-600); }
.is-over-hero .site-nav .wp-block-navigation-item__content { color: rgb(255 255 255 / 0.85); }
.is-over-hero .site-nav .wp-block-navigation-item__content:hover { background: rgb(255 255 255 / 0.1); color: #fff; }
.is-over-hero .site-nav .wp-block-navigation-item__content.is-active { color: var(--wp--preset--color--green); }
.is-over-hero .wp-block-navigation__responsive-container-open { color: #fff; }
.is-over-hero .site-header__ctas .is-style-ghost .wp-block-button__link { color: #fff; border-color: rgb(255 255 255 / 0.35); }
.is-over-hero .site-header__ctas .is-style-ghost .wp-block-button__link:hover { border-color: #fff; }

/* Desktop dropdown panel */
.site-nav .wp-block-navigation__submenu-container {
	background: #fff;
	border: 1px solid var(--wp--preset--color--grey-100) !important;
	border-radius: 12px;
	box-shadow: 0 10px 30px rgb(14 14 44 / 0.08);
	padding: 6px;
	min-width: 220px !important;
}
.site-nav .wp-block-navigation__submenu-container .wp-block-navigation-item__content { color: var(--wp--preset--color--ink) !important; }

/* Below 1024px: overlay menu only. From 1024px: inline menu + CTAs, no hamburger. */
.site-header__ctas { display: none !important; }
.site-header__overlay-extra { display: none; }
@media (min-width: 1024px) {
	.site-header__ctas { display: flex !important; }
	.site-nav .wp-block-navigation__responsive-container-open { display: none; }
	.site-nav .wp-block-navigation__responsive-container.hidden-by-default:not(.is-menu-open) {
		display: flex;
		position: relative;
		inset: auto;
		z-index: auto;
		width: auto;
		height: auto;
		padding: 0;
		background: transparent !important;
		color: inherit !important;
	}
	.site-nav .wp-block-navigation__responsive-container:not(.is-menu-open) .wp-block-navigation__responsive-container-close { display: none; }
	.site-nav .wp-block-navigation__responsive-container:not(.is-menu-open) .wp-block-navigation__responsive-container-content { display: flex; }
	.site-nav .wp-block-navigation__responsive-container:not(.is-menu-open) .wp-block-navigation__container { flex-direction: row; gap: 6px; }
	.site-nav .wp-block-navigation__responsive-container:not(.is-menu-open) .site-logo--overlay { display: none; }
}

/* Overlay (open) */
.site-nav .wp-block-navigation__responsive-container.is-menu-open { padding: 28px; }
.site-nav .is-menu-open .wp-block-navigation__responsive-container-content { align-items: stretch; width: 100%; padding-top: 24px; }
.site-nav .is-menu-open .wp-block-navigation__container { gap: 0; width: 100%; }
.site-nav .is-menu-open .wp-block-navigation-item { width: 100%; }
.site-nav .is-menu-open .wp-block-navigation-item__content {
	display: block;
	width: 100%;
	padding: 14px 0;
	font-size: 26px;
	font-weight: 600;
	color: #fff !important;
	border-bottom: 1px solid rgb(255 255 255 / 0.1);
	border-radius: 0;
	background: none !important;
}
.site-nav .is-menu-open .wp-block-navigation__submenu-container { background: none; border: 0 !important; box-shadow: none; padding: 0 0 0 16px; }
.site-nav .is-menu-open .wp-block-navigation__submenu-container .wp-block-navigation-item__content { font-size: 18px; color: rgb(255 255 255 / 0.75) !important; }
.site-nav .is-menu-open .site-logo--overlay { position: absolute; top: 24px; left: 28px; }
.site-nav .is-menu-open .site-logo--overlay .site-logo__ink { opacity: 0; }
.site-nav .is-menu-open .site-logo--overlay .site-logo__white { opacity: 1; }
.site-nav .is-menu-open .site-header__overlay-extra { display: block; width: 100%; margin-top: auto; padding-top: 28px; }
.site-header__service { font-size: 14px; color: rgb(255 255 255 / 0.6); margin: 0 0 16px; }
@media (prefers-reduced-motion: no-preference) {
	.site-nav .wp-block-navigation__responsive-container.is-menu-open { animation: elevation-slide-in 0.35s cubic-bezier(0.4, 0, 0.2, 1) both; }
}
@keyframes elevation-slide-in { from { transform: translateX(100%); } to { transform: none; } }
```

- [ ] **Step 5: Seed a temporary menu so the header has links to render**

(Task 9 replaces this with the seeded version.)

```bash
docker compose run --rm -T wpcli wp post create --post_type=wp_navigation --post_status=publish --post_title=Header --post_name=header-temp \
  --post_content='<!-- wp:navigation-link {"label":"I&#039;m New","url":"/im-new","kind":"custom"} /--><!-- wp:navigation-submenu {"label":"About","url":"/about","kind":"custom"} --><!-- wp:navigation-link {"label":"Our Story","url":"/about#our-story","kind":"custom"} /--><!-- /wp:navigation-submenu --><!-- wp:navigation-link {"label":"Contact","url":"/contact","kind":"custom"} /-->'
```

- [ ] **Step 6: Browser check at desktop width (1440px)**

Open http://localhost:8080/does-not-exist in the browser pane. Check each of these:
- The header is 88px tall, with the colour logo at the left.
- Inline links on the right read "I'm New", "About" and "Contact" in Sora ink. Hovering "About"
  opens a white dropdown with "Our Story".
- There are Plan a Visit (ghost) and Give (green) pills, and no hamburger.
- After scrolling 100px, the header gains a soft shadow.

- [ ] **Step 7: Browser checks for mobile, no-JS and reload state**

- Resize to 390×812. There's a hamburger with no inline links. Tapping it slides in a full-screen
  ink overlay from the right. It shows the white logo top-left, a close button, 26px white links,
  "Sundays at 10:30am" and full-width Plan a Visit / Give buttons. Escape closes it, and focus
  returns to the hamburger.
- At 1023px, you still get the hamburger. At 1024px, you get the inline links.
- With JS disabled (browser devtools), the header is solid white with readable ink links. The
  over-hero state is JS-only, so no page can load with white-on-white links.
- Scroll halfway down a long page and reload. The header is immediately in the scrolled state (the
  `pageshow`/initial `update()` call).

If the 1024px inline switch doesn't take effect, the core class names differ in this core version.
Inspect `.wp-block-navigation__responsive-container`, update the selectors in the "Below 1024px"
block, and re-check. Don't change any other behaviour.

- [ ] **Step 8: Commit**

```bash
git add wp-content/themes/elevation
git commit -m "Add the header: sticky states, 1024px overlay switch, overlay extras and active links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Footer

**Files:**
- Create: `wp-content/themes/elevation/patterns/footer-logo.php`
- Rewrite: `wp-content/themes/elevation/parts/footer.html`
- Modify: `wp-content/themes/elevation/assets/css/site.css` (append the footer section)

**Interfaces:**
- Consumes: the `elevation/social-links` block (Task 5); the tokens `{church.mission}`,
  `{service.day}`, `{service.startTime}`, `{location.venue}`, `{location.campus}`,
  `{location.postcode}`, `{contact.email}`, `{contact.phoneTel}`, `{contact.phoneLabel}`,
  `{site.year}`, `{church.name}`, `{church.legalName}` and `{church.charityNumber}` (Task 4).
- Produces: the footer part. Plan 5 inserts the newsletter row into it, marked by the comment
  `<!-- newsletter row: Plan 5 -->`.

- [ ] **Step 1: Write the logo pattern**

`patterns/footer-logo.php`:

```php
<?php
/**
 * Title: Footer logo
 * Slug: elevation/footer-logo
 * Inserter: no
 */
?>
<!-- wp:html -->
<a class="footer-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="{church.name} — home">
	<img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/logo-white.png' ) ); ?>" alt="" width="938" height="307" loading="lazy" decoding="async">
</a>
<!-- /wp:html -->
```

- [ ] **Step 2: Write `parts/footer.html`**

```html
<!-- wp:group {"className":"site-footer","backgroundColor":"ink-800","layout":{"type":"constrained"}} -->
<div class="wp-block-group site-footer has-ink-800-background-color has-background">

<!-- wp:columns {"align":"wide","className":"site-footer__grid"} -->
<div class="wp-block-columns alignwide site-footer__grid">
<!-- wp:column {"width":"34.8%"} -->
<div class="wp-block-column" style="flex-basis:34.8%">
<!-- wp:pattern {"slug":"elevation/footer-logo"} /-->
<!-- wp:paragraph {"className":"site-footer__mission"} --><p class="site-footer__mission">{church.mission}</p><!-- /wp:paragraph -->
<!-- wp:elevation/social-links /-->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"21.7%"} -->
<div class="wp-block-column" style="flex-basis:21.7%">
<!-- wp:heading {"level":2,"className":"footer-heading"} --><h2 class="wp-block-heading footer-heading">Visit</h2><!-- /wp:heading -->
<!-- wp:list {"className":"footer-links"} -->
<ul class="wp-block-list footer-links">
<!-- wp:list-item --><li><a href="/im-new">Plan a visit</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/im-new#what-to-expect">What to expect</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/im-new#find-us">Times &amp; location</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/im-new#kids">Kids &amp; youth</a></li><!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"21.7%"} -->
<div class="wp-block-column" style="flex-basis:21.7%">
<!-- wp:heading {"level":2,"className":"footer-heading"} --><h2 class="wp-block-heading footer-heading">Explore</h2><!-- /wp:heading -->
<!-- wp:list {"className":"footer-links"} -->
<ul class="wp-block-list footer-links">
<!-- wp:list-item --><li><a href="/watch">Watch messages</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/events">Events</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/get-involved">Get involved</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/give">Give</a></li><!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"21.7%"} -->
<div class="wp-block-column" style="flex-basis:21.7%">
<!-- wp:heading {"level":2,"className":"footer-heading"} --><h2 class="wp-block-heading footer-heading">Connect</h2><!-- /wp:heading -->
<!-- wp:list {"className":"footer-links"} -->
<ul class="wp-block-list footer-links">
<!-- wp:list-item --><li><a href="/contact">Contact us</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/prayer">Prayer request</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/connect-groups">Connect Groups</a></li><!-- /wp:list-item -->
<!-- wp:list-item --><li><a href="/about/what-we-believe">What we believe</a></li><!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->

<!-- newsletter row: Plan 5 -->

<!-- wp:html -->
<div class="footer-strip alignwide">
	<p class="footer-strip__item footer-strip__item--strong"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>{service.day}s {service.startTime}</p>
	<p class="footer-strip__item footer-strip__item--strong"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>{location.venue}, {location.campus}, {location.postcode}</p>
	<a class="footer-strip__item" href="mailto:{contact.email}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>{contact.email}</a>
	<a class="footer-strip__item" href="tel:{contact.phoneTel}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>{contact.phoneLabel}</a>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<div class="footer-bottom alignwide">
	<p>&copy; {site.year} {church.name}. An expression of The Elevation Church.</p>
	<p><a href="/privacy">Privacy &amp; cookies</a> <span aria-hidden="true" class="footer-bottom__dot">·</span> <span>{church.legalName} · registered charity no. {church.charityNumber}</span></p>
</div>
<!-- /wp:html -->

</div>
<!-- /wp:group -->
```

- [ ] **Step 3: Append the footer CSS to `assets/css/site.css`**

```css
/* ---------- Footer ---------- */
.site-footer { padding-top: 64px; padding-bottom: 32px; color: rgb(255 255 255 / 0.6); }
.site-footer a { color: inherit; text-decoration: none; transition: color 0.2s ease; }
.site-footer a:hover, .site-footer a:focus-visible { color: var(--wp--preset--color--green); }
.site-footer__grid { gap: 40px; margin-bottom: 44px; }
.footer-logo img { display: block; height: 44px; width: auto; }
@media (min-width: 640px) { .footer-logo img { height: 52px; } }
.site-footer__mission { max-width: 280px; margin: 18px 0; font-size: 14.5px; line-height: 1.625; }
.footer-heading {
	margin: 0 0 18px;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: #fff;
}
.footer-links { list-style: none; margin: 0; padding: 0; }
.footer-links li { margin-bottom: 11px; font-size: 14.5px; }

.footer-strip {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px 28px;
	margin-bottom: 28px;
	padding: 20px 24px;
	border-radius: 14px;
	background: rgb(255 255 255 / 0.04);
}
.footer-strip__item { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 14px; }
.footer-strip__item svg { width: 18px; height: 18px; flex-shrink: 0; }
.footer-strip__item--strong { font-family: var(--wp--preset--font-family--sora); font-weight: 600; color: #fff; font-size: 16px; }
.footer-strip__item--strong svg { color: var(--wp--preset--color--green); }

.footer-bottom {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 12px;
	padding-top: 24px;
	border-top: 1px solid rgb(255 255 255 / 0.08);
	font-size: 13px;
}
.footer-bottom p { margin: 0; }
.footer-bottom__dot { color: rgb(255 255 255 / 0.25); margin: 0 6px; }

@media (min-width: 782px) and (max-width: 1023.98px) {
	.site-footer__grid { flex-wrap: wrap !important; }
	.site-footer__grid > .wp-block-column { flex-basis: calc(50% - 20px) !important; }
}
```

- [ ] **Step 4: Verify the rendered footer**

```bash
curl -s http://localhost:8080/does-not-exist | grep -o -E 'Sundays 10:30am|Mary Seacole Building, University of Salford, M6 6PU|mailto:info@elevationmanchester.org|tel:\+447469062220|registered charity no. 1195403|&copy; 20[0-9]{2} Elevation Church Manchester|\{[a-z]+\.[a-zA-Z.]+\}' | sort -u
```

Expected: the six real values, and **no** leftover `{...}` token in the output.

In the browser at 1440px, the footer should show:
- A dark ink-800 band with the white logo, the mission paragraph and 4 social squares. Hovering a
  square turns it green with an ink icon.
- Three uppercase column headings with links.
- The practical strip, with the time and address in white Sora with green icons.
- The bottom bar.

At 390px, the columns stack.

- [ ] **Step 5: Commit**

```bash
git add wp-content/themes/elevation
git commit -m "Add the footer with settings-driven practical strip and social links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Seed CLI, `seed.sh` and the cut-off

**Files:**
- Create: `wp-content/plugins/elevation-core/includes/cli.php`, `bin/seed.sh`, `seed/CUTOFF`, `seed/navigation/header.html`, `seed/pages/home.html`
- Modify: `wp-content/plugins/elevation-core/elevation-core.php`

**Interfaces:**
- Consumes: `SeedGuard::decide`, `SeedGuard::hash`.
- Produces:
  - The WP-CLI command
    `wp elevation seed <post_type> <slug> <file> --title=<title> [--parent=<parent-slug>] [--force]`.
    It prints `Created|Updated|Unchanged|Skipped <type> <slug>` and stores post meta
    `_elevation_seed_hash`.
  - `bin/seed.sh`, with helper `seed_post <type> <slug> <file> <title> [extra args]`.
    `SEED_FORCE="<slug> ..."` overrides the guard for the named slugs. Later plans append
    `seed_post` lines.

- [ ] **Step 1: Write `includes/cli.php`**

```php
<?php
use Elevation\Core\SeedGuard;

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * Create or update a post from a seed file, without overwriting hand edits.
 *
 * ## OPTIONS
 * <post_type>
 * : Post type, e.g. page or wp_navigation.
 * <slug>
 * : Post slug (name).
 * <file>
 * : Path to a file of block markup.
 * --title=<title>
 * : Post title.
 * [--parent=<parent>]
 * : Slug of the parent page (pages only).
 * [--force]
 * : Overwrite even if the post was edited by hand.
 */
WP_CLI::add_command( 'elevation seed', function ( array $args, array $assoc ) {
	[ $type, $slug, $file ] = $args;
	if ( ! is_readable( $file ) ) {
		WP_CLI::error( "Seed file not readable: $file" );
	}
	$content = (string) file_get_contents( $file );

	$parent_id = 0;
	if ( ! empty( $assoc['parent'] ) ) {
		$parent = get_page_by_path( $assoc['parent'], OBJECT, $type );
		if ( ! $parent ) {
			WP_CLI::error( "Parent '{$assoc['parent']}' not found; seed it first." );
		}
		$parent_id = $parent->ID;
	}

	$existing = get_posts( [
		'post_type'      => $type,
		'name'           => $slug,
		'post_parent'    => $parent_id,
		'post_status'    => 'any',
		'posts_per_page' => 1,
	] );
	$post     = $existing[0] ?? null;
	$stored   = $post ? ( get_post_meta( $post->ID, '_elevation_seed_hash', true ) ?: null ) : null;
	$decision = SeedGuard::decide( $stored, $post?->post_content, $content, isset( $assoc['force'] ) );

	if ( SeedGuard::SKIP === $decision ) {
		WP_CLI::warning( "Skipped $type $slug: edited since it was seeded (use SEED_FORCE=\"$slug\" to overwrite)." );
		return;
	}
	if ( SeedGuard::UNCHANGED === $decision ) {
		update_post_meta( $post->ID, '_elevation_seed_hash', SeedGuard::hash( $content ) );
		WP_CLI::log( "Unchanged $type $slug" );
		return;
	}

	kses_remove_filters(); // Seed files are trusted theme content (SVG, HTML blocks).
	$data = [
		'post_type'    => $type,
		'post_name'    => $slug,
		'post_title'   => $assoc['title'],
		'post_content' => wp_slash( $content ),
		'post_status'  => 'publish',
		'post_parent'  => $parent_id,
	];
	if ( $post ) {
		$data['ID'] = $post->ID;
	}
	$id = wp_insert_post( $data, true );
	if ( is_wp_error( $id ) ) {
		WP_CLI::error( $id->get_error_message() );
	}
	update_post_meta( $id, '_elevation_seed_hash', SeedGuard::hash( (string) get_post( $id )->post_content ) );
	WP_CLI::log( ( SeedGuard::CREATE === $decision ? 'Created' : 'Updated' ) . " $type $slug (#$id)" );
} );
```

The stored hash is taken from the content **as saved**, so a round-trip through `wp_insert_post`
doesn't look like a hand edit on the next run.

Append to `elevation-core.php`:

```php
require_once ELEVATION_CORE_DIR . 'includes/cli.php';
```

- [ ] **Step 2: Write the seed files**

`seed/CUTOFF`:

```
# Date after which bin/seed.sh refuses to run (YYYY-MM-DD), or "none". Set at build sign-off (spec §9).
none
```

`seed/navigation/header.html`:

```html
<!-- wp:navigation-link {"label":"I'm New","url":"/im-new","kind":"custom"} /-->
<!-- wp:navigation-submenu {"label":"About","url":"/about","kind":"custom"} -->
<!-- wp:navigation-link {"label":"Our Story","url":"/about#our-story","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Vision &amp; Values","url":"/about#vision-values","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Leadership","url":"/about#leadership","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"What We Believe","url":"/about/what-we-believe","kind":"custom"} /-->
<!-- /wp:navigation-submenu -->
<!-- wp:navigation-link {"label":"Watch","url":"/watch","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Events","url":"/events","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Get Involved","url":"/get-involved","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Prayer","url":"/prayer","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Contact","url":"/contact","kind":"custom"} /-->
```

`seed/pages/home.html` (a placeholder until Plan 2):

```html
<!-- wp:group {"align":"full","backgroundColor":"ink","textColor":"white","style":{"spacing":{"padding":{"top":"calc(var(--header-h) + 4rem)","bottom":"4rem"},"margin":{"top":"calc(var(--header-h) * -1)"}}},"layout":{"type":"constrained","contentSize":"1240px"}} -->
<div class="wp-block-group alignfull has-white-color has-ink-background-color has-text-color has-background" style="margin-top:calc(var(--header-h) * -1);padding-top:calc(var(--header-h) + 4rem);padding-bottom:4rem">
<!-- wp:heading {"level":1,"textColor":"white","fontSize":"hero"} --><h1 class="wp-block-heading has-white-color has-text-color has-hero-font-size">Making greatness <span style="color:#84C224">common.</span></h1><!-- /wp:heading -->
<!-- wp:paragraph --><p>{service.day}s at {service.startTime} · {location.full}</p><!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

- [ ] **Step 3: Write `bin/seed.sh`**

```bash
#!/usr/bin/env bash
# Build the redesigned site from seed/. Safe to re-run: hand-edited posts are skipped.
#   SEED_FORCE="home other-slug" ./bin/seed.sh    overwrite the named posts anyway
#   ./bin/seed.sh --i-know-this-is-after-cutoff   run after the seed cut-off (spec §9)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

cutoff=$(grep -v '^#' seed/CUTOFF | head -1 | tr -d '[:space:]')
if [ "$cutoff" != "none" ] && [[ "$(date +%F)" > "$cutoff" ]] && [ "${1:-}" != "--i-know-this-is-after-cutoff" ]; then
  echo "The seed cut-off ($cutoff) has passed: the local database is now the source of truth." >&2
  echo "Re-run with --i-know-this-is-after-cutoff only if you are sure." >&2
  exit 1
fi

wp() { docker compose run --rm -T wpcli wp --user="$WP_ADMIN_USER" "$@"; }

seed_post() { # type slug file title [extra args...]
  local type=$1 slug=$2 file=$3 title=$4; shift 4
  local force=()
  case " ${SEED_FORCE:-} " in *" $slug "*) force=(--force) ;; esac
  wp elevation seed "$type" "$slug" "/seed/$file" --title="$title" ${force[@]+"${force[@]}"} "$@"
}

wp theme activate elevation
wp plugin activate elevation-core
wp theme delete twentytwentyfive twentytwentyfour twentytwentythree 2>/dev/null || true
wp option update blogname "$WP_TITLE"
wp option update blogdescription "Making Greatness Common"
wp option update timezone_string "Europe/London"
wp option update WPLANG "en_GB" 2>/dev/null || true
wp rewrite structure '/%postname%/' --hard

# The header renders the site's navigation menu; keep exactly one, the seeded "header".
for id in $(wp post list --post_type=wp_navigation --post_status=any --format=ids); do
  [ "$(wp post get "$id" --field=post_name)" = "header" ] || wp post delete "$id" --force
done
seed_post wp_navigation header navigation/header.html "Header"

seed_post page home pages/home.html "Home"

wp option update show_on_front page
wp option update page_on_front "$(wp post list --post_type=page --name=home --field=ID)"
wp rewrite flush --hard
wp cache flush
echo "Seed complete."
```

- [ ] **Step 4: Run it**

```bash
chmod +x bin/seed.sh
./bin/seed.sh
```

Expected: `Created wp_navigation header (#…)`, `Created page home (#…)`, `Seed complete.` The
temporary `header-temp` menu from Task 7 is deleted first, because only the slug `header` is kept.

- [ ] **Step 5: Re-run to prove it's idempotent**

Run: `./bin/seed.sh 2>&1 | grep -E 'Unchanged|Created|Updated|Skipped'`
Expected: `Unchanged wp_navigation header` and `Unchanged page home`.

- [ ] **Step 6: Prove the hand-edit guard and the override**

```bash
wp() { docker compose run --rm -T wpcli wp "$@"; }
HOME_ID=$(wp post list --post_type=page --name=home --field=ID)
wp post update "$HOME_ID" --post_content='<!-- wp:paragraph --><p>Edited in wp-admin</p><!-- /wp:paragraph -->'
./bin/seed.sh 2>&1 | grep -E 'home'
wp post get "$HOME_ID" --field=post_content
SEED_FORCE="home" ./bin/seed.sh 2>&1 | grep -E 'home'
```

Expected:
- `Warning: Skipped page home: edited since it was seeded ...`
- The content is still `<p>Edited in wp-admin</p>`.
- Then `Updated page home (#…)`.

- [ ] **Step 7: Prove the cut-off**

```bash
printf '# test\n2000-01-01\n' > seed/CUTOFF
./bin/seed.sh; echo "exit=$?"
printf '# Date after which bin/seed.sh refuses to run (YYYY-MM-DD), or "none". Set at build sign-off (spec §9).\nnone\n' > seed/CUTOFF
```

Expected: `The seed cut-off (2000-01-01) has passed...` and `exit=1`. `seed/CUTOFF` then reads
`none` again.

- [ ] **Step 8: Hook seeding into setup and commit**

`bin/setup.sh` already calls `./bin/seed.sh` unless `SKIP_SEED=1`.

```bash
git add wp-content/plugins/elevation-core bin/seed.sh seed/
git commit -m "Add the seed CLI with hand-edit guard, seed.sh with cut-off, header menu and placeholder home

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Foundation acceptance

**Files:** none new (fixes only, if checks fail).

- [ ] **Step 1: Rebuild from nothing, twice, and compare**

```bash
docker compose down -v && rm -rf wp-content/uploads && ./bin/setup.sh >/dev/null && ./bin/check-env.sh
docker compose run --rm -T wpcli wp post list --post_type=page,wp_navigation --fields=post_name,post_content --format=json | shasum > /tmp/elevation-run1.sha
docker compose down -v && ./bin/setup.sh >/dev/null && ./bin/check-env.sh
docker compose run --rm -T wpcli wp post list --post_type=page,wp_navigation --fields=post_name,post_content --format=json | shasum > /tmp/elevation-run2.sha
diff /tmp/elevation-run1.sha /tmp/elevation-run2.sha && echo IDENTICAL
```

Expected: `check-env.sh` passes both times, then `IDENTICAL`.

- [ ] **Step 2: Unit tests and a clean log**

```bash
docker compose run --rm composer vendor/bin/phpunit
: > wp-content/debug.log; for p in / /does-not-exist /wp-admin/; do curl -s -o /dev/null http://localhost:8080$p; done
cat wp-content/debug.log
```

Expected: `OK (24 tests ...)`. The log is empty, with no PHP warnings or notices.

- [ ] **Step 3: Side-by-side with the redesign's header and footer**

Start the redesign locally (`cd ~/Projects.nosync/website && npm ci && npm run dev`, port 4000). If
it fails to start without Supabase environment variables, don't fix it here: local Supabase is
Plan 6's job. Compare against inventory §2 (site-header, site-footer) instead.

In the browser pane, compare http://localhost:4000/contact with http://localhost:8080/does-not-exist
at 1440px and 390px, for the header and footer only. Check:
- Logo size and position
- Nav typography (Sora 14.5px, weight 500)
- Button pills: sizes and colours
- The 88px/76px header height
- The footer grid, strip and bottom bar

Fix any differences in `site.css`. Note anything left over in the Task 10 commit message.

- [ ] **Step 4: Browser console clean**

On the front page and the 404 page, at both widths, `read_console_messages` with `onlyErrors`
should report no errors.

- [ ] **Step 5: Commit any fixes and tag the milestone**

```bash
git add -A wp-content/themes/elevation wp-content/plugins/elevation-core bin seed
git commit -m "Foundation acceptance fixes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || true
git tag plan-1-done
```

Then update `docs/superpowers/plans/2026-09-28-roadmap.md`: set Plan 1's status to "done".
