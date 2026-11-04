#!/usr/bin/env python3
"""Regenerate the Android launcher icons from assets/android-icon.png.

The artwork is a full-bleed rounded square (Lakshmi, "SDL" and the tagline).
Android's adaptive icon only guarantees the 66dp circle of its 108dp layer, so
drawing the artwork full-bleed clips the tagline and the diyas in the launcher
mask.

The composition follows the supplied appicon.co pack exactly:

  * foreground layer - the whole artwork scaled to 66% of the layer (71dp),
    which is the 66dp safe zone plus its edge; the square is fully outside the
    launcher mask, so no seam ever shows,
  * background layer - the artwork stretched over the full layer and blurred,
    so a launcher that reveals or zooms past the mask shows the artwork's own
    colours instead of a hard edge,
  * flat ic_launcher.png at the pack's sizes for launchers without adaptive
    icon support, and a circular ic_launcher_round.png beside it.

Run it with scripts/build-android-icons.sh.
"""

import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "assets", "android-icon.png")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

CANVAS = 1080  # 108dp at xxxhdpi
# 676/1024: the appicon.co pack draws the artwork at 66% of the 108dp layer.
ART_RATIO = 676 / 1024
# Backdrop blur as a fraction of the layer, so the reveal has no sharp content.
BLUR_RATIO = 0.06

# density bucket -> (flat icon px, adaptive layer px)
DENSITIES = {
    "mipmap-ldpi": (36, 81),
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}


def backdrop(im, size):
    """The artwork stretched over the whole layer and blurred."""
    bg = im.resize((size, size), Image.LANCZOS)
    return bg.filter(ImageFilter.GaussianBlur(size * BLUR_RATIO))


def foreground(im, size):
    """The artwork centred at the adaptive-icon safe-zone size."""
    art_size = int(round(size * ART_RATIO))
    art = im.resize((art_size, art_size), Image.LANCZOS)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = (size - art_size) // 2
    layer.paste(art, (offset, offset), art)
    return layer


def round_icon(im, size):
    """The flat icon cropped to a circle for round legacy launchers."""
    flat = im.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(flat, (0, 0), mask)
    return out


def main():
    src = Image.open(SOURCE).convert("RGBA")
    canvas_bg = backdrop(src, CANVAS)
    canvas_fg = foreground(src, CANVAS)

    for folder, (flat_px, layer_px) in DENSITIES.items():
        out = os.path.join(RES, folder)
        os.makedirs(out, exist_ok=True)
        canvas_bg.resize((layer_px, layer_px), Image.LANCZOS).save(
            os.path.join(out, "ic_launcher_background.png"), optimize=True
        )
        canvas_fg.resize((layer_px, layer_px), Image.LANCZOS).save(
            os.path.join(out, "ic_launcher_foreground.png"), optimize=True
        )
        src.resize((flat_px, flat_px), Image.LANCZOS).save(
            os.path.join(out, "ic_launcher.png"), optimize=True
        )
        round_icon(src, flat_px).save(
            os.path.join(out, "ic_launcher_round.png"), optimize=True
        )
        print(f"{folder}: flat {flat_px}px, adaptive {layer_px}px")


if __name__ == "__main__":
    main()
