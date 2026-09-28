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
