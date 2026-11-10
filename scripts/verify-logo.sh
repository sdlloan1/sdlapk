#!/usr/bin/env bash
# The SDL logo is approved and final: it must stay byte-for-byte identical to
# assets/brand-logo.png. A source export, a copied-in update, or a regenerated
# asset must never replace it.
#
# Runs automatically before every `npm run build` (npm "prebuild"), so the web
# bundle, both APKs and the Play bundle all carry the approved logo. If a logo
# file was replaced, it is restored from assets/brand-logo.png and the script
# tells you what it fixed.
#
# To change the logo on purpose: replace assets/brand-logo.png with the new
# artwork, copy it to public/logo.png and assets/android-icon.png, then run
# ./scripts/build-android-icons.sh so the launcher icons match.
#
#   ./scripts/verify-logo.sh        (restore if changed)
#   ./scripts/verify-logo.sh --check (fail if changed, change nothing)
set -euo pipefail
cd "$(dirname "$0")/.."

APPROVED="assets/brand-logo.png"
PROTECTED="public/logo.png assets/android-icon.png"
MODE="${1:-restore}"

if [ ! -f "$APPROVED" ]; then
  echo "verify-logo: missing approved copy at $APPROVED" >&2
  exit 1
fi

approved_hash="$(sha256sum "$APPROVED" | cut -d' ' -f1)"
failed=0

for file in $PROTECTED; do
  if [ ! -f "$file" ]; then
    echo "verify-logo: $file is missing" >&2
    failed=1
    [ "$MODE" = "--check" ] || cp "$APPROVED" "$file"
    continue
  fi

  if [ "$(sha256sum "$file" | cut -d' ' -f1)" != "$approved_hash" ]; then
    failed=1
    if [ "$MODE" = "--check" ]; then
      echo "verify-logo: $file differs from the approved logo" >&2
    else
      echo "verify-logo: $file differed from the approved logo — restored it" >&2
      cp "$APPROVED" "$file"
    fi
  fi
done

if [ "$failed" = "1" ] && [ "$MODE" = "--check" ]; then
  echo "verify-logo: logo changed; see the header of scripts/verify-logo.sh to change it on purpose" >&2
  exit 1
fi

echo "verify-logo: OK (sha256 ${approved_hash:0:12}…)"
