"""Knowledge /knowledge — competency grid, six depth tiers each, with
"at level" / "above level" indicators. Every tier is readable: the badge is a
marker, not a gate (PLAN §1)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

AREAS = [
    ("Low-level & C", [("C fundamentals", 4, True), ("Systems programming in C", 3, False),
                       ("Algorithms & problem solving", 2, False), ("C++ & OOP", 2, False)]),
    ("Networking", [("Networking fundamentals", 3, True),
                    ("Network enumeration & services", 2, False)]),
    ("Active Directory", [("Active Directory attacks", 1, False)]),
]


def comp_card(c, x, y, w, label, level, validated, compact=False):
    t = c.t
    desc = "Pointers, memory, the standard library, and reimplementing it."
    dl = wrap(desc, SANS, 13, w - 36)
    h = 34 + len(dl) * 19 + 44
    c.card(x, y, w, h, r=14)
    tl = wrap(label, SANS, 15, w - 100, bold=True)
    for k, ln in enumerate(tl):
        c.text(x + 16, y + 28 + k * 19, ln, SANS, 15, t["text"], bold=True)
    # Level badge: accent tint + check when validated by assessment, neutral
    # when only inferred from platform activity.
    bl = f"L{level}"
    bw = width_of(bl, MONO, 11) + (26 if validated else 20)
    c.rect(x + w - 16 - bw, y + 14, bw, 23, t["accent_tint"] if validated else t["raised"], r=9)
    if validated:
        c.path(f"M{x + w - 16 - bw + 9} {y + 26}l3 3 5.5 -6", stroke=t["accent"], sw=1.8)
    c.text(x + w - 16 - bw + (22 if validated else 10), y + 30, bl, MONO, 11,
           t["accent"] if validated else t["second"])
    yy = y + 28 + len(tl) * 19 + 8
    for k, ln in enumerate(dl):
        c.text(x + 16, yy + k * 19, ln, SANS, 13, t["muted"])
    yy += len(dl) * 19 + 6
    cx = x + 16
    for tier in range(6):
        at = tier <= level
        lab = f"L{tier}"
        tw = width_of(lab, MONO, 10) + 20
        c.rect(cx, yy, tw, 22, t["accent_tint"] if at else t["raised"], r=8)
        c.text(cx + 10, yy + 15, lab, MONO, 10, t["accent"] if at else t["second"])
        cx += tw + 6
    return h


def content(c, x, y, w, compact=False):
    t = c.t
    c.text(x, y + 24, "Knowledge", SANS, 26, t["text"], bold=True)
    y += 42
    y = c.para(x, y, "Courses written for each competency, six depth tiers deep. "
               "Every tier is readable — the level badge is a marker, not a gate.",
               SANS, 14, t["muted"], max_w=w) + 12
    t2 = c.t
    c.rect(x, y, w, 44, t2["card"], r=12, stroke=t2["line"])
    c.circle(x + 22, y + 21, 6, None, stroke=t2["muted"], sw=2)
    c.line(x + 26.5, y + 25.5, x + 30, y + 29, t2["muted"], 2)
    c.text(x + 40, y + 27, "Search competencies and articles", SANS, 15, t2["muted"])
    y += 62

    for area, comps in AREAS:
        c.label_mono(x, y, area)
        y += 14
        if compact:
            for label, lvl, val in comps:
                y += comp_card(c, x, y, w, label, lvl, val, True) + 10
        else:
            cw = (w - 12) / 2
            for i in range(0, len(comps), 2):
                hs = [comp_card(c, x + j * (cw + 12), y, cw, *cp)
                      for j, cp in enumerate(comps[i:i + 2])]
                y += max(hs) + 10
        y += 14
    return y


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    cw = dw - RAIL_W - 2 * pad
    probe = Canvas(dw, 5000, theme); probe.parts = []
    dh = int(content(probe, RAIL_W + pad, pad, cw) + pad)
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 5000, theme); probe2.parts = []
    body_h = int(content(probe2, mpad, mpad, pw - 2 * mpad, True) + mpad)
    ph = 44 + body_h + 74
    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b" if theme is DARK else "#e7e1d4")
    screen_label(c, 40, 40, "4a", "Knowledge  /knowledge", "desktop 1280 · competency grid")
    screen_label(c, 1400, 40, "4b", "Knowledge  /knowledge", "mobile 375 · scrolled")
    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "knowledge", 0, dh); content(sub, RAIL_W + pad, pad, cw)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="kc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#kc)">{"".join(sub.parts)}</g></g>')
    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, True); tabbar(sub2, "knowledge", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="km">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#km)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/04-knowledge.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/04-knowledge.png")
    print("04-knowledge ok")
