#!/usr/bin/env bash
# Downloads the kept pages' images from the live site's public URLs into seed/media/live/ (gitignored),
# then checks them against seed/media/live.sha256. Run once with --record to write the checksums.
set -euo pipefail
cd "$(dirname "$0")/.."
while read -r path url; do
  case "$path" in '' | '#'*) continue ;; esac
  dest="seed/media/$path"
  [ -f "$dest" ] && continue
  mkdir -p "$(dirname "$dest")"
  curl -fsSL --retry 3 -o "$dest.part" "$url"
  mv "$dest.part" "$dest"
  echo "Fetched $path"
done < seed/media/live.manifest
if [ "${1:-}" = "--record" ]; then
  (cd seed/media && grep -v '^#' live.manifest | awk 'NF { print $1 }' | xargs shasum -a 256) > seed/media/live.sha256
  echo "Recorded $(wc -l < seed/media/live.sha256 | tr -d ' ') checksums."
else
  (cd seed/media && shasum -a 256 -c --quiet live.sha256)
fi
