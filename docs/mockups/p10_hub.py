"""Competency hub /knowledge/[id] — one competency's six tiers of Knowledge and
its Learn resources side by side. The audit's page-per-competency, reached from
a Knowledge card title."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

TIERS = [
    (0, "Active Directory Overview", "Overview", True),
    (1, "AD Basics Cheatsheet", "Basics cheatsheet", True),
    (2, "Kerberos and Authentication", "Detailed course", False),
    (3, "AD Attacks in Depth", "Advanced techniques", False),
    (4, None, None, False),
    (5, "AD CS and Delegation Internals", "Expert reference", False),
]
RESOURCES = [
    ("htb", "Introduction to Active Directory", "beginner", "completed"),
    ("htb", "Active Directory LDAP", "intermediate", "in_progress"),
    ("htb", "Active Directory Enumeration", "intermediate", "not_started"),
    ("htb", "Forest", "beginner", "not_started"),
    ("thm", "Attacktive Directory", "medium", "not_started"),
    ("rootme", "AD - Kerberoasting", "intermediate", "not_started"),
]


def content(c, x, y, w, compact=False):
    t = c.t
    back_link(c, x + 3, y + 5)
    y += 26
    cx = c.chip(x, y, "Active Directory", "meta", size=10)
    c.chip(x + cx + 8, y, "level L1", "truth", size=10)
    y += 40
    c.text(x, y + 26, "Active Directory attacks", SANS, 26, t["text"], bold=True)
    y += 40
    y = c.para(x, y, "Attacking and defending Windows domains: enumeration, "
               "Kerberos, delegation, and certificate services.",
               SANS, 14, t["muted"], max_w=w) + 16

    col_w = w if compact else (w - 32) / 2
    left_x = x
    right_x = x if compact else x + col_w + 32
    ly = ry = y

    # Understand — the tiers
    c.text(left_x, ly, "Understand", SANS, 17, t["text"], bold=True); ly += 16
    for tier, title, purpose, at in TIERS:
        if title is None:
            c.card(left_x, ly, col_w, 44, r=14, dashed=True)
            c.text(left_x + 14, ly + 27, f"L{tier}", MONO, 10, t["muted"])
            c.text(left_x + 44, ly + 27, "No article yet", SANS, 13, t["muted"])
            ly += 52
            continue
        h = 52
        c.card(left_x, ly, col_w, h, r=14)
        chip_kind = "truth" if at else "meta"
        c.chip(left_x + 12, ly + 14, f"L{tier}", chip_kind, size=10)
        c.text(left_x + 58, ly + 24, title, SANS, 14, t["text"], bold=True)
        meta = purpose + ("" if at else " · above your level")
        c.text(left_x + 58, ly + 42, meta, MONO, 10, t["muted"])
        ly += h + 8

    if compact:
        ry = ly + 8

    # Practise — the resources
    c.text(right_x, ry, "Practise", SANS, 17, t["text"], bold=True)
    c.text(right_x + width_of("Practise", SANS, 17, True) + 10, ry, str(len(RESOURCES)),
           MONO, 10, t["muted"])
    ry += 16
    for plat, title, diff, status in RESOURCES:
        h = 48
        c.card(right_x, ry, col_w, h, r=14)
        dot = {"completed": t["success"], "in_progress": t["info"]}.get(status, t["line"])
        c.circle(right_x + 16, ry + h / 2, 4, dot)
        c.text(right_x + 30, ry + 24, title, SANS, 14, t["second"])
        c.text(right_x + 30, ry + 40, diff, MONO, 10, t["muted"])
        c.chip(right_x + col_w - 52, ry + 14, plat, "meta", size=10)
        ry += h + 8

    return max(ly, ry)


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
    c = Canvas(W, H, theme, page_bg="#0d0c0b")
    screen_label(c, 40, 40, "10a", "Competency hub  /knowledge/[id]", "desktop · Understand + Practise")
    screen_label(c, 1400, 40, "10b", "Competency hub", "mobile 375 · stacked")
    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "knowledge", 0, dh); content(sub, RAIL_W + pad, pad, cw)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="hc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#hc)">{"".join(sub.parts)}</g></g>')
    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, True); tabbar(sub2, "knowledge", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="hm">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#hm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/10-competency-hub.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/10-competency-hub.png")
    print("10-competency-hub ok")
