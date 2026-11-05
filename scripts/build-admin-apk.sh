#!/usr/bin/env bash
# Build the admin-only Android APK from the current checkout.
#
# Same pipeline as scripts/build-apk.sh, except the web bundle is built with
# VITE_ADMIN_APP=true (the app opens the admin panel and nothing else) and the
# APK gets its own applicationId and launcher label, so it installs next to the
# customer app instead of replacing it.
#
#   ./scripts/build-admin-apk.sh
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.base44.yml"
API_BASE_URL="${VITE_BASE44_API_BASE_URL:-https://base44.app}"
OUT="public/download/SDL Admin - Shubh Dhan Lakshmi.apk"

# Keep the previously published downloads out of the bundle being built, but put
# them back afterwards so the customer APK and the Play bundle stay available.
STASH="$(mktemp -d)"
if [ -d public/download ]; then mv public/download "$STASH/download"; fi

$COMPOSE up -d web
$COMPOSE exec -T web sh -ec "VITE_ADMIN_APP=true VITE_BASE44_API_BASE_URL='${API_BASE_URL}' npm run build && npx cap sync android"
$COMPOSE run --rm -e SDL_ADMIN_APP=true android

mkdir -p public/download
cp android/app/build/outputs/apk/debug/app-debug.apk "$OUT"
if [ -d "$STASH/download" ]; then cp -n "$STASH"/download/* public/download/ 2>/dev/null || true; fi
rm -rf "$STASH"
echo "Admin APK ready: $OUT ($(du -h "$OUT" | cut -f1))"
