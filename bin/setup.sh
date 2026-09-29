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

if ! wp --url="$WP_URL" core is-installed 2>/dev/null; then
  # Only a database with no WordPress tables is a fresh install. If the tables exist (or we cannot tell), is-installed failed for another reason: stop rather than wipe uploads.
  # (`wp db query` needs SSL off against this image, so ask WordPress itself.)
  tables=$(wp eval 'global $wpdb; echo $wpdb->get_var( "SHOW TABLES LIKE \"{$wpdb->prefix}options\"" ) ? "yes" : "no";' 2>/dev/null | tail -n1 || true)
  if [ "$tables" != "no" ]; then
    echo "WordPress reports not installed, but its database tables exist (or could not be checked: '${tables:-no answer}'). Refusing to wipe uploads; investigate first." >&2
    exit 1
  fi
  # uploads is a host bind mount that outlives `down -v`; the seed recreates all media, so a fresh install starts empty (no -1/-2 file names).
  [ -d wp-content/uploads ] && find wp-content/uploads -mindepth 1 -delete
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
