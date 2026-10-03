#!/usr/bin/env bash
# Deploy the theme and plugin to a WordPress site through its own wp-admin upload forms, the same thing
# as Appearance → Themes → Upload and Plugins → Upload with "Replace current with uploaded". Code only:
# the site's database (pages, events, groups, forms, settings) is never touched.
#
#   DEPLOY_URL=https://elevationmanchester.org DEPLOY_USER=<administrator> ./bin/deploy.sh
#
# The password comes from DEPLOY_PASSWORD or is prompted. The three variables may also live in .env.deploy
# (gitignored). Runs ./bin/package.sh first, so commit first; --no-package deploys the zips already in dist/.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.deploy ]; then set -a; source .env.deploy; set +a; fi
: "${DEPLOY_URL:?set DEPLOY_URL, e.g. https://elevationmanchester.org}"
: "${DEPLOY_USER:?set DEPLOY_USER to a WordPress Administrator username}"
if [ -z "${DEPLOY_PASSWORD:-}" ]; then
  read -r -s -p "WordPress password for $DEPLOY_USER at $DEPLOY_URL: " DEPLOY_PASSWORD; echo
fi

# On the local stack the theme and plugin folders are this working tree (bind mounts), so an upload would
# replace them with the package (dropping tests/ and node_modules). Edit files there; don't deploy to it.
case "$DEPLOY_URL" in
  *localhost*|*127.0.0.1*)
    if [ "${DEPLOY_ALLOW_LOCAL:-}" != "1" ]; then
      echo "Refusing to deploy to $DEPLOY_URL: that is the local working tree. Set DEPLOY_ALLOW_LOCAL=1 to override." >&2
      exit 1
    fi ;;
esac

if [ "${1:-}" = "--no-package" ]; then
  [ -f dist/elevation.zip ] && [ -f dist/elevation-core.zip ] || { echo "dist/ has no zips; run ./bin/package.sh" >&2; exit 1; }
else
  ./bin/package.sh
fi

url=${DEPLOY_URL%/}
jar=$(mktemp)
trap 'rm -f "$jar"' EXIT
# Live rejects sign-ins from non-browser user agents (WordPress redirects back to the login form), so look like one.
ua="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 elevation-deploy"
curl_() {
  curl -sS -L -b "$jar" -c "$jar" -A "$ua" -e "$url/wp-admin/" -H "Origin: $url" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: en-GB,en;q=0.9" "$@"
}

# Sign in like a browser: the test cookie first, then the form.
curl_ -o /dev/null "$url/wp-login.php"
login_page=$(mktemp)
curl_ -o "$login_page" -e "$url/wp-login.php" --data-urlencode "log=$DEPLOY_USER" --data-urlencode "pwd=$DEPLOY_PASSWORD" \
  -d "testcookie=1" -d "wp-submit=Log In" -d "redirect_to=$url/wp-admin/" "$url/wp-login.php"
if grep -q "One moment, please" "$login_page"; then
  echo "The host's bot protection is holding this computer's address (\"One moment, please...\" page). Wait 10 minutes or so and try again; if it keeps happening, ask the parent church's IT to allow-list your IP." >&2
  rm -f "$login_page"; exit 1
fi
rm -f "$login_page"
if ! grep -q "wordpress_logged_in" "$jar"; then
  echo "Sign-in to $url failed: wrong username or password, or a security plugin blocks it." >&2
  exit 1
fi

# The nonce hidden in the upload form on the given admin page.
nonce_for() { # upload-theme | upload-plugin
  python3 -c '
import re, sys
html, action = sys.stdin.read(), sys.argv[1]
i = html.find("action=" + action)
m = re.search(r"name=\"_wpnonce\" value=\"([^\"]+)\"", html[i:]) if i >= 0 else None
sys.exit("no %s form found (not an Administrator?)" % action) if not m else print(m.group(1))' "$1"
}

upload() { # theme|plugin  zip  form-field  admin-page
  local kind=$1 zip=$2 field=$3 page=$4 nonce out
  nonce=$(curl_ "$url/wp-admin/$page" | nonce_for "upload-$kind")
  out=$(curl_ -F "$field=@$zip;type=application/zip" -F "_wpnonce=$nonce" -F "_wp_http_referer=/wp-admin/$page" \
    "$url/wp-admin/update.php?action=upload-$kind&overwrite=update-$kind")
  if grep -q -E "(Theme|Plugin) (updated|installed) successfully" <<<"$out"; then
    echo "ok    $kind  $(basename "$zip")"
  else
    echo "FAIL  $kind  $(basename "$zip"). WordPress said:" >&2
    grep -o -E "<p>[^<]{3,}</p>|<div[^>]*(error|notice)[^>]*>[^<]+" <<<"$out" | sed 's/<[^>]*>//g' | head -8 >&2
    exit 1
  fi
}

upload theme  dist/elevation.zip      themezip  "theme-install.php?upload"
upload plugin dist/elevation-core.zip pluginzip "plugin-install.php?tab=upload"

# Check that the site now serves what we packaged (static files only; PHP files can't be fetched).
verify() { # zip  path-in-zip  url-path
  local want have
  want=$(unzip -p "$1" "$2" | shasum -a 256 | cut -c1-16)
  have=$(curl -sS -A "$ua" "$url/wp-content/$3?v=$(date +%s)" | shasum -a 256 | cut -c1-16)
  if [ "$want" = "$have" ]; then echo "ok    live $3 matches"; else echo "WARN  live $3 differs from the package (cache? partial upload?)"; fi
}
verify dist/elevation.zip      elevation/style.css             themes/elevation/style.css
verify dist/elevation.zip      elevation/assets/css/site.css   themes/elevation/assets/css/site.css
verify dist/elevation-core.zip elevation-core/build/editor/index.js plugins/elevation-core/build/editor/index.js
echo "Deployed to $url. Hard-refresh the site (it sends 10-minute browser caching) and check the pages you changed."
