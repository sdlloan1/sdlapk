#!/usr/bin/env bash
# Build the Google Play upload bundle (.aab) from the current checkout.
#
# 1. builds the web bundle with the Base44 API origin baked in,
# 2. syncs the bundle into the Capacitor Android project,
# 3. assembles a release bundle signed with android/keystore/keystore.properties,
# 4. copies it to public/download/sdl.aab.
#
# The upload keystore is git-ignored and must exist before running this; see
# android/KEYSTORE.md for the one-time setup.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.base44.yml"
API_BASE_URL="${VITE_BASE44_API_BASE_URL:-https://base44.app}"

if [ ! -f android/keystore/keystore.properties ]; then
  echo "Missing android/keystore/keystore.properties — see android/KEYSTORE.md" >&2
  exit 1
fi

# Keep the previously published downloads out of the bundle being built, but put
# them back afterwards so the APK and the Play bundle can both be served.
STASH="$(mktemp -d)"
if [ -d public/download ]; then mv public/download "$STASH/download"; fi

$COMPOSE up -d web
$COMPOSE exec -T web sh -ec "VITE_BASE44_API_BASE_URL='${API_BASE_URL}' npm run build && npx cap sync android"
$COMPOSE run --rm android sh -ec 'cd android && ./gradlew --no-daemon bundleRelease'

mkdir -p public/download
cp android/app/build/outputs/bundle/release/app-release.aab public/download/sdl.aab
if [ -d "$STASH/download" ]; then cp -n "$STASH"/download/* public/download/ 2>/dev/null || true; fi
rm -rf "$STASH"
echo "AAB ready: public/download/sdl.aab ($(du -h public/download/sdl.aab | cut -f1))"
