#!/usr/bin/env bash
# Package the theme and plugin for upload to the live site (wp-admin → Appearance → Themes → Add New → Upload,
# and Plugins → Add New → Upload; both offer "Replace current with uploaded"). Code only: the live database
# (pages, events, groups, forms, settings) is never touched.
#
# Packages come from the last commit, so commit first. node_modules, vendor and tests are left out.
#   ./bin/package.sh            → dist/elevation.zip, dist/elevation-core.zip
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain -- wp-content/themes/elevation wp-content/plugins/elevation-core)" ]; then
  echo "Uncommitted changes in the theme or plugin. Commit them first so the package matches git." >&2
  git status --short -- wp-content/themes/elevation wp-content/plugins/elevation-core >&2
  exit 1
fi

sha=$(git rev-parse --short HEAD)
top=$(git rev-parse --show-toplevel)
here=$(pwd)
mkdir -p dist
rm -f dist/elevation.zip dist/elevation-core.zip

# git archive resolves a sub-tree relative to the repository root, so run it from there.
cd "$top"
git archive --format=zip --prefix=elevation/ -o "$here/dist/elevation.zip" HEAD:wordpress-site/wp-content/themes/elevation
git archive --format=zip --prefix=elevation-core/ -o "$here/dist/elevation-core.zip" HEAD:wordpress-site/wp-content/plugins/elevation-core \
  ':!tests' ':!phpunit.xml.dist' ':!composer.json' ':!composer.lock' ':!package.json' ':!package-lock.json' ':!.gitignore'
cd "$here"

for z in dist/elevation.zip dist/elevation-core.zip; do
  printf '%s  %s  (%s files, commit %s)\n' "$z" "$(du -h "$z" | cut -f1)" "$(unzip -l "$z" | tail -1 | awk '{print $2}')" "$sha"
done
echo "Upload both in wp-admin on the live site, choosing \"Replace current with uploaded\"."
