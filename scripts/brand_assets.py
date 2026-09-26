#!/usr/bin/env python3
"""
Regenerate every ORVIONIS brand asset from the official master (public/brand/orvionis-logo-original.png).

    pip install pillow && python3 scripts/brand_assets.py

The mark is only resampled and cropped — never redrawn or recoloured (docs/BRAND.md).
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "public", "brand")
MASTER = os.path.join(BRAND, "orvionis-logo-original.png")
BG = (8, 9, 13, 255)  # #08090D


def resized(im: Image.Image, n: int) -> Image.Image:
    return im.resize((n, n), Image.LANCZOS)


def tight_mark(src: Image.Image) -> Image.Image:
    """The drawing's bounding box (ignoring faint glow, alpha <= 8) plus 4 % padding, as a transparent square."""
    left, top, right, bottom = src.split()[-1].point(lambda v: 255 if v > 8 else 0).getbbox()
    side = int(max(right - left, bottom - top) * 1.04)
    cx, cy = (left + right) / 2, (top + bottom) / 2
    x0, y0 = int(round(cx - side / 2)), int(round(cy - side / 2))
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(src.crop((x0, y0, x0 + side, y0 + side)), (0, 0))
    return out


def rounded_tile(mark: Image.Image, n: int, scale: float, radius: float) -> Image.Image:
    out = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    mask = Image.new("L", (n, n), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, n - 1, n - 1), radius=int(n * radius), fill=255)
    out.paste(Image.new("RGBA", (n, n), BG), (0, 0), mask)
    m = resized(mark, int(n * scale))
    out.alpha_composite(m, ((n - m.size[0]) // 2, (n - m.size[1]) // 2))
    return out


def square_tile(mark: Image.Image, n: int, scale: float) -> Image.Image:
    out = Image.new("RGBA", (n, n), BG)
    m = resized(mark, int(n * scale))
    out.alpha_composite(m, ((n - m.size[0]) // 2, (n - m.size[1]) // 2))
    return out


def main() -> None:
    src = Image.open(MASTER).convert("RGBA")
    mark = tight_mark(src)
    p = lambda name: os.path.join(BRAND, name)  # noqa: E731

    for n in (1024, 512):  # primary logo: full composition
        resized(src, n).save(p(f"orvionis-logo-{n}.png"), optimize=True)
    for n in (512, 256, 192, 128, 96, 64, 48, 32):  # mark for UI sizes
        resized(mark, n).save(p(f"orvionis-mark-{n}.png"), optimize=True)
    for n in (128, 64, 48):
        resized(mark, n).save(p(f"orvionis-mark-{n}.webp"), quality=90, method=6)

    for n in (16, 32, 48, 64):  # favicons: transparent, readable on light and dark browser UIs
        resized(mark, n).save(p(f"favicon-{n}.png"), optimize=True)
    resized(mark, 256).save(os.path.join(ROOT, "public", "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

    rounded_tile(mark, 192, 0.84, 0.22).save(p("icon-192.png"), optimize=True)
    rounded_tile(mark, 512, 0.84, 0.22).save(p("icon-512.png"), optimize=True)
    square_tile(mark, 512, 0.66).save(p("icon-maskable-512.png"), optimize=True)  # inside the 80 % safe zone
    square_tile(mark, 180, 0.78).convert("RGB").save(p("apple-touch-icon.png"), optimize=True)
    square_tile(mark, 512, 0.8).convert("RGB").save(p("orvionis-mark-on-dark-512.png"), optimize=True)

    ext = os.path.join(BRAND, "extension")
    os.makedirs(ext, exist_ok=True)
    c128 = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    c128.alpha_composite(resized(mark, 96), (16, 16))  # Chrome: 96 px artwork + 16 px padding
    c128.save(os.path.join(ext, "icon-128.png"), optimize=True)
    for n in (16, 32, 48):
        resized(mark, n).save(os.path.join(ext, f"icon-{n}.png"), optimize=True)
    print("brand assets written to", BRAND)


if __name__ == "__main__":
    main()
