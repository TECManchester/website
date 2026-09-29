#!/usr/bin/env bash
# Fails if a page still shows a raw {settings.token}. Usage: bin/check-tokens.sh / /about/ …
set -euo pipefail
base=${BASE_URL:-http://localhost:8080}
status=0
for path in "$@"; do
  found=$(curl -fsS "$base$path" | grep -oE '\{[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+\}' | sort -u || true)
  if [ -n "$found" ]; then
    echo "$path: $(echo "$found" | tr '\n' ' ')"
    status=1
  fi
done
[ "$status" -eq 0 ] && echo "No raw tokens on $# page(s)."
exit "$status"
