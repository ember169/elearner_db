"""
Mockup kit for Cartableo V4 — SVG primitives on the family design system.

One source, two outputs: the SVG renders inline as a widget, and cairosvg
turns the same string into the PNG in this folder. Every measurement here
comes from the Leofresh/Decathleo handoffs, so the mockups cannot drift from
the system the way hand-drawn ones would.
"""

# ── Tokens (family neutrals + Cartableo's gold) ──────────────────────────────
DARK = dict(
    bg="#131211", card="#1d1c19", raised="#242320", raised_hover="#2f2e29",
    line="#35342f", text="#f7f3ea", second="#c2c0b8", muted="#98968d",
    accent="#d7c19c", accent_tint="#2a2620", on_accent="#131211",
    success="#57b37f", warn="#e08a3c", danger="#e67078", info="#50a9d9",
    success_tint="#1e2a23", warn_tint="#2b2218", danger_tint="#2b1d1e",
)
LIGHT = dict(
    bg="#f7f4ec", card="#ffffff", raised="#efeadf", raised_hover="#e5dfd1",
    line="#e0d9c9", text="#16241d", second="#4e5854", muted="#69726f",
    accent="#7a5c1f", accent_tint="#efe7d5", on_accent="#fdfaf0",
    success="#2e7a54", warn="#9d5913", danger="#a32430", info="#1f6a91",
    success_tint="#e4efe8", warn_tint="#f4eadd", danger_tint="#f6e5e6",
)

SANS = "Archivo"
SERIF = "DM Serif Display"
MONO = "JetBrains Mono"

# Mean advance width as a fraction of font size. Monospace is exact; the
# others are measured averages, enough to wrap mockup copy convincingly.
ADVANCE = {(SANS, False): 0.505, (SANS, True): 0.535, (SERIF, False): 0.487,
           (MONO, False): 0.600, (MONO, True): 0.600}


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def width_of(s, font, size, bold=False, tracking=0.0):
    adv = ADVANCE.get((font, bold), 0.52)
    return len(s) * size * adv + max(0, len(s) - 1) * tracking


def wrap(s, font, size, max_w, bold=False):
    out, line = [], ""
    for word in s.split():
        trial = f"{line} {word}".strip()
        if width_of(trial, font, size, bold) <= max_w or not line:
            line = trial
        else:
            out.append(line)
            line = word
    if line:
        out.append(line)
    return out


