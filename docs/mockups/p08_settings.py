"""Settings /settings — objective, cloud API key (which is what unlocks mentor
chat and "go deeper"), platform credentials, sync scheduling."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

PLATFORMS = [("42 Paris", "client id · secret · login", "connected"),
             ("TryHackMe", "username", "connected"),
             ("HackTheBox", "api token · user id", "connected"),
             ("Root-me", "user id · api key", "error"),
             ("Maldev", "database path", "off")]


def field(c, x, y, w, label, value, mono=True, action=None):
    t = c.t
    c.label_mono(x, y, label)
    c.rect(x, y + 10, w, 44, t["card"], r=12, stroke=t["line"])
    c.text(x + 14, y + 38, value, MONO if mono else SANS, 13 if mono else 14,
           t["second"] if value else t["muted"])
    if action:
        aw = width_of(action, MONO, 10) + 24
        c.rect(x + w - 12 - aw, y + 20, aw, 24, t["raised"], r=8)
        c.text(x + w - 12 - aw / 2, y + 36, action, MONO, 10, t["second"], anchor="middle")
    return 68


def section(c, x, y, w, title, note=None):
    t = c.t
    c.text(x, y, title, SANS, 19, t["text"], bold=True)
    if note:
        c.text(x, y + 20, note, MONO, 11, t["muted"])
        return 44
    return 26


def content(c, x, y, w, compact=False):
    t = c.t
    c.text(x, y + 24, "Settings", SANS, 26, t["text"], bold=True)
    y += 62

    y += section(c, x, y, w, "Objective")
    c.rect(x, y + 10, w, 66, t["card"], r=12, stroke=t["line"])
    c.para(x + 14, y + 34, "Red team / malware development, with solid "
           "generalist foundations.", SANS, 14, t["second"], max_w=w - 28, limit=2)
    y += 92

    # The cloud key is the switch behind every hidden feature.
    y += section(c, x, y, w, "AI mentor",
                 "cloud key unlocks mentor chat and go deeper")
    cx = c.chip(x, y, "anthropic", "truth", size=10)
    c.chip(x + cx + 8, y, "local llm", "ghost", size=10)
    y += 40
    y += field(c, x, y, w, "api key", "sk-ant-••••••••••••••••••••3f9a", action="test")
    y += field(c, x, y, w, "model", "claude-opus-5")
    y += 8
    msg = ("Connected · go deeper visible" if compact
           else "Connected · mentor chat and go deeper are visible")
    c.card(x, y, w, 52, r=12)
    c.circle(x + 22, y + 26, 5, t["success"])
    c.text(x + 38, y + 31, msg, MONO, 11, t["success"])
    y += 76

    y += section(c, x, y, w, "Sync")
    y += field(c, x, y, w, "interval", "every 6 hours", action="change")
    for name, meta, state in PLATFORMS:
        h = 56
        c.card(x, y, w, h, r=12)
        col = {"connected": t["success"], "error": t["danger"]}.get(state, t["muted"])
        c.circle(x + 20, y + 28, 5, col)
        c.text(x + 36, y + 24, name, SANS, 14, t["text"], bold=True)
        c.text(x + 36, y + 42, meta, MONO, 10, t["muted"])
        if not compact:
            c.text(x + w - 18, y + 33, state, MONO, 10, col, anchor="end")
        y += h + 8
    y += 16
    c.button(x, y, w if compact else 200, "Sync now", "primary", h=48)
    y += 60
    # Destructive action: text-only, never a filled button (family rule).
    c.text(x, y + 14, "reset all credentials", MONO, 11, t["danger"])
    return y + 30


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    cw = 640
    probe = Canvas(dw, 5000, theme); probe.parts = []
    dh = int(content(probe, RAIL_W + pad, pad, cw) + pad)
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 5000, theme); probe2.parts = []
    body_h = int(content(probe2, mpad, mpad, pw - 2 * mpad, True) + mpad)
    ph = 44 + body_h + 74
    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b")
    screen_label(c, 40, 40, "8a", "Settings  /settings", "desktop 1280")
    screen_label(c, 1400, 40, "8b", "Settings  /settings", "mobile 375 · scrolled")
    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "settings", 0, dh); content(sub, RAIL_W + pad, pad, cw)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="sc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#sc)">{"".join(sub.parts)}</g></g>')
    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    content(sub2, mpad, mpad, pw - 2 * mpad, True); tabbar(sub2, "more", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="sm">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#sm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/08-settings.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/08-settings.png")
    print("08-settings ok")
