from PIL import Image, ImageDraw

GRID = 16

FACE_HAPPY = [
    "0001111111110000",
    "0111111111111100",
    "1112222222221110",
    "1122222222222110",
    "1122203330222110",
    "1122203330222110",
    "1122222222222110",
    "1122244444422110",
    "1122244444422110",
    "1122223333222110",
    "1122203333022110",
    "1122222222222110",
    "1112222222221110",
    "0111111111111100",
    "0001111111110000",
    "0000000000000000",
]

COLOR_MAP = {
    "1": (210, 105, 30, 255),   # coin body (copper)
    "2": (232, 166, 89, 255),   # coin rim highlight
    "3": (92, 46, 14, 255),     # eye/mouth dark
    "4": (242, 197, 124, 255),  # cheek blush
    "5": (255, 244, 222, 255),  # sparkle
}

NAVY = (20, 33, 61, 255)


def render_icon(size, bg_radius_ratio=0.22, padding_ratio=0.14, transparent_bg=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if not transparent_bg:
        radius = int(size * bg_radius_ratio)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=NAVY)

    pad = int(size * padding_ratio)
    inner = size - pad * 2
    cell = inner / GRID

    for y, row in enumerate(FACE_HAPPY):
        for x, v in enumerate(row):
            if v == "0":
                continue
            color = COLOR_MAP[v]
            x0 = pad + x * cell
            y0 = pad + y * cell
            x1 = pad + (x + 1) * cell
            y1 = pad + (y + 1) * cell
            draw.rectangle([x0, y0, x1, y1], fill=color)

    return img


if __name__ == "__main__":
    render_icon(192).save("/home/claude/tuppence/public/icon-192.png")
    render_icon(512).save("/home/claude/tuppence/public/icon-512.png")
    # Apple touch icon: no transparency, slightly less padding looks better at small sizes
    render_icon(180, padding_ratio=0.12).save("/home/claude/tuppence/public/apple-touch-icon.png")
    # favicon
    render_icon(64, padding_ratio=0.1).save("/home/claude/tuppence/public/favicon.png")
    print("done")
