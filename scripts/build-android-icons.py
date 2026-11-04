#!/usr/bin/env python3
"""Regenerate the Android launcher icons from assets/android-icon.png.

The source artwork is a full-bleed rounded square: the Lakshmi figure at the top,
"SDL" and the tagline at the bottom. Android's adaptive icon only guarantees the
66dp circle of its 108dp layer, so a straight inset of the artwork gets the text
and the diyas clipped by the launcher mask.

This script keeps the artwork untouched and only re-composes it:

  * background layer - the artwork's gradient rebuilt full-bleed (the corners of
    the rounded square are transparent, so a fitted gradient is used),
  * foreground layer - the artwork scaled down so that all of its content fits
    inside the 66dp safe circle, with a soft feathered edge,
  * flat ic_launcher / ic_launcher_round PNGs for launchers without adaptive
    icon support.

Run it with scripts/build-android-icons.sh.
"""

import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "assets", "android-icon.png")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

CANVAS = 1080  # 108dp at xxxhdpi
SAFE_RADIUS = 330  # 33dp - the 66dp circle Android guarantees is never clipped
FEATHER = 0.12  # fraction of the artwork radius that fades into the background

# density bucket -> (flat icon px, adaptive layer px)
DENSITIES = {
    "mipmap-ldpi": (36, 81),
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}


def sample(im, cx, cy, patch=18):
    """Median-ish colour of a small patch, ignoring transparent pixels."""
    px = im.load()
    colours = []
    for y in range(max(0, cy - patch), min(im.height, cy + patch)):
        for x in range(max(0, cx - patch), min(im.width, cx + patch)):
            r, g, b, a = px[x, y]
            if a > 200:
                colours.append((r, g, b))
    colours.sort(key=lambda c: c[0] + c[1] + c[2])
    return colours[len(colours) // 2]


def gradient_background(im, size):
    """Bilinear gradient fitted from the artwork's four inset corners."""
    s = im.width
    inset = int(s * 0.10)
    tl = sample(im, inset, inset)
    tr = sample(im, s - inset, inset)
    bl = sample(im, inset, s - inset)
    br = sample(im, s - inset, s - inset)

    bg = Image.new("RGB", (size, size))
    px = bg.load()
    for y in range(size):
        fy = y / (size - 1)
        left = tuple(tl[i] + (bl[i] - tl[i]) * fy for i in range(3))
        right = tuple(tr[i] + (br[i] - tr[i]) * fy for i in range(3))
        for x in range(size):
            fx = x / (size - 1)
            px[x, y] = tuple(int(left[i] + (right[i] - left[i]) * fx) for i in range(3))
    return bg


def content_bbox(im, bg_model):
    """Bounding box of whatever deviates from the fitted gradient."""
    s = im.width
    px = im.load()
    model = bg_model.resize((s, s), Image.BILINEAR).load()
    minx, miny, maxx, maxy = s, s, 0, 0
    for y in range(s):
        for x in range(s):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            mr, mg, mb = model[x, y]
            if max(abs(r - mr), abs(g - mg), abs(b - mb)) > 40:
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    return minx, miny, maxx, maxy


def feathered(im, size):
    """Artwork resized to `size` with its edge fading out."""
    art = im.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 255)
    mask = mask.filter(ImageFilter.GaussianBlur(size * FEATHER / 2))
    art.putalpha(Image.composite(art.split()[3], Image.new("L", (size, size), 0), mask))
    return art


def main():
    src = Image.open(SOURCE).convert("RGBA")
    bg_model = gradient_background(src, CANVAS)

    x0, y0, x1, y1 = content_bbox(src, bg_model)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    radius = max(
        ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
        for x in (x0, x1)
        for y in (y0, y1)
    )
    # Fraction of the artwork width that its content circle occupies.
    content_ratio = radius / src.width
    art_size = int(SAFE_RADIUS / content_ratio)
    print(
        f"content bbox {x0},{y0}..{x1},{y1}  radius {radius:.0f}/{src.width}"
        f"  artwork {art_size}/{CANVAS}px"
    )

    art = feathered(src, art_size)
    scale = art_size / src.width
    # Centre the artwork by its content, not by its canvas (the content sits a
    # little above the middle of the square, which would look off in the circle).
    offset = (
        int(round(CANVAS / 2 - cx * scale)),
        int(round(CANVAS / 2 - cy * scale)),
    )

    background = bg_model.copy()
    foreground = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    foreground.paste(art, offset, art)
    flat = background.copy()
    flat.paste(art, offset, art)

    for folder, (flat_px, layer_px) in DENSITIES.items():
        out = os.path.join(RES, folder)
        os.makedirs(out, exist_ok=True)
        background.resize((layer_px, layer_px), Image.LANCZOS).save(
            os.path.join(out, "ic_launcher_background.png"), optimize=True
        )
        foreground.resize((layer_px, layer_px), Image.LANCZOS).save(
            os.path.join(out, "ic_launcher_foreground.png"), optimize=True
        )
        flat_small = flat.resize((flat_px, flat_px), Image.LANCZOS)
        flat_small.save(os.path.join(out, "ic_launcher.png"), optimize=True)
        flat_small.save(os.path.join(out, "ic_launcher_round.png"), optimize=True)


if __name__ == "__main__":
    main()
