"""Learn /learn — search, competency-grouped resource grid, filter chips,
detail panel. Desktop is list + side detail; mobile stacks and the detail
becomes a full-screen sheet (PLAN §8)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

GROUPS = [
    ("Networking fundamentals", "Networking", [
        ("htb", "Network Enumeration with Nmap", "module", "beginner", "in_progress"),
        ("thm", "Nmap Live Host Discovery", "room", "beginner", "completed"),
        ("rootme", "ETHERNET — Frame analysis", "challenge", "intermediate", "not_started"),
        ("htb", "Footprinting", "module", "intermediate", "not_started"),
    ]),
    ("Active Directory attacks", "Active Directory", [
        ("htb", "Active Directory LDAP", "module", "intermediate", "not_started"),
        ("htb", "Forest", "machine", "beginner", "not_started"),
    ]),
]
FILTERS = [("htb", 1), ("thm", 0), ("rootme", 0), ("42", 0)]
DIFFS = [("beginner", 0), ("intermediate", 1), ("advanced", 0), ("expert", 0)]
STATUS = [("not started", 0), ("in progress", 1), ("completed", 0)]

STATUS_KIND = {"completed": "success", "in_progress": "truth", "not_started": "meta"}


def search_bar(c, x, y, w, q="nmap"):
    t = c.t
    c.rect(x, y, w, 44, t["card"], r=12, stroke=t["line"])
    c.circle(x + 22, y + 21, 6, None, stroke=t["muted"], sw=2)
    c.line(x + 26.5, y + 25.5, x + 30, y + 29, t["muted"], 2)
    c.text(x + 40, y + 27, q, SANS, 15, t["text"])
    c.text(x + w - 18, y + 27, "×", SANS, 17, t["muted"], anchor="end")


def chip_row(c, x, y, items, kind_on="truth"):
    cx = x
    for label, on in items:
        w = c.chip(cx, y, label, kind_on if on else "ghost", size=11)
        cx += w + 7
    return cx


def resource_card(c, x, y, w, plat, title, ctype, diff, status, selected=False):
    tl = wrap(title, SANS, 15, w - 100, bold=True)
    h = 26 + len(tl) * 20 + 24
    t = c.t
    c.card(x, y, w, h, r=14, accent=selected)
    dot = {"completed": t["success"], "in_progress": t["info"]}.get(status, t["line"])
    c.circle(x + 18, y + 22, 4.5, dot)
    for k, ln in enumerate(tl):
        c.text(x + 32, y + 27 + k * 20, ln, SANS, 15, t["text"], bold=True)
    yy = y + 27 + len(tl) * 20 + 4
    cx = c.chip(x + 32, yy - 12, ctype, "meta", size=10)
    c.chip(x + 32 + cx + 6, yy - 12, diff, STATUS_KIND[status], size=10)
    c.chip(x + w - 58, y + 12, plat, "meta", size=10)
    return h


def detail_panel(c, x, y, w, h):
    t = c.t
    c.card(x, y, w, h, r=16)
    c.chip(x + 18, y + 18, "htb", "meta", size=10)
    c.chip(x + 62, y + 18, "beginner", "success", size=10)
    c.text(x + w - 18, y + 32, "×", SANS, 17, t["muted"], anchor="end")
    yy = y + 76
    for ln in wrap("Network Enumeration with Nmap", SANS, 17, w - 36, bold=True):
        c.text(x + 18, yy, ln, SANS, 17, t["text"], bold=True)
        yy += 23
    yy += 6
    yy = c.para(x + 18, yy, "Host discovery, port scanning strategies, service "
                "and OS detection, and the NSE.", SANS, 14, t["muted"], max_w=w - 36) + 8
    c.line(x + 18, yy, x + w - 18, yy, t["line"], 1); yy += 22
    for lab, val in [("Type", "module"), ("Estimated", "3h"), ("Started", "26 Aug 2026")]:
        c.text(x + 18, yy, lab, MONO, 11, t["muted"])
        c.text(x + w - 18, yy, val, MONO, 11, t["second"], anchor="end")
        yy += 22
    yy += 8
    c.label_mono(x + 18, yy, "competencies"); yy += 12
    cx = x + 18
    for lab in ["Networking fundamentals", "Network enumeration"]:
        wd = c.chip(cx, yy, lab, "meta", size=10)
        if cx + wd > x + w - 40: break
        cx += wd + 6
    yy += 42
    c.line(x + 18, yy, x + w - 18, yy, t["line"], 1); yy += 20
    c.label_mono(x + 18, yy, "status"); yy += 12
    cx = x + 18
    for lab, on in [("not started", 0), ("in progress", 1), ("completed", 0)]:
        wd = c.chip(cx, yy, lab, "truth" if on else "ghost", size=10)
        cx += wd + 6
    yy += 46
    c.button(x + 18, yy, w - 36, "Start learning", "primary", h=48); yy += 56
    c.button(x + 18, yy, w - 36, "Open on HTB", "ghost", h=44, size=14)


def content(c, x, y, w, compact=False):
    t = c.t
    c.text(x, y + 24, "Learn", SANS, 26, t["text"], bold=True)
    y += 42
    c.para(x, y, "Every module, machine, challenge and project, grouped by "
           "competency.", SANS, 14, t["muted"], max_w=w)
    y += 34
    search_bar(c, x, y, w); y += 58
    chip_row(c, x, y, FILTERS); y += 32
    chip_row(c, x, y, DIFFS); y += 32
    chip_row(c, x, y, STATUS); y += 34
    c.text(x, y, "12 of 181 resources", MONO, 11, t["muted"]); y += 24

    for gi, (label, area, items) in enumerate(GROUPS):
        c.path(f"M{x + 3} {y - 4}l5 5 5 -5", stroke=t["muted"], sw=2)
        c.text(x + 22, y, label, SANS, 15, t["text"], bold=True)
        aw = width_of(label, SANS, 15, True)
        # The area chip is redundant on a narrow screen — groups already come
        # in area order — and it collided with the count.
        if not compact:
            c.chip(x + 32 + aw, y - 12, area, "ghost", size=10)
        c.text(x + w, y, str(len(items)), MONO, 11, t["muted"], anchor="end")
        y += 16
        if compact:
            for it in items:
                y += resource_card(c, x, y, w, *it) + 8
        else:
            cw = (w - 10) / 2
            for i in range(0, len(items), 2):
                hs = []
                for j, it in enumerate(items[i:i + 2]):
                    hs.append(resource_card(c, x + j * (cw + 10), y, cw, *it,
                                            selected=(gi == 0 and i == 0 and j == 0)))
                y += max(hs) + 8
        y += 14
    return y


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    list_w, det_w = 640, 360
    probe = Canvas(dw, 5000, theme); probe.parts = []
    end = content(probe, RAIL_W + pad, pad, list_w)
    dh = int(max(end, 900) + pad)

    pw, mpad = 375, 20
    probe2 = Canvas(pw, 5000, theme); probe2.parts = []
    end2 = content(probe2, mpad, mpad, pw - 2 * mpad, compact=True)
    body_h = int(end2 + mpad); ph = 44 + body_h + 74

    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b" if theme is DARK else "#e7e1d4")
    screen_label(c, 40, 40, "3a", "Learn  /learn", "desktop 1280 · list + side detail")
    screen_label(c, 1400, 40, "3b", "Learn  /learn", "mobile 375 · scrolled")

    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "learn", 0, dh)
    content(sub, RAIL_W + pad, pad, list_w)
    detail_panel(sub, RAIL_W + pad + list_w + 32, pad + 100, det_w, 560)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="lc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#lc)">{"".join(sub.parts)}</g></g>')

    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, compact=True)
    tabbar(sub2, "learn", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="lm">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#lm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/03-learn.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/03-learn.png")
    print("03-learn ok")
