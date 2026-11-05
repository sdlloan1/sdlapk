#!/usr/bin/env bash
# Regenerate the Android launcher icons from assets/android-icon.png.
# See scripts/build-android-icons.py for what it composes.
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm -v "$PWD":/app -w /app python:3.11-slim \
  sh -ec 'pip install --quiet pillow && python scripts/build-android-icons.py'
