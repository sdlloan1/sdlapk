#!/usr/bin/env python3
"""Install the supplied appicon.co pack (`assets/app-icons/`) as the Android
launcher icons.

The pack is the source of truth: `assets/app-icons/android/mipmap-*/ic_launcher.png`
are the legacy flat icons at their own sizes, and
`assets/app-icons/android/mipmap-*/` has no background layer because the pack
uses a solid white adaptive background (#FFFFFF, `@color/ic_launcher_background`).

  * ic_launcher.png       - the pack's flat icon, copied at its own size
  * ic_launcher_foreground.png - the pack's adaptive-foreground.png (which already
                            carries the appicon.co safe-zone padding) scaled to
                            the 108dp layer
  * ic_launcher_round.png - the flat icon cropped to a circle for round launchers
  * ic_launcher_background.png - removed; the background is a colour resource

Run it with scripts/build-android-icons.sh.
"""

import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "assets", "app-icons", "android")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

# density bucket -> legacy flat icon px (the 48dp icon at that density)
DENSITIES = {
    "mipmap-ldpi": 36,
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
# The adaptive layer is 108dp, i.e. 2.25x the 48dp flat icon.
LAYER_FACTOR = 2.25


def flat_icon(folder, size, fallback):
    """The pack's flat icon for this density, resized only if the pack lacks it."""
    path = os.path.join(PACK, folder, "ic_launcher.png")
    if os.path.exists(path):
        return Image.open(path).convert("RGBA")
    return fallback.resize((size, size), Image.LANCZOS)


def round_icon(flat, size):
    """The flat icon cropped to a circle for round legacy launchers."""
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(flat, (0, 0), mask)
    return out


def main():
    foreground = Image.open(os.path.join(PACK, "adaptive-foreground.png")).convert("RGBA")
    fallback = Image.open(os.path.join(PACK, "mipmap-xxxhdpi", "ic_launcher.png")).convert("RGBA")

    for folder, flat_px in DENSITIES.items():
        out = os.path.join(RES, folder)
        os.makedirs(out, exist_ok=True)
        layer_px = int(round(flat_px * LAYER_FACTOR))

        flat = flat_icon(folder, flat_px, fallback)
        flat.save(os.path.join(out, "ic_launcher.png"), optimize=True)
        round_icon(flat, flat_px).save(os.path.join(out, "ic_launcher_round.png"), optimize=True)
        foreground.resize((layer_px, layer_px), Image.LANCZOS).save(
            os.path.join(out, "ic_launcher_foreground.png"), optimize=True
        )
        # The adaptive background is @color/ic_launcher_background (#FFFFFF).
        stale_bg = os.path.join(out, "ic_launcher_background.png")
        if os.path.exists(stale_bg):
            os.remove(stale_bg)
        print(f"{folder}: flat {flat_px}px, adaptive {layer_px}px")


if __name__ == "__main__":
    main()
