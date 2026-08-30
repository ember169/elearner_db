"""Goals /goals — the goal hierarchy, enhanced with search. Desktop is tree +
detail split; mobile is drill-down (PLAN §8)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

TREE = [
    (0, "Land a red-team internship", "objective", 0.42, None),
    (1, "Reach HTB Hacker rank", "outcome", 0.61, None),
    (2, "Own 15 machines", "metric", 0.53, "8 / 15"),
    (2, "Finish AD path", "metric", 0.25, "3 / 12"),
    (1, "Finish 42 common core", "outcome", 0.38, None),
    (2, "cub3d", "project", 0.70, "in progress"),
    (2, "minishell", "project", 1.0, "validated"),
]


def row(c, x, y, w, depth, title, kind, prog, note, selected=False, compact=False):
    t = c.t
    h = 52
    ix = x + depth * (18 if compact else 26)
    if selected:
        c.rect(x, y, w, h, t["accent_tint"], r=10)
        c.rect(x, y + 6, 2.5, h - 12, t["accent"], r=1.5)
    if depth > 0:
        c.line(ix - 12, y + h / 2, ix - 4, y + h / 2, t["line"], 1)
    c.text(ix, y + 22, title, SANS, 14, t["text"], bold=True)
    c.text(ix, y + 40, kind, MONO, 10, t["muted"])
    if note:
        c.text(x + w - 12, y + 40, note, MONO, 10, t["second"], anchor="end")
    bw = 92 if not compact else 64
    bx = x + w - 12 - bw
    c.rect(bx, y + 16, bw, 5, t["raised"], r=2.5)
    c.rect(bx, y + 16, bw * prog, 5, t["success"] if prog >= 1 else t["accent"], r=2.5)
    return h + 4


def detail(c, x, y, w):
    t = c.t
    c.card(x, y, w, 420, r=16)
    c.chip(x + 18, y + 18, "outcome", "meta", size=10)
    yy = y + 76
    for ln in wrap("Reach HTB Hacker rank", SANS, 17, w - 36, bold=True):
        c.text(x + 18, yy, ln, SANS, 17, t["text"], bold=True); yy += 23
    yy = c.para(x + 18, yy + 6, "Rank follows owns and challenge points; the "
                "AD path is the binding constraint.", SANS, 14, t["muted"],
                max_w=w - 36) + 14
    c.line(x + 18, yy, x + w - 18, yy, t["line"], 1); yy += 24
    c.label_mono(x + 18, yy, "pacing"); yy += 16
    c.rect(x + 18, yy, w - 36, 6, t["raised"], r=3)
    c.rect(x + 18, yy, (w - 36) * 0.61, 6, t["accent"], r=3)
    yy += 20
    c.text(x + 18, yy, "61% · on pace", MONO, 11, t["success"]); yy += 30
    for lab, val in [("Target", "31 Dec 2026"), ("Cadence", "2 owns / week"),
                     ("Children", "2 metrics")]:
        c.text(x + 18, yy, lab, MONO, 11, t["muted"])
        c.text(x + w - 18, yy, val, MONO, 11, t["second"], anchor="end"); yy += 22
    yy += 14
    c.button(x + 18, yy, w - 36, "Add child goal", "secondary", h=44, size=14); yy += 52
    c.text(x + 18, yy + 14, "delete goal", MONO, 11, t["danger"])


def content(c, x, y, w, compact=False):
    t = c.t
    c.text(x, y + 24, "Goals", SANS, 26, t["text"], bold=True)
    if not compact:
        c.button(x + w - 150, y + 2, 150, "New goal", "primary", h=40, size=14)
    y += 48
    c.rect(x, y, w, 44, t["card"], r=12, stroke=t["line"])
    c.circle(x + 22, y + 21, 6, None, stroke=t["muted"], sw=2)
    c.line(x + 26.5, y + 25.5, x + 30, y + 29, t["muted"], 2)
    c.text(x + 40, y + 27, "Search goals", SANS, 15, t["muted"])
    y += 62
    for i, (d, title, kind, prog, note) in enumerate(TREE):
        y += row(c, x, y, w, d, title, kind, prog, note, selected=(i == 1), compact=compact)
    if compact:
        y += 12
        c.button(x, y, w, "New goal", "primary", h=48); y += 56
    return y


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    tree_w, det_w = 560, 340
    probe = Canvas(dw, 4000, theme); probe.parts = []
    dh = int(max(content(probe, RAIL_W + pad, pad, tree_w), 560) + pad)
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 4000, theme); probe2.parts = []
    body_h = int(content(probe2, mpad, mpad, pw - 2 * mpad, True) + mpad)
    ph = 44 + body_h + 74
    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b")
    screen_label(c, 40, 40, "6a", "Goals  /goals", "desktop 1280 · tree + detail split")
    screen_label(c, 1400, 40, "6b", "Goals  /goals", "mobile 375 · drill-down")
    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "goals", 0, dh)
    content(sub, RAIL_W + pad, pad, tree_w)
    detail(sub, RAIL_W + pad + tree_w + 40, pad + 60, det_w)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="gc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#gc)">{"".join(sub.parts)}</g></g>')
    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, True); tabbar(sub2, "", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="gm">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#gm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/06-goals.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/06-goals.png")
    print("06-goals ok")
