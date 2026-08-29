"""Progress /progress — activity chart, competency heatmap, streak calendar,
platform sparklines. Desktop is a 2-column chart grid; mobile stacks and the
heatmap scrolls horizontally (PLAN §8).

Dataviz follows the family rules: bars for weekly volume, a line for anything
continuous, dots for attendance — never a curve, since an attendance curve
that dips reads as a reproach."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

WEEKS = [(6, 3, 2), (8, 2, 4), (5, 5, 1), (9, 3, 3), (4, 6, 2), (7, 4, 5),
         (10, 2, 3), (6, 5, 4), (8, 3, 2), (11, 4, 4), (7, 6, 3), (9, 5, 5)]
PLATFORMS = [("htb", "92 resources", [3, 5, 4, 6, 5, 8, 7, 9]),
             ("rootme", "56 challenges", [2, 3, 3, 4, 6, 5, 7, 6]),
             ("42", "33 projects", [1, 2, 2, 3, 3, 4, 5, 5])]
HEAT = [3, 4, 2, 1, 0, 2, 3, 2, 4, 3, 1, 2, 0, 1, 3, 2, 2, 1, 4, 3]


def activity(c, x, y, w, h, compact=False):
    t = c.t
    c.card(x, y, w, h, r=14)
    c.text(x + 18, y + 30, "Activity", SANS, 17, t["text"], bold=True)
    c.text(x + w - 18, y + 30, "12 weeks", MONO, 10, t["muted"], anchor="end")
    base = y + h - 34
    top = y + 54
    n = len(WEEKS)
    gap = 8
    bw = (w - 36 - (n - 1) * gap) / n
    mx = max(sum(v) for v in WEEKS)
    cols = [t["accent"], t["info"], t["success"]]
    for i, vals in enumerate(WEEKS):
        bx = x + 18 + i * (bw + gap)
        yy = base
        for j, v in enumerate(vals):
            bh = (v / mx) * (base - top)
            yy -= bh
            c.rect(bx, yy, bw, bh, cols[j], r=2, op=0.85)
    c.line(x + 18, base + 1, x + w - 18, base + 1, t["line"], 1)
    lx = x + 18
    for j, lab in enumerate(["htb", "rootme", "42"]):
        c.circle(lx + 4, y + h - 16, 4, cols[j])
        c.text(lx + 14, y + h - 12, lab, MONO, 10, t["muted"])
        lx += 22 + width_of(lab, MONO, 10)


def heatmap_card(c, x, y, w, h, compact=False):
    t = c.t
    c.card(x, y, w, h, r=14)
    c.text(x + 18, y + 30, "Competencies", SANS, 17, t["text"], bold=True)
    c.text(x + w - 18, y + 30, "20 tracked", MONO, 10, t["muted"], anchor="end")
    cols = 10 if not compact else 7
    cell = (w - 36 - (cols - 1) * 6) / cols
    for i, lvl in enumerate(HEAT):
        cx = x + 18 + (i % cols) * (cell + 6)
        cy = y + 54 + (i // cols) * (cell + 6)
        c.rect(cx, cy, cell, cell, t["raised"] if lvl == 0 else t["accent"], r=5,
               op=None if lvl == 0 else 0.22 + lvl * 0.17)
    ly = y + h - 16
    c.text(x + 18, ly, "L0", MONO, 9, t["muted"])
    for k in range(5):
        c.rect(x + 40 + k * 16, ly - 9, 12, 12, t["accent"], r=3, op=0.22 + k * 0.17)
    c.text(x + 40 + 5 * 16 + 6, ly, "L5", MONO, 9, t["muted"])


def streak_calendar(c, x, y, w, h):
    """Attendance as dots per day — never a curve."""
    t = c.t
    c.card(x, y, w, h, r=14)
    c.text(x + 18, y + 30, "Streak", SANS, 17, t["text"], bold=True)
    c.text(x + w - 18, y + 30, "14 days", MONO, 10, t["accent"], anchor="end")
    # A year of days, GitHub-style, sized to fill the card rather than
    # huddling in one corner of it.
    days = 7
    gap = 3
    weeks = 52
    cell = (w - 36 - (weeks - 1) * gap) / weeks
    if cell < 6:
        weeks = 26
        cell = (w - 36 - (weeks - 1) * gap) / weeks
    import hashlib
    for wk in range(weeks):
        for d in range(days):
            seed = int(hashlib.md5(f"{wk}-{d}".encode()).hexdigest()[:2], 16)
            on = seed % 10 > 3
            cx = x + 18 + wk * (cell + gap)
            cy = y + 54 + d * (cell + gap)
            c.rect(cx, cy, cell, cell, t["accent"] if on else t["raised"], r=2.5,
                   op=None if not on else 0.3 + (seed % 5) * 0.14)


def platform_cards(c, x, y, w, compact=False):
    t = c.t
    cw = w if compact else (w - 2 * 12) / 3
    for i, (name, meta, series) in enumerate(PLATFORMS):
        cx = x + (0 if compact else i * (cw + 12))
        cy = y + (i * 96 if compact else 0)
        c.card(cx, cy, cw, 86, r=14)
        c.chip(cx + 16, cy + 14, name, "meta", size=10)
        c.text(cx + 16, cy + 58, meta, MONO, 11, t["second"])
        # Sparkline: 22px tall, a line because the value is continuous.
        sw_ = cw - 150
        sx = cx + cw - 16 - sw_
        mx, mn = max(series), min(series)
        pts = []
        for k, v in enumerate(series):
            px = sx + k * (sw_ / (len(series) - 1))
            py = cy + 58 - ((v - mn) / max(1, mx - mn)) * 22
            pts.append(f"{px:.1f},{py:.1f}")
        c.raw(f'<polyline points="{" ".join(pts)}" fill="none" '
              f'stroke="{t["accent"]}" stroke-width="1.8" stroke-linejoin="round"/>')
    return (len(PLATFORMS) * 96) if compact else 86


def content(c, x, y, w, compact=False):
    t = c.t
    c.text(x, y + 24, "Progress", SANS, 26, t["text"], bold=True)
    y += 48
    if compact:
        activity(c, x, y, w, 210, True); y += 222
        heatmap_card(c, x, y, w, 210, True); y += 222
        streak_calendar(c, x, y, w, 170); y += 182
        y += platform_cards(c, x, y, w, True)
    else:
        half = (w - 20) / 2
        activity(c, x, y, half, 250)
        heatmap_card(c, x + half + 20, y, half, 250, False)
        y += 262
        streak_calendar(c, x, y, w, 176); y += 188
        y += platform_cards(c, x, y, w)
    return y


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    cw = dw - RAIL_W - 2 * pad
    probe = Canvas(dw, 4000, theme); probe.parts = []
    dh = int(content(probe, RAIL_W + pad, pad, cw) + pad)
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 4000, theme); probe2.parts = []
    body_h = int(content(probe2, mpad, mpad, pw - 2 * mpad, True) + mpad)
    ph = 44 + body_h + 74
    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b")
    screen_label(c, 40, 40, "7a", "Progress  /progress", "desktop 1280 · 2-column chart grid")
    screen_label(c, 1400, 40, "7b", "Progress  /progress", "mobile 375 · stacked")
    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "progress", 0, dh); content(sub, RAIL_W + pad, pad, cw)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="pc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#pc)">{"".join(sub.parts)}</g></g>')
    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, True); tabbar(sub2, "progress", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="pm">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#pm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/07-progress.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/07-progress.png")
    print("07-progress ok")
