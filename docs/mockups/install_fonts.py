"""Install the family faces for mockup rendering.

cairosvg picks fonts through fontconfig, which does not read woff2, so the
project's own webfonts are converted to static TTFs. The variable faces are
instanced at the weights the design system actually uses — Archivo 400 and
700, JetBrains Mono 500 — because fontconfig will not pick a variable axis.

    pip install --user fonttools brotli
    python3 docs/mockups/install_fonts.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "public", "fonts")
OUT = os.path.expanduser("~/.local/share/fonts/cartableo")


def save(font, family, subfamily, filename):
    full = f"{family} {subfamily}".strip()
    for rec in font["name"].names:
        if rec.nameID == 1: rec.string = family
        elif rec.nameID == 2: rec.string = subfamily
        elif rec.nameID == 4: rec.string = full
        elif rec.nameID == 6: rec.string = full.replace(" ", "")
    font.flavor = None
    font.save(os.path.join(OUT, filename))
    print(f"  {filename:32} {family} / {subfamily}")


def main():
    os.makedirs(OUT, exist_ok=True)
    save(TTFont(os.path.join(SRC, "dm-serif-display-400.woff2")),
         "DM Serif Display", "Regular", "DMSerifDisplay-Regular.ttf")
    for wght, sub, fn in [(400, "Regular", "Archivo-Regular.ttf"),
                          (700, "Bold", "Archivo-Bold.ttf")]:
        v = TTFont(os.path.join(SRC, "archivo-var.woff2"))
        save(instancer.instantiateVariableFont(v, {"wght": wght}, inplace=False),
             "Archivo", sub, fn)
    v = TTFont(os.path.join(SRC, "jetbrains-mono-var.woff2"))
    save(instancer.instantiateVariableFont(v, {"wght": 500}, inplace=False),
         "JetBrains Mono", "Medium", "JetBrainsMono-Medium.ttf")
    os.system(f"fc-cache -f {OUT} >/dev/null 2>&1")
    print("fontconfig cache refreshed")


if __name__ == "__main__":
    main()
