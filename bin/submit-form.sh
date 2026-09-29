#!/usr/bin/env bash
# Submit a church form the way the browser does (local testing only; spec §12 "every form submitted locally").
#   ./bin/submit-form.sh contact name='Test Visitor' email=test@example.com message='Hello'
#   ./bin/submit-form.sh g-squad 'names[first_name]=Test' 'names[last_name]=Visitor' email=test@example.com 'teams[]=Care'
# Prints Fluent Forms' JSON answer: {"data":{"message":…}} when it was accepted, {"errors":{…}} when not.
set -euo pipefail
cd "$(dirname "$0")/.."
key=${1:?Usage: bin/submit-form.sh <form key> field=value …}; shift
id=$(docker compose run --rm -T wpcli wp --user=admin elevation forms id "$key" | tr -d '\r')
data=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.urlencode([tuple(a.split("=", 1)) if "=" in a else (a, "") for a in sys.argv[1:]]))' "item_${id}__fluent_sf=" "$@")
curl -s "${BASE_URL:-http://localhost:8080}/wp-admin/admin-ajax.php" \
  --data-urlencode "action=fluentform_submit" --data-urlencode "form_id=$id" --data-urlencode "data=$data"
echo
