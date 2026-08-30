"""Dashboard / — the morning hub, as built: review queue, daily focus, streak, mentor
briefing, competency mini-heatmap (PLAN §6 "Morning Ritual")."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

HEAT = [3, 4, 2, 1, 0, 2, 3, 2, 4, 3, 1, 2, 0, 1, 3, 2, 2, 1, 4, 3]
FOCUS = [
    ("htb", "Network Enumeration with Nmap", "module · 3h · net-fundamentals"),
    ("42", "cub3d — milestone 3", "project · due in 6 days"),
    ("rootme", "ELF x64 — Stack buffer overflow", "challenge · 1h · binexp"),
]


def heatmap(c, x, y, cols, cell, gap=5):
    t = c.t
    rows = 0
    for i, lvl in enumerate(HEAT):
        cx = x + (i % cols) * (cell + gap)
        cy = y + (i // cols) * (cell + gap)
        rows = i // cols + 1
        c.rect(cx, cy, cell, cell, t["raised"] if lvl == 0 else t["accent"], r=5,
               op=None if lvl == 0 else 0.22 + lvl * 0.17)
    return rows * (cell + gap) - gap


def content(c, x, y, w, compact=False):
    t = c.t

    c.text(x, y + 24, "Today", SANS, 26, t["text"], bold=True)
    c.label_mono(x + width_of("Today", SANS, 26, True) + 14, y + 20, "fri 30 aug")
    y += 58

    # Daily focus header carries a "see board" link — the accueil -> board path
    # in one tap, on either size.
    c.text(x, y, "Daily focus", SANS, 19, t["text"], bold=True)
    c.text(x + w, y, "see board · 26", MONO, 11, t["accent"], anchor="end")
    y += 14

    for plat, title, meta in FOCUS:
        tl = wrap(title, SANS, 15, w - (150 if not compact else 36), bold=True)
        ih = 24 + len(tl) * 20 + 22 + 18
        c.card(x, y, w, ih, r=14)
        c.chip(x + 16, y + 14, plat, "meta", size=10)
        ty = y + 52
        for k, ln in enumerate(tl):
            c.text(x + 16, ty + k * 20, ln, SANS, 15, t["text"], bold=True)
        c.text(x + 16, ty + len(tl) * 20 + 4, meta, MONO, 11, t["muted"])
        if not compact:
            c.button(x + w - 108, y + ih / 2 - 18, 92, "Done", "secondary", h=36, size=13)
        y += ih + 8
    y += 16

    # Mentor briefing — collapsible narrative, preserved from V3.
    brief = ("Your AD footing is the gap that matters this week: two machines "
             "stalled at the same enumeration step. Take the Nmap module first, "
             "then retry Forest.")
    bl = wrap(brief, SANS, 14, w - 36)
    bh = 44 + len(bl) * 22 + 30
    c.card(x, y, w, bh, r=14)
    c.label_mono(x + 18, y + 26, "mentor briefing")
    c.para(x + 18, y + 52, brief, SANS, 14, t["second"], max_w=w - 36)
    c.text(x + 18, y + bh - 14, "collapse", MONO, 11, t["accent"])
    y += bh + 24

    c.text(x, y, "Competencies", SANS, 19, t["text"], bold=True)
    c.text(x + w, y, "see all", MONO, 11, t["accent"], anchor="end")
    y += 14
    cols, cell = (10, 24) if not compact else (7, 26)
    grid_h = 2 * (cell + 5) if not compact else 3 * (cell + 5)
    ch = grid_h + 30
    c.card(x, y, w, ch, r=14)
    heatmap(c, x + 18, y + 16, cols, cell)
    return y + ch


def build(theme=DARK):
    W = 1840
    c = Canvas(W, 10, theme)  # height fixed after measuring

    # ── Desktop ─────────────────────────────────────────────────────────────
    dx, dy, dw = 40, 66, 1280
    inner_w, pad = 720, 40
    probe = Canvas(dw, 4000, theme); probe.parts = []
    end = content(probe, RAIL_W + (dw - RAIL_W - inner_w) / 2, pad, inner_w)
    dh = int(end + pad)

    # ── Mobile ──────────────────────────────────────────────────────────────
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 4000, theme); probe2.parts = []
    end2 = content(probe2, mpad, mpad, pw - 2 * mpad, compact=True)
    body_h = int(end2 + mpad)
    ph = 44 + body_h + 74

    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b" if theme is DARK else "#e7e1d4")
    screen_label(c, 40, 40, "1a", "Dashboard  /",
                 "desktop 1280 · single column, max-w-3xl centred")
    screen_label(c, 1400, 40, "1b", "Dashboard  /", "mobile 375 · scrolled")

    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "today", 0, dh)
    content(sub, RAIL_W + (dw - RAIL_W - inner_w) / 2, pad, inner_w)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="dclip">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#dclip)">{"".join(sub.parts)}</g></g>')

    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, compact=True)
    tabbar(sub2, "today", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="mclip">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#mclip)">{"".join(sub2.parts)}</g></g>')

    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__)
    svg = build()
    open(f"{d}/01-dashboard.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/01-dashboard.png")
    print("01-dashboard ok")
