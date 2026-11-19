"""
Teks tagline untuk og-default.png sebagai path SVG (resvg tidak bisa memuat WOFF2).

Glyph diambil dari font yang di-host sendiri (src/fonts/PlusJakartaSans-latin.woff2,
OFL) pada sumbu wght tertentu, lalu disimpan ke scripts/brand/og-tagline.json
untuk dipakai scripts/brand/export.ts.

Jalankan (venv yang sama dengan trace_logo.py + fonttools, brotli):
  .venv-brand/bin/python scripts/brand/text_paths.py
"""

from __future__ import annotations

import json
import os

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONT = os.path.join(ROOT, "src", "fonts", "PlusJakartaSans-latin.woff2")
OUT = os.path.join(ROOT, "scripts", "brand", "og-tagline.json")

TEXT = "Amankan Usaha, Majukan Nusantara."
WEIGHT = 600


def main():
    font = TTFont(FONT)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": WEIGHT})
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font["hmtx"]
    kern = {}
    x = 0
    parts = []
    for ch in TEXT:
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        # sumbu y font ke atas -> SVG ke bawah; baseline di y=0
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        d = pen.getCommands()
        if d:
            parts.append(d)
        x += hmtx[name][0] + kern.get(name, 0)
    asc = font["hhea"].ascent
    desc = font["hhea"].descent
    with open(OUT, "w") as f:
        json.dump(
            {
                "text": TEXT,
                "weight": WEIGHT,
                "unitsPerEm": upm,
                "advance": x,
                "ascent": asc,
                "descent": desc,
                "d": "".join(parts),
            },
            f,
        )
        f.write("\n")
    print(f"{OUT}: lebar {x} unit (upm {upm})")


if __name__ == "__main__":
    main()
