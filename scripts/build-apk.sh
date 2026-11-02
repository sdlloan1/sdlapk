#!/usr/bin/env bash
# Build the installable Android APK from the current checkout.
#
# 1. builds the web bundle with the Base44 API origin baked in (the WebView has
#    no same-origin backend of its own),
# 2. syncs the bundle into the Capacitor Android project,
# 3. assembles the APK inside the Android toolchain container,
# 4. publishes it at public/download/sdl.apk so it can be downloaded from the
#    running preview at /download/sdl.apk.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.base44.yml"
API_BASE_URL="${VITE_BASE44_API_BASE_URL:-https://base44.app}"

# Keep the previously published APK out of the bundle it is built from.
rm -rf public/download

$COMPOSE up -d web
$COMPOSE exec -T web sh -ec "VITE_BASE44_API_BASE_URL='${API_BASE_URL}' npm run build && npx cap sync android"
$COMPOSE run --rm android

mkdir -p public/download
cp android/app/build/outputs/apk/debug/app-debug.apk public/download/sdl.apk
echo "APK ready: public/download/sdl.apk ($(du -h public/download/sdl.apk | cut -f1))"
