"""Direction: Learn and Knowledge merged into one competency-first page.

Answers the feedback: per-competency done/total counts, clear checkmarks, real
order (beginner->expert), and the Learn/Knowledge split removed — a competency
shows what to READ (articles, its six tiers) and what to DO (resources) in one
place, borrowing Leofresh's "provisions 3/8" count-chip pattern."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

# competency: (label, area, level, articles_done, res_done, res_total)
COMPS = [
    ("C fundamentals", "Low-level & C", 3, 4, 4, 4),
    ("Systems programming in C", "Low-level & C", 2, 3, 5, 15),
    ("C++ & OOP", "Low-level & C", 1, 2, 1, 4),
    ("Networking fundamentals", "Networking", 3, 6, 7, 19),
    ("Web application security", "Web", 2, 3, 6, 54),
    ("Active Directory attacks", "Active Directory", 1, 1, 1, 8),
]
# expanded competency content — resources ordered beginner->expert with done state
RES = [
    ("htb", "Linux Fundamentals", "beginner", True),
    ("thm", "Nmap Live Host Discovery", "beginner", True),
    ("htb", "Network Enumeration with Nmap", "intermediate", False),
    ("rootme", "ETHERNET - Frame analysis", "intermediate", False),
    ("htb", "Footprinting", "advanced", False),
]
DIFF_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2, "expert": 3}
DIFF_TONE = {"beginner": "success", "intermediate": "meta", "advanced": "warn", "expert": "danger"}


def check(c, x, y, done):
    t = c.t
    if done:
        c.circle(x, y, 7, t["success"])
        c.path(f"M{x-3} {y}l2 2 4-4.5", stroke=t["bg"], sw=1.8)
    else:
        c.circle(x, y, 7, None, stroke=t["line"], sw=1.5)


def progress_chip(c, x, y, done, total, kind="truth"):
    """Leofresh's count pattern: done/total on a mono chip."""
    return c.chip(x, y, f"{done}/{total}", kind if done < total else "success", size=10)


def comp_row(c, x, y, w, label, area, level, adone, rdone, rtotal, expanded=False):
    t = c.t
    h = 60
    c.card(x, y, w, h, r=14, accent=expanded)
    # progress bar down the left
    frac = (adone + rdone) / max(1, 6 + rtotal)
    c.rect(x, y, 3, h, t["line"], r=0)
    c.rect(x, y, 3, h * frac, t["accent"], r=0)
    c.text(x + 18, y + 26, label, SANS, 15, t["text"], bold=True)
    # level badge
    bw = width_of(f"L{level}", MONO, 10) + 18
    c.rect(x + w - 16 - bw, y + 12, bw, 22, t["accent_tint"], r=8)
    c.text(x + w - 16 - bw + 9, y + 27, f"L{level}", MONO, 10, t["accent"])
    # the two counts: read (articles) + do (resources), Leofresh style
    cx = x + 18
    c.label_mono(cx, y + 46, "read")
    cx += 42
    aw = progress_chip(c, cx, y + 37, adone, 6)
    cx += aw + 14
    c.label_mono(cx, y + 46, "do")
    cx += 26
    progress_chip(c, cx, y + 37, rdone, rtotal)
    return h


def expanded_panel(c, x, y, w):
    """What a competency opens to: understand (tiers) + do (ordered resources)."""
    t = c.t
    c.card(x, y, w, 300, r=16)
    c.text(x + 18, y + 30, "Active Directory attacks", SANS, 17, t["text"], bold=True)
    c.chip(x + w - 62, y + 16, "L1", "truth", size=10)
    # Understand: six tiers, done ones checked
    c.label_mono(x + 18, y + 58, "understand")
    tx = x + 18
    for tier in range(6):
        done = tier <= 1
        c.rect(tx, y + 68, 34, 26, t["accent_tint"] if tier <= 1 else t["raised"], r=8)
        c.text(tx + 8, y + 85, f"L{tier}", MONO, 10, t["accent"] if tier <= 1 else t["second"])
        if done:
            c.circle(tx + 28, y + 72, 4, t["success"])
        tx += 40
    # Do: resources ordered beginner->expert, with checkmarks
    c.label_mono(x + 18, y + 118, "do  ·  ordered by difficulty")
    ry = y + 130
    for plat, title, diff, done in sorted(RES, key=lambda r: DIFF_ORDER[r[2]]):
        c.rect(x + 18, ry, w - 36, 30, t["raised"] if not done else t["success_tint"], r=8)
        check(c, x + 34, ry + 15, done)
        c.text(x + 50, ry + 20, title, SANS, 13, t["second"] if not done else t["muted"])
        c.chip(x + w - 150, ry + 4, diff, DIFF_TONE[diff], size=9)
        c.chip(x + w - 58, ry + 4, plat, "meta", size=9)
        ry += 36


def content(c, x, y, w, compact=False):
    t = c.t
    c.text(x, y + 24, "Learn", SANS, 26, t["text"], bold=True)
    y += 42
    c.para(x, y, "Everything for a competency in one place — what to read and what "
           "to do, ordered, with progress. Learn and Knowledge, merged.",
           SANS, 14, t["muted"], max_w=w)
    y += 36
    # search + lens toggle
    c.rect(x, y, w - 210 if not compact else w, 44, t["card"], r=12, stroke=t["line"])
    c.circle(x + 22, y + 21, 6, None, stroke=t["muted"], sw=2)
    c.text(x + 40, y + 27, "Search", SANS, 15, t["muted"])
    if not compact:
        # lens: by competency | browse
        c.rect(x + w - 196, y, 196, 44, t["raised"], r=12)
        c.rect(x + w - 192, y + 4, 110, 36, t["accent"], r=9)
        c.text(x + w - 192 + 55, y + 27, "by competency", SANS, 13, t["on_accent"], bold=True, anchor="middle")
        c.text(x + w - 55, y + 27, "browse", SANS, 13, t["muted"], anchor="middle")
    y += 60

    area = None
    for i, (label, ar, lvl, ad, rd, rt) in enumerate(COMPS):
        if ar != area:
            area = ar
            c.label_mono(x, y, ar)
            y += 14
        expanded = (i == 5)  # AD attacks expanded as example
        y += comp_row(c, x, y, w, label, ar, lvl, ad, rd, rt, expanded) + 8
        if expanded and not compact:
            expanded_panel(c, x, y, w)
            y += 308
    return y


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    cw = dw - RAIL_W - 2 * pad
    probe = Canvas(dw, 6000, theme); probe.parts = []
    dh = int(content(probe, RAIL_W + pad, pad, cw) + pad)
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 6000, theme); probe2.parts = []
    body_h = int(content(probe2, mpad, mpad, pw - 2 * mpad, True) + mpad)
    ph = 44 + body_h + 74
    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b")
    screen_label(c, 40, 40, "03a", "Learn", "desktop 1280 · competency-first · Learn + Knowledge merged")
    screen_label(c, 1400, 40, "03b", "Learn", "mobile 375")
    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "learn", 0, dh); content(sub, RAIL_W + pad, pad, cw)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="mg"><rect width="{dw}" height="{dh}" rx="14"/></clipPath><g clip-path="url(#mg)">{"".join(sub.parts)}</g></g>')
    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, True); tabbar(sub2, "learn", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="mgm"><rect width="{pw}" height="{ph - 44}"/></clipPath><g clip-path="url(#mgm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/11-merged-learn.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/11-merged-learn.png")
    print("11-merged-learn ok")
