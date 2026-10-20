"""Generate FORGE app icons (PWA + iOS) into public/icons. Run: python scripts/make-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'public' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)

ORANGE = (255, 107, 26, 255)
INK = (10, 13, 18, 255)
# "F" glyph from the favicon, in a 32×32 box
F = [(9, 22), (9, 10), (21, 10), (21, 13.2), (12.8, 13.2), (12.8, 15), (19.4, 15), (19.4, 18.1), (12.8, 18.1), (12.8, 22)]


def draw(size, *, rounded, glyph_scale=1.0, bg=ORANGE, transparent=True):
    ss = 4  # supersampling for smooth edges
    S = size * ss
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0) if transparent else bg)
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=bg)
    else:
        d.rectangle([0, 0, S, S], fill=bg)
    # glyph centred: original glyph spans x 9..21, y 10..22 (12×12) in a 32 box
    k = S / 32 * glyph_scale
    ox = S / 2 - 15 * k
    oy = S / 2 - 16 * k
    d.polygon([(ox + x * k, oy + y * k) for x, y in F], fill=INK)
    return img.resize((size, size), Image.LANCZOS)


draw(192, rounded=True).save(OUT / 'icon-192.png')
draw(512, rounded=True).save(OUT / 'icon-512.png')
# maskable: full-bleed background, glyph inside the 80 % safe zone
draw(512, rounded=False, glyph_scale=0.8, transparent=False).save(OUT / 'icon-maskable-512.png')
# iOS ignores transparency and rounds corners itself
draw(180, rounded=False, transparent=False).convert('RGB').save(OUT / 'apple-touch-icon.png')
draw(64, rounded=True).save(OUT / 'favicon-64.png')
print('icons written to', OUT)