class Canvas:
    def __init__(self, w, h, t=DARK, page_bg=None):
        self.w, self.h, self.t = w, h, t
        self.parts = []
        self.rect(0, 0, w, h, page_bg or t["bg"])

    def raw(self, s):
        self.parts.append(s)

    def rect(self, x, y, w, h, fill, r=0, stroke=None, sw=1, dash=None, op=None):
        a = [f'x="{x}" y="{y}" width="{w}" height="{h}"']
        if r: a.append(f'rx="{r}"')
        a.append(f'fill="{fill}"' if fill else 'fill="none"')
        if stroke: a.append(f'stroke="{stroke}" stroke-width="{sw}"')
        if dash: a.append(f'stroke-dasharray="{dash}"')
        if op is not None: a.append(f'opacity="{op}"')
        self.raw(f'<rect {" ".join(a)}/>')

    def circle(self, cx, cy, r, fill=None, stroke=None, sw=1, op=None):
        a = [f'cx="{cx}" cy="{cy}" r="{r}"', f'fill="{fill}"' if fill else 'fill="none"']
        if stroke: a.append(f'stroke="{stroke}" stroke-width="{sw}"')
        if op is not None: a.append(f'opacity="{op}"')
        self.raw(f'<circle {" ".join(a)}/>')

    def line(self, x1, y1, x2, y2, stroke, sw=1, op=None):
        o = f' opacity="{op}"' if op is not None else ""
        self.raw(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                 f'stroke="{stroke}" stroke-width="{sw}"{o}/>')

    def path(self, d, fill="none", stroke=None, sw=1, cap="round", op=None):
        a = [f'd="{d}"', f'fill="{fill}"']
        if stroke: a.append(f'stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}" stroke-linejoin="round"')
        if op is not None: a.append(f'opacity="{op}"')
        self.raw(f'<path {" ".join(a)}/>')

    def text(self, x, y, s, font=SANS, size=15, fill=None, bold=False,
             anchor="start", tracking=None, op=None, upper=False):
        s = s.upper() if upper else s
        f = fill or self.t["text"]
        a = [f'x="{x}" y="{y}"', f'font-family="{font}"', f'font-size="{size}"', f'fill="{f}"']
        if bold: a.append('font-weight="700"')
        if anchor != "start": a.append(f'text-anchor="{anchor}"')
        if tracking: a.append(f'letter-spacing="{tracking}"')
        if op is not None: a.append(f'opacity="{op}"')
        self.raw(f'<text {" ".join(a)}>{esc(s)}</text>')

    def para(self, x, y, s, font=SANS, size=15, fill=None, max_w=300,
             lh=1.55, bold=False, limit=None):
        lines = wrap(s, font, size, max_w, bold)
        if limit and len(lines) > limit:
            lines = lines[:limit]
            lines[-1] = lines[-1].rstrip(".,;") + "…"
        for i, ln in enumerate(lines):
            self.text(x, y + i * size * lh, ln, font, size, fill, bold)
        return y + len(lines) * size * lh

    # ── Family components ───────────────────────────────────────────────────
    def chip(self, x, y, label, kind="meta", size=11, icon_dot=None):
        """Mono chip, radius 9, 5-7 x 8-11 padding. `truth` takes the accent
        tint and is reserved for facts the app vouches for."""
        t = self.t
        fills = {"meta": (t["raised"], t["second"]),
                 "truth": (t["accent_tint"], t["accent"]),
                 "success": (t["success_tint"], t["success"]),
                 "warn": (t["warn_tint"], t["warn"]),
                 "danger": (t["danger_tint"], t["danger"]),
                 "ghost": (None, t["muted"])}
        bg, fg = fills[kind]
        pad_l = 10 + (12 if icon_dot else 0)
        w = width_of(label, MONO, size) + pad_l + 10
        h = size + 12
        if bg:
            self.rect(x, y, w, h, bg, r=9)
        else:
            self.rect(x, y, w, h, None, r=9, stroke=t["line"])
        if icon_dot:
            self.circle(x + 12, y + h / 2, 3.5, icon_dot)
        self.text(x + pad_l, y + h / 2 + size * 0.36, label, MONO, size, fg)
        return w

    def label_mono(self, x, y, s, fill=None, size=10):
        """Uppercase mono label at the family's .1em tracking."""
        self.text(x, y, s, MONO, size, fill or self.t["muted"],
                  tracking=size * 0.1, upper=True)

    def button(self, x, y, w, label, kind="primary", h=48, size=15):
        """Archivo 700, centred label, no icon — the family's button."""
        t = self.t
        if kind == "primary":
            self.rect(x, y, w, h, t["accent"], r=12)
            fg = t["on_accent"]
        elif kind == "secondary":
            self.rect(x, y, w, h, t["raised"], r=12)
            fg = t["text"]
        else:
            self.rect(x, y, w, h, None, r=12, stroke=t["line"])
            fg = t["second"]
        self.text(x + w / 2, y + h / 2 + size * 0.36, label, SANS, size, fg,
                  bold=True, anchor="middle")

    def card(self, x, y, w, h, r=14, raised=False, accent=False, dashed=False):
        t = self.t
        if dashed:
            self.rect(x, y, w, h, None, r=r, stroke=t["line"], dash="5 4")
        else:
            self.rect(x, y, w, h, t["raised"] if raised else t["card"], r=r,
                      stroke=t["accent"] if accent else t["line"],
                      sw=1.5 if accent else 1)

    def mark(self, cx, cy, d=38):
        """The Cartableo mark: gold disc, one groove, prompt core."""
        t = self.t
        r = d / 2
        self.circle(cx, cy, r, t["accent"])
        self.circle(cx, cy, r * 0.84, None, stroke=t["bg"], sw=r * 0.073, op=0.28)
        s = d / 32
        self.path(f"M{cx - 4 * s} {cy - 6.5 * s}L{cx + 4.5 * s} {cy}L{cx - 4 * s} {cy + 6.5 * s}",
                  stroke=t["bg"], sw=3.4 * s)


