"""Knowledge article reader — Markdown with code and Mermaid, annotations in
the right margin on desktop and a bottom sheet on mobile, fullscreen toggle,
and the "go deeper" button, which is HIDDEN without a cloud key (PLAN §1.3)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from kit import *

CODE = [("# host discovery on a /24", "c"), ("nmap -sn 10.10.10.0/24", "k"),
        ("", ""), ("# then service and version detection", "c"),
        ("nmap -sV -sC -p- 10.10.10.5", "k")]


def code_block(c, x, y, w):
    t = c.t
    h = 24 + len(CODE) * 19 + 16
    c.rect(x, y, w, h, "#0f0e0d", r=8, stroke=t["line"])
    c.text(x + 14, y + 20, "bash", MONO, 9, t["muted"], tracking=0.9, upper=True)
    for i, (ln, kind) in enumerate(CODE):
        col = {"c": t["muted"], "k": t["accent"]}.get(kind, t["second"])
        c.text(x + 14, y + 40 + i * 19, ln, MONO, 12.5, col)
    return h


def mermaid(c, x, y, w, compact=False):
    """A diagram renders inline; the fence never shows as code. On a phone the
    boxes shrink to fit rather than scrolling out of the column."""
    t = c.t
    h = 128
    c.rect(x, y, w, h, t["card"], r=14, stroke=t["line"])
    boxes = [("ARP", 0), ("ICMP", 1), ("TCP SYN", 2), ("UDP", 3)]
    bw, gap = (92, 26) if not compact else (66, 12)
    total = len(boxes) * bw + (len(boxes) - 1) * gap
    bx = x + (w - total) / 2
    for label, i in boxes:
        px = bx + i * (bw + gap)
        c.rect(px, y + 44, bw, 40, t["raised"], r=8, stroke=t["accent"], sw=1.2)
        c.text(px + bw / 2, y + 69, label, SANS, 13 if not compact else 11, t["text"], anchor="middle")
        if i < len(boxes) - 1:
            c.line(px + bw + 5, y + 64, px + bw + gap - 5, y + 64, t["muted"], 1.6)
            c.path(f"M{px + bw + gap - 10} {y + 60}l5 4 -5 4", stroke=t["muted"], sw=1.6)
    c.text(x + w / 2, y + 108, "scan pipeline", MONO, 10, t["muted"],
           anchor="middle", tracking=1)
    return h


def annotation_sidebar(c, x, y, w):
    t = c.t
    c.label_mono(x, y, "annotations"); y += 20
    for quote, note in [("ARP scan is faster on local networks",
                         "Use this for internal engagements."),
                        ("-sV probes open ports", None)]:
        ql = wrap(quote, SANS, 13, w - 30)
        nl = wrap(note, SANS, 12, w - 30) if note else []
        h = 18 + len(ql) * 18 + (len(nl) * 17 + 10 if nl else 0) + 14
        c.card(x, y, w, h, r=12)
        c.rect(x + 12, y + 14, 2, h - 28, t["accent"], r=1)
        yy = y + 26
        for ln in ql:
            c.text(x + 22, yy, ln, SANS, 13, t["second"]); yy += 18
        if nl:
            yy += 8
            for ln in nl:
                c.text(x + 22, yy, ln, SANS, 12, t["muted"]); yy += 17
        y += h + 10
    return y


def body(c, x, y, w, has_key=False, compact=False):
    t = c.t
    cx = c.chip(x, y, "L2 · Detailed course", "meta", size=10)
    c.chip(x + cx + 8, y, "Networking fundamentals", "meta", size=10)
    y += 40
    for ln in wrap("Network Scanning Deep Dive", SERIF, 32 if not compact else 27, w):
        c.text(x, y + 26, ln, SERIF, 32 if not compact else 27, t["text"]); y += 38
    y += 12
    c.line(x, y, x + w, y, t["line"], 1); y += 30

    c.text(x, y, "Host discovery techniques", SANS, 21, t["text"], bold=True); y += 26
    y = c.para(x, y, "Nmap provides several host discovery methods. On a local "
               "segment ARP is both faster and harder to filter; across a routed "
               "boundary you fall back to ICMP and TCP probes.",
               SANS, 15, t["second"], max_w=w) + 14

    # Highlighted phrase: a tint plate, never a fill — prose stays as readable
    # inside the highlight as outside it.
    hl = "ARP scan is faster on local networks"
    hw = width_of(hl, SANS, 15) + 8
    c.rect(x - 3, y - 15, hw, 24, t["accent_tint"], r=3)
    c.text(x, y, hl, SANS, 15, t["second"])
    c.line(x, y + 5, x + hw - 8, y + 5, t["accent"], 1.4)
    y += 34
    y += mermaid(c, x, y, w, compact) + 22

    c.text(x, y, "Port scanning strategies", SANS, 21, t["text"], bold=True); y += 26
    y = c.para(x, y, "TCP SYN (-sS) is the default for a privileged user: it never "
               "completes the handshake.", SANS, 15, t["second"], max_w=w) + 12
    y += code_block(c, x, y, w) + 20

    # The cloud feature is hidden without a key, never shown disabled.
    if has_key:
        c.button(x, y, 168, "Go deeper", "ghost", h=40, size=14)
        c.text(x + 182, y + 25, "expands this section via your cloud model",
               MONO, 10, t["muted"])
        y += 52
    return y


def build(theme=DARK):
    W = 1840
    dx, dy, dw, pad = 40, 66, 1280, 40
    art_w, side_w = 660, 300
    probe = Canvas(dw, 5000, theme); probe.parts = []
    dh = int(body(probe, RAIL_W + pad, pad + 48, art_w, has_key=True) + pad)
    pw, mpad = 375, 20
    probe2 = Canvas(pw, 5000, theme); probe2.parts = []
    body_h = int(body(probe2, mpad, mpad + 44, pw - 2 * mpad, False, True) + 150)
    ph = 44 + body_h + 74
    H = max(dh, ph) + 130
    c = Canvas(W, H, theme, page_bg="#0d0c0b" if theme is DARK else "#e7e1d4")
    screen_label(c, 40, 40, "5a", "Article reader",
                 "desktop · article + annotation margin · cloud key present")
    screen_label(c, 1400, 40, "5b", "Article reader",
                 "mobile 375 · no cloud key")

    c.rect(dx - 8, dy - 8, dw + 16, dh + 16, theme["line"], r=20, op=0.45)
    c.rect(dx, dy, dw, dh, theme["bg"], r=14)
    sub = Canvas(dw, dh, theme); sub.parts = []
    rail(sub, "knowledge", 0, dh)
    back_link(sub, RAIL_W + pad, pad + 13)
    bx = dw - pad - 250
    sub.rect(bx, pad + 2, 108, 30, theme["raised"], r=8)
    sub.text(bx + 14, pad + 22, "export", MONO, 10, theme["second"], tracking=1, upper=True)
    sub.rect(bx + 118, pad + 2, 40, 30, theme["raised"], r=8)
    sub.path(f"M{bx + 130} {pad + 12}h6v6M{bx + 146} {pad + 22}h-6v-6",
             stroke=theme["second"], sw=1.8)
    body(sub, RAIL_W + pad, pad + 48, art_w, has_key=True)
    annotation_sidebar(sub, RAIL_W + pad + art_w + 40, pad + 96, side_w)
    c.raw(f'<g transform="translate({dx},{dy})"><clipPath id="rc">'
          f'<rect width="{dw}" height="{dh}" rx="14"/></clipPath>'
          f'<g clip-path="url(#rc)">{"".join(sub.parts)}</g></g>')

    ox, oy = phone(c, 1400, dy, pw, ph, theme)
    sub2 = Canvas(pw, ph - 44, theme); sub2.parts = []
    back_link(sub2, mpad, 21)
    sub2.rect(pw - mpad - 76, 8, 36, 28, theme["raised"], r=8)
    sub2.path(f"M{pw - mpad - 66} {17}h5v5M{pw - mpad - 50} {27}h-5v-5",
              stroke=theme["second"], sw=1.7)
    ey = body(sub2, mpad, mpad + 44, pw - 2 * mpad, False, True)
    # Annotations become a bottom sheet on a phone.
    sh = 118
    sy = body_h - sh - 10
    sub2.rect(0, sy, pw, sh + 10, theme["card"], r=22)
    sub2.rect(pw / 2 - 18, sy + 10, 36, 4, theme["line"], r=2)
    sub2.label_mono(mpad, sy + 36, "highlight", theme["accent"])
    sub2.para(mpad, sy + 58, "ARP scan is faster on local networks",
              SANS, 13, theme["second"], max_w=pw - 2 * mpad, limit=2)
    sub2.button(mpad, sy + 84, pw - 2 * mpad, "Add note", "secondary", h=40, size=14)
    tabbar(sub2, "knowledge", 0, body_h, pw)
    c.raw(f'<g transform="translate({ox},{oy})"><clipPath id="rm">'
          f'<rect width="{pw}" height="{ph - 44}"/></clipPath>'
          f'<g clip-path="url(#rm)">{"".join(sub2.parts)}</g></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{"".join(c.parts)}</svg>')


if __name__ == "__main__":
    import cairosvg
    d = os.path.dirname(__file__); svg = build()
    open(f"{d}/05-article-reader.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"{d}/05-article-reader.png")
    print("05-article-reader ok")
