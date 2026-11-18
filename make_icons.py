#!/usr/bin/env python3
"""Render the Ignition Timing Helper app icons (192/512 PNG) from the
same flywheel-mark design as icon.svg, using Pillow only (no SVG
renderer needed).

Run from the project root:  python3 make_icons.py
"""
import math
from PIL import Image, ImageDraw, ImageFont

BG = (28, 26, 23)        # #1c1a17
PAPER = (244, 239, 228)  # #f4efe4
INK = (33, 29, 24)       # #211d18
AMBER = (217, 142, 31)   # #d98e1f
RED = (179, 38, 30)      # #b3261e


def font(size):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_icon(size):
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    # Rounded background.
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=size // 5, fill=BG)
    cx = cy = size // 2
    r = int(size * 0.383)
    # Flywheel face.
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PAPER)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=AMBER, width=max(4, size // 36))
    d.ellipse([cx - int(r * 0.82), cy - int(r * 0.82),
               cx + int(r * 0.82), cy + int(r * 0.82)],
              outline=INK, width=max(2, size // 128))
    # Degree tick marks around the top arc (every 30 degrees).
    for deg in (-120, -90, -60, -30, 0, 30, 60, 90, 120):
        a = math.radians(deg - 90)
        long_tick = deg in (-90, 0, 90)
        r1 = 0.86 if long_tick else 0.80
        x1 = cx + int(r * r1 * math.cos(a))
        y1 = cy + int(r * r1 * math.sin(a))
        x2 = cx + int(r * 0.70 * math.cos(a))
        y2 = cy + int(r * 0.70 * math.sin(a))
        d.line([x1, y1, x2, y2], fill=INK, width=max(4, size // 50))
    # TDC mark: a bold vertical line at top (12 o'clock).
    d.line([cx, cy - int(r * 0.98), cx, cy - int(r * 0.62)],
           fill=RED, width=max(6, size // 32))
    # Advance mark: amber line 20 degrees before TDC (counter-clockwise).
    a = math.radians(-20 - 90)
    x1 = cx + int(r * 0.98 * math.cos(a))
    y1 = cy + int(r * 0.98 * math.sin(a))
    x2 = cx + int(r * 0.70 * math.cos(a))
    y2 = cy + int(r * 0.70 * math.sin(a))
    d.line([x1, y1, x2, y2], fill=AMBER, width=max(5, size // 40))
    # Hub.
    hr = max(8, size // 20)
    d.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=INK)
    d.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], outline=AMBER, width=max(2, size // 100))
    # Labels.
    f_small = font(max(14, size // 12))
    f_big = font(max(18, size // 10))
    d.text((cx, cy + int(r * 0.42)), "20°", fill=RED, font=f_big, anchor="mm")
    d.text((cx, cy + int(r * 0.66)), "BTDC", fill=INK, font=f_small, anchor="mm")
    return img


if __name__ == "__main__":
    import os
    os.makedirs("icons", exist_ok=True)
    for size in (192, 512):
        draw_icon(size).save(f"icons/icon-{size}.png")
        print(f"wrote icons/icon-{size}.png")
