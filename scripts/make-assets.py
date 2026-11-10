"""Derive web assets from brand/ originals.

Findings that drive this script (measured, see README palette note):
- brand PNG: IHDR colortype 6 (RGBA, 8-bit), 91.5% of pixels alpha 0, and every
  alpha-0 pixel carries RGB (0,0,0). A naive resize would bleed black into the
  soft edge, so resizing is done on premultiplied alpha.
"""
import os, sys
from PIL import Image
import numpy as np

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, 'brand', 'LOGO ELYQUID PNG.png')
out = os.path.join(root, 'public')
os.makedirs(os.path.join(out, 'brand'), exist_ok=True)

im = Image.open(src).convert('RGBA')
a = np.asarray(im).astype(np.float64)
alpha = a[..., 3:4] / 255.0
pm = np.concatenate([a[..., :3] * alpha, alpha * 255.0], axis=2)  # premultiplied

def resize_pm(box_img_pm, size):
    chans = []
    for c in range(4):
        ch = Image.fromarray(box_img_pm[..., c].astype(np.float32), mode='F')
        chans.append(np.asarray(ch.resize((size, size), Image.LANCZOS)))
    r = np.stack(chans, axis=2)
    al = np.clip(r[..., 3:4], 0, 255) / 255.0
    rgb = np.where(al > 1e-6, r[..., :3] / np.maximum(al, 1e-6), 0)
    res = np.concatenate([np.clip(rgb, 0, 255), np.clip(r[..., 3:4], 0, 255)], axis=2)
    return Image.fromarray(np.rint(res).astype(np.uint8), 'RGBA')

# crop to a square around the drop with small margin
bbox = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
x0, y0, x1, y1 = bbox
side = int(max(x1 - x0, y1 - y0) * 1.12)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
l, t = cx - side // 2, cy - side // 2
crop = pm[max(t, 0):t + side, max(l, 0):l + side]
pad = np.zeros((side, side, 4))
pad[:crop.shape[0], :crop.shape[1]] = crop
pm_sq = pad

for size, name in [(512, 'logo-512.png'), (192, 'logo-192.png'), (96, 'logo-96.png'), (180, 'apple-touch-icon.png')]:
    resize_pm(pm_sq, size).save(os.path.join(out, 'brand', name), optimize=True)

# favicon: trace the real pixel grid (32x32, premultiplied downsample, horizontal run-length rects)
g = np.asarray(resize_pm(pm_sq, 32)).astype(int)
rects = []
for y in range(32):
    x = 0
    while x < 32:
        r, gg, b, al = g[y, x]
        if al < 16:
            x += 1
            continue
        q = lambda v: (v >> 3) << 3  # quantise to merge runs
        key = (q(r), q(gg), q(b), (al + 8) // 16)
        x2 = x + 1
        while x2 < 32:
            r2, g2, b2, a2 = g[y, x2]
            if a2 >= 16 and (q(r2), q(g2), q(b2), (a2 + 8) // 16) == key:
                x2 += 1
            else:
                break
        rects.append((x, y, x2 - x, key))
        x = x2
parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">']
for x, y, w, (r, gg, b, a16) in rects:
    op = '' if a16 >= 16 else ' fill-opacity="%.2f"' % (a16 / 16)
    parts.append('<rect x="%d" y="%d" width="%d" height="1" fill="#%02x%02x%02x"%s/>' % (x, y, w, min(r + 4, 255), min(gg + 4, 255), min(b + 4, 255), op))
parts.append('</svg>')
svg = ''.join(parts)
assert '--' not in svg
open(os.path.join(out, 'favicon.svg'), 'w', encoding='utf-8').write(svg)
resize_pm(pm_sq, 32).save(os.path.join(out, 'favicon-32.png'))

# banner for social cards
Image.open(os.path.join(root, 'reference', 'SAMPUL ELYQUID JPG.jpg.jpeg')).convert('RGB').save(os.path.join(out, 'brand', 'banner.jpg'), quality=88, optimize=True)

# duplicate check
b = np.asarray(Image.open(os.path.join(root, 'brand', 'LOGO ELYQUID PNG...png')).convert('RGBA'))
print('png duplicates pixel-identical:', bool((b == np.asarray(im)).all()))
print('favicon rects:', len(rects), 'bytes:', len(svg))
