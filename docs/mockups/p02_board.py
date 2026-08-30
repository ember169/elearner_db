"""Board /board — the kanban, moved intact from / in Phase 4. Reference only:
the columns, card anatomy and mobile column-swipe already exist."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

COLS = [("backlog", 6), ("todo", 3), ("in progress", 2), ("done", 4)]
CARDS = {
    "backlog": [("htb", "Active Directory LDAP", "3h · medium"),
                ("rootme", "ELF x64 — ret2libc", "2h · high"),
                ("42", "cub3d — raycasting", "8h · high")],
    "todo": [("htb", "Network Enumeration with Nmap", "3h · high"),
             ("thm", "Nmap Live Host Discovery", "1h · medium")],
    "in progress": [("42", "cub3d — milestone 3", "6h · high")],
    "done": [("thm", "Intro to Networking", "done 27 aug"),
             ("htb", "Linux Fundamentals", "done 24 aug")],
}


def card(c, x, y, w, plat, title, meta):
    t = c.t
    tl = wrap(title, SANS, 14, w - 24, bold=True)
    h = 22 + len(tl) * 19 + 26
    c.card(c and x, y, w, h, r=12)
    c.chip(x + 12, y + 10, plat, "meta", size=9)
    yy = y + 46
    for ln in tl:
        c.text(x + 12, yy, ln, SANS, 14, t["text"], bold=True); yy += 19
    c.text(x + 12, yy + 2, meta, MONO, 10, t["muted"])
    return h


def content(c, x, y, w, compact=False):
    t = c.t
    c.text(x, y + 24, "Board", SANS, 26, t["text"], bold=True)
    y += 46
    if compact:
        # Phone: one column at a time, swiped — the existing mobile-board.
        c.label_mono(x, y, "todo · swipe for other columns"); y += 18
        for cd in CARDS["todo"]:
            y += card(c, x, y, w, *cd) + 8
        for cd in CARDS["backlog"][:2]:
            y += card(c, x, y, w, *cd) + 8
        return y
    cw = (w - 3 * 14) / 4
    tops = y
    for i, (name, n) in enumerate(COLS):
        cx = x + i * (cw + 14)
        c.label_mono(cx, tops, name)
        c.text(cx + cw, tops, str(n), MONO, 10, t["muted"], anchor="end")
        yy = tops + 16
        for cd in CARDS[name]:
            yy += card(c, cx, yy, cw, *cd) + 8
        c.card(cx, yy, cw, 40, r=12, dashed=True)
        c.text(cx + cw / 2, yy + 25, "+ add", MONO, 11, t["muted"], anchor="middle")
        y = max(y, yy + 56)
    return y


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    cw = dw - RAIL_W - 2 * pad
    probe = Canvas(dw, 4000, theme); probe.parts = []
    dh = int(max(content(probe, RAIL_W + pad, pad, cw), 640) + pad)
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 4000, theme); probe2.parts = []
    body_h = int(content(probe2, mpad, mpad, pw - 2 * mpad, True) + mpad)
    ph = 44 + body_h + 74
    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b")
    screen_label(c, 40, 40, "2a", "Board  /board", "desktop 1280 · moved intact from /")
    screen_label(c, 1400, 40, "2b", "Board  /board", "mobile 375 · column swipe")
    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "board", 0, dh); content(sub, RAIL_W + pad, pad, cw)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="bc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#bc)">{"".join(sub.parts)}</g></g>')
    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, True); tabbar(sub2, "board", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="bm">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#bm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/02-board.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/02-board.png")
    print("02-board ok")
