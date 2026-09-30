#!/usr/bin/env bash
# Every seeded page answers 200 and every redesign redirect answers 301 to the right place (spec §6.9, §12).
set -euo pipefail
base=${BASE_URL:-http://localhost:8080}
fail=0
check() { # path expected-status [expected-location]
  local headers got loc
  headers=$(curl -sI "$base$1")
  got=$(printf '%s\n' "$headers" | awk 'NR == 1 { print $2 }')
  loc=$(printf '%s\n' "$headers" | awk 'tolower($1) == "location:" { print $2 }' | tr -d '\r')
  case "$loc" in /*) loc="$base$loc" ;; esac
  if [ "$got" != "$2" ] || { [ -n "${3:-}" ] && [ "$loc" != "$base$3" ]; }; then
    echo "FAIL $1: got $got ${loc:-} (want $2 ${3:+$base$3})"
    fail=1
  fi
}
for p in / /im-new/ /about/ /about/what-we-believe/ /watch/ /get-involved/ /give/ /prayer/ /contact/ /privacy/ \
         /resources/ /resources/alpha/ /resources/etracts/ /church-in-the-park-2025/; do
  check "$p" 200
done
# Events (Plan 3): the archive, a fixture, a past fixture (still reachable by URL) and a missing one.
for p in /events/ /events/men-of-honour/ /events/prayer-and-worship-evening/; do
  check "$p" 200
done
check /events/no-such-event/ 404
check /home 301 /
check /sample-page 301 /
check /who-we-are 301 /about
check /volunteer 301 '/get-involved#serve'
check /join-our-community 301 '/im-new#plan-a-visit'
check /guest 301 '/im-new#connect-card'
check /privacy-policy 301 /privacy
# flag_query=pass appends the visitor's query string to the target (before any #fragment).
check '/who-we-are/?utm_source=x' 301 '/about?utm_source=x'
check '/volunteer?fbclid=abc' 301 '/get-involved?fbclid=abc#serve'
check /connect-groups/ 200
check "/connect-groups/?area=salford&meets=tuesday" 200
check "/connect-groups/?meets=someday&area=%3Cscript%3E" 200
[ "$fail" -eq 0 ] && echo "All URLs as expected."
exit "$fail"
