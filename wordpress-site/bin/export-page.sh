#!/usr/bin/env bash
# Write a page's current content back into seed/ so a hand edit made in wp-admin before the cut-off
# becomes part of the seed. Media become {{media:…}} refs again. Review the diff, then commit.
#   bin/export-page.sh about                     → seed/pages/about.html
#   bin/export-page.sh what-we-believe pages/what-we-believe.html
set -euo pipefail
cd "$(dirname "$0")/.."
slug=${1:?usage: bin/export-page.sh <slug> [seed-relative-file]}
file=seed/${2:-pages/$slug.html}
docker compose run --rm -T wpcli wp --user=admin elevation export page "$slug" > "$file.tmp"
mv "$file.tmp" "$file"
echo "Wrote $file — check it with git diff, then commit."