# ── App chrome ───────────────────────────────────────────────────────────────
RAIL_W = 96
# Five destinations on the learning loop; settings lives in the header, not the
# nav. The rail and the phone bar carry the same five — nothing overflows.
NAV = [("today", "dash"), ("board", "cal"), ("learn", "book"),
       ("progress", "map")]
TAB = NAV


def _icon(c, kind, cx, cy, s, col):
    """Lucide-flavoured glyphs at 2px stroke — enough to read as the icon."""
    h = s / 2
    if kind == "cal":
        c.rect(cx - h, cy - h + 2, s, s - 3, None, r=2.5, stroke=col, sw=2)
        c.line(cx - h, cy - h + 6.5, cx + h, cy - h + 6.5, col, 2)
        c.line(cx - h + 4, cy - h - 1, cx - h + 4, cy - h + 4, col, 2)
        c.line(cx + h - 4, cy - h - 1, cx + h - 4, cy - h + 4, col, 2)
    elif kind == "target":
        c.circle(cx, cy, h, None, stroke=col, sw=2)
        c.circle(cx, cy, h * 0.55, None, stroke=col, sw=2)
        c.circle(cx, cy, 1.6, col)
    elif kind == "book":
        c.path(f"M{cx - h} {cy - h + 1}h{h - 2}a3 3 0 0 1 3 3v{s - 4}"
               f"a3 3 0 0 0-3-3h-{h - 2}z", stroke=col, sw=2)
        c.path(f"M{cx + h} {cy - h + 1}h-{h - 2}a3 3 0 0 0-3 3v{s - 4}"
               f"a3 3 0 0 1 3-3h{h - 2}z", stroke=col, sw=2)
    elif kind == "note":
        c.rect(cx - h + 1, cy - h, s - 2, s, None, r=2.5, stroke=col, sw=2)
        c.line(cx - h + 5, cy - 3, cx + h - 4, cy - 3, col, 2)
        c.line(cx - h + 5, cy + 2, cx + h - 7, cy + 2, col, 2)
    elif kind == "map":
        c.path(f"M{cx - h} {cy + h - 1}v-{s - 3}l{s / 3} -2.5 {s / 3} 2.5 "
               f"{s / 3} -2.5v{s - 3}l-{s / 3} 2.5 -{s / 3} -2.5z", stroke=col, sw=2)
    elif kind == "check":
        c.rect(cx - h + 2, cy - h + 1, s - 4, s - 2, None, r=2.5, stroke=col, sw=2)
        c.path(f"M{cx - 3} {cy}l2.5 2.5 4.5 -5", stroke=col, sw=2)
    elif kind == "dash":
        g = s * 0.42
        for dx in (-g / 1.6, g / 1.6):
            for dy in (-g / 1.6, g / 1.6):
                c.rect(cx + dx - g / 2, cy + dy - g / 2, g, g, None, r=2, stroke=col, sw=2)
    elif kind == "settings_gear":
        c.circle(cx, cy, s * 0.24, None, stroke=col, sw=2)
        c.circle(cx, cy, s * 0.45, None, stroke=col, sw=2)
    elif kind == "dots":
        for dx in (-5, 0, 5):
            c.circle(cx + dx, cy, 1.9, col)


