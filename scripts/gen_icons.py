from PIL import Image, ImageDraw

BASE = (10, 14, 26, 255)       # #0A0E1A
RING_TRACK = (35, 43, 69, 255) # #232B45
RING_FILL = (124, 134, 245, 255)   # #7C86F5 accent
CHECK = (241, 245, 249, 255)   # #F1F5F9 ink


def draw_ring_icon(size, path, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Full-bleed background; OS applies its own mask shape, so keep the
        # glyph inside a conservative safe zone (~40% padding from each edge).
        draw.rectangle([0, 0, size, size], fill=BASE)
        content_margin = size * 0.24
    else:
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=size * 0.22, fill=BASE)
        content_margin = size * 0.20

    cx = cy = size / 2
    r = (size / 2) - content_margin
    ring_width = max(4, round(size * 0.075))

    # Track (full circle, dim)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=RING_TRACK, width=ring_width)

    # ~78% progress arc, starting at 12 o'clock, matching the in-app ring
    start_angle = -90
    end_angle = start_angle + 360 * 0.78
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=start_angle, end=end_angle, fill=RING_FILL, width=ring_width)

    # Checkmark centered inside the ring
    inner = r * 0.62
    p1 = (cx - inner * 0.55, cy + inner * 0.02)
    p2 = (cx - inner * 0.12, cy + inner * 0.42)
    p3 = (cx + inner * 0.58, cy - inner * 0.38)
    check_width = max(6, round(size * 0.06))
    draw.line([p1, p2, p3], fill=CHECK, width=check_width, joint="curve")
    # round the line caps
    for p in (p1, p2, p3):
        draw.ellipse([p[0] - check_width / 2, p[1] - check_width / 2, p[0] + check_width / 2, p[1] + check_width / 2], fill=CHECK)

    img.save(path)


draw_ring_icon(192, "public/icons/icon-192.png")
draw_ring_icon(512, "public/icons/icon-512.png")
draw_ring_icon(512, "public/icons/icon-maskable-512.png", maskable=True)
print("done")
