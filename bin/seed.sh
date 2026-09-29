#!/usr/bin/env bash
# Build the redesigned site from seed/. Safe to re-run: hand-edited posts are skipped.
#   SEED_FORCE="home other-slug" ./bin/seed.sh    overwrite the named posts anyway
#   ./bin/seed.sh --i-know-this-is-after-cutoff   run after the seed cut-off (spec §9)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

cutoff=$( { grep -v '^#' seed/CUTOFF || true; } | head -1 | tr -d '[:space:]')
if [ "$cutoff" != "none" ] && ! [[ "$cutoff" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "seed/CUTOFF must be \"none\" or a date (YYYY-MM-DD); got \"$cutoff\"." >&2
  exit 1
fi
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
wp option update uploads_use_yearmonth_folders 0
wp option update blogname "$(wp elevation setting get church.name)"
wp option update blogdescription "$(wp elevation setting get church.tagline)"
# SmartCrawl: "Elevation Church Manchester | About", as the redesign's title template.
wp eval '$o = (array) get_option( "wds_onpage_options", [] );
  $o["title-page"] = "%%sitename%% %%sep%% %%title%%";
  $o["title-home"] = "%%sitename%% %%sep%% %%sitedesc%%";
  $o["preset-separator"] = "pipe";
  update_option( "wds_onpage_options", $o );'

# Media first: pages refer to it by path. Sorted, so attachment IDs are the same on every rebuild.
media_files=$(cd seed/media && { find redesign live -type f \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' \) 2>/dev/null || true; } | LC_ALL=C sort | sed 's#^#/seed/media/#')
# shellcheck disable=SC2086
[ -n "$media_files" ] && wp elevation media import $media_files --base=/seed/media
wp elevation setting set --if-empty \
  "hero.slide1.image=@media:redesign/hero/hero-worship.jpg" "hero.slide1.focal=62% 30%" \
  "hero.slide1.alt=Members of the congregation worshipping together on a Sunday morning" \
  "hero.slide2.image=@media:redesign/hero/hero-welcome.jpg" "hero.slide2.focal=64% 28%" \
  "hero.slide2.alt=Two young members smiling and making a heart shape with their hands" \
  "hero.slide3.image=@media:redesign/hero/hero-kids.jpg" "hero.slide3.focal=66% 32%" \
  "hero.slide3.alt=Two children from The Seeds smiling together on a Sunday morning" \
  "hero.slide4.image=@media:redesign/hero/hero-welcome-desk.jpg" "hero.slide4.focal=68% 28%" \
  "hero.slide4.alt=Two members smiling outside the welcome entrance to our venue" \
  "hero.slide5.image=@media:redesign/hero/hero-city.jpg" "hero.slide5.focal=70% 26%" \
  "hero.slide5.alt=A member standing outside our venue on the University of Salford campus"
wp option update timezone_string "Europe/London"
wp option update WPLANG "en_GB" 2>/dev/null || true
wp rewrite structure '/%postname%/' --hard

# Remove the temporary menu left by early setup; other menus (e.g. Site Manager ones) are kept.
# The header is pinned to the "header" menu by includes/navigation.php in elevation-core.
for id in $(wp post list --post_type=wp_navigation --post_status=any --name=header-temp --format=ids); do
  wp post delete "$id" --force
done
seed_post wp_navigation header navigation/header.html "Header"

seed_post page home pages/home.html "Home" \
  --seo-title="%%sitename%% %%sep%% %%sitedesc%%" \
  --meta-description="A Spirit-filled church family in Manchester on one mission: making greatness common. Join us {service.day}s at {service.startTime}, {location.venue}, {location.campus}."

seed_post page im-new pages/im-new.html "I'm New" \
  --meta-description="Planning your first visit to {church.name}? Here's what to expect on a {service.day}, where to park, and what happens with your kids."
seed_post page about pages/about.html "About" \
  --meta-description="Our story, our vision and values, and the people who lead {church.name} — an expression of The Elevation Church."
seed_post page what-we-believe pages/what-we-believe.html "What We Believe" --parent=about \
  --meta-description="The statement of faith of {church.name} — one God in three persons, salvation by grace through faith, the Baptism of the Holy Spirit, and healing in the atonement."

wp option update show_on_front page
wp option update page_on_front "$(wp post list --post_type=page --name=home --field=ID)"
wp rewrite flush --hard
wp cache flush
echo "Seed complete."