def rail(c, active, y0=0, h=None):
    """96px rail: lockup, 72x60 items with mono labels, accent-tint active
    block, secondary group pinned to the bottom."""
    t = c.t
    h = h or c.h
    c.rect(0, y0, RAIL_W, h, t["bg"])
    c.line(RAIL_W, y0, RAIL_W, y0 + h, t["line"], 1)
    c.mark(RAIL_W / 2, y0 + 34, 38)
    c.text(RAIL_W / 2, y0 + 68, "Cartableo", SERIF, 15, t["text"], anchor="middle")

    y = y0 + 88
    for name, ic in NAV:
        on = name == active
        if on:
            c.rect(RAIL_W / 2 - 36, y, 72, 60, t["accent_tint"], r=14)
        col = t["accent"] if on else t["muted"]
        _icon(c, ic, RAIL_W / 2, y + 22, 21, col)
        c.text(RAIL_W / 2, y + 46, name, MONO, 9, col, anchor="middle", tracking=0.9)
        y += 64

    ys = y0 + h - 74
    on = active == "settings"
    if on:
        c.rect(RAIL_W / 2 - 36, ys, 72, 60, t["accent_tint"], r=14)
    col = t["accent"] if on else t["muted"]
    c.circle(RAIL_W / 2, ys + 22, 8.5, None, stroke=col, sw=2)
    c.circle(RAIL_W / 2, ys + 22, 2.6, col)
    c.text(RAIL_W / 2, ys + 46, "settings", MONO, 9, col, anchor="middle", tracking=0.9)


def tabbar(c, active, x, y, w):
    """52px row + 22px home-indicator spacer, top hairline, five items."""
    t = c.t
    c.rect(x, y, w, 74, t["bg"])
    c.line(x, y, x + w, y, t["line"], 1)
    step = w / 5
    for i, (name, ic) in enumerate(TAB):
        cx = x + step * i + step / 2
        col = t["accent"] if name == active else t["muted"]
        _icon(c, ic, cx, y + 18, 20, col)
        c.text(cx, y + 38, name, MONO, 9, col, anchor="middle", tracking=0.9)
    c.rect(x + w / 2 - 60, y + 60, 120, 4, t["line"], r=2)


def phone(c, x, y, w=375, h=760, t=None):
    """375pt phone frame. Returns the content-area origin."""
    t = t or c.t
    c.rect(x - 10, y - 10, w + 20, h + 20, t["line"], r=32, op=0.5)
    c.rect(x, y, w, h, t["bg"], r=24)
    c.text(x + 20, y + 26, "9:41", MONO, 12, t["text"])
    c.rect(x + w - 46, y + 16, 26, 13, None, r=3.5, stroke=t["muted"], sw=1.2)
    c.rect(x + w - 44, y + 18, 18, 9, t["muted"], r=2)
    return x, y + 44


def screen_label(c, x, y, tag, title, note=None):
    t = c.t
    c.rect(x, y - 15, 26 + len(tag) * 7, 22, t["raised"], r=7)
    c.text(x + 9, y + 1, tag, MONO, 11, t["accent"])
    c.text(x + 38 + len(tag) * 7, y + 1, title, SANS, 15, t["text"], bold=True)
    if note:
        c.text(x + 38 + len(tag) * 7 + width_of(title, SANS, 15, True) + 14, y + 1,
               note, MONO, 11, t["muted"])


def back_link(c, x, y, label="All competencies"):
    """Drawn arrow — the arrow glyph is absent from Archivo and renders tofu."""
    t = c.t
    c.line(x, y, x + 13, y, t["muted"], 1.8)
    c.path(f"M{x + 5} {y - 4.5}L{x} {y}L{x + 5} {y + 4.5}", stroke=t["muted"], sw=1.8)
    c.text(x + 22, y + 5, label, SANS, 14, t["muted"])


def phone_header(c, x, y, w):
    """Phone-only header: the lockup and a settings action, which the family
    keeps out of the tab bar."""
    t = c.t
    c.mark(x + 18, y + 4, 22)
    c.text(x + 36, y + 10, "Cartableo", SERIF, 17, t["text"])
    c.rect(x + w - 52, y - 8, 34, 34, t["raised"], r=12)
    _icon(c, "settings_gear", x + w - 35, y + 9, 17, t["second"])


def _settings_gear(c, cx, cy, s, col):
    h = s / 2
    c.circle(cx, cy, h * 0.5, None, stroke=col, sw=2)
    c.circle(cx, cy, h, None, stroke=col, sw=2)
