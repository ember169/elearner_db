"""Light theme — the family ships a separate warm-paper token set, never an
inversion of dark. Dashboard is the reference screen for it."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import LIGHT
import p01_dashboard

if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__)
    svg = p01_dashboard.build(theme=LIGHT)
    # Retitle via the note, not the title: the note is positioned from the
    # measured title width, so lengthening the title would overlap it.
    svg = svg.replace("desktop 1280 · single column, max-w-3xl centred",
                      "light theme · desktop 1280")
    svg = svg.replace("mobile 375 · scrolled", "light theme · mobile 375")
    open(f"{d}/09-light-theme.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/09-light-theme.png")
    print("09-light-theme ok")
