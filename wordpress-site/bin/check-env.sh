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
# wp db query needs SSL off against this MariaDB image; ask WordPress itself instead.
db_version=$(wp eval 'global $wpdb; echo $wpdb->get_var("SELECT VERSION()");')
check "db major" "$DB_MAJOR" "$(echo "$db_version" | cut -d. -f1-2)"

for entry in $PLUGINS; do
  slug=${entry%%@*}; rest=${entry#*@}; version=${rest%%:*}; state=${rest#*:}
  check "plugin $slug version" "$version" "$(wp plugin get "$slug" --field=version || echo missing)"
  check "plugin $slug status" "$state" "$(wp plugin get "$slug" --field=status || echo missing)"
done
exit $fail
