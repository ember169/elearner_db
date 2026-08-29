# Cartableo V4 — mockups

High-fidelity mockups for every V4 screen, desktop and mobile, on the family
design system shared with Leofresh, Decathleo and Comptableo.

| File | Screen | Shows |
|------|--------|-------|
| `01-dashboard.png` | Dashboard `/` | Review queue, streak/XP, daily focus, mentor briefing, competency mini-heatmap |
| `02-board.png` | Board `/board` | Kanban moved intact from `/`; mobile is the existing column swipe |
| `03-learn.png` | Learn `/learn` | Search, filter chips, competency-grouped grid, detail panel |
| `04-knowledge.png` | Knowledge `/knowledge` | Competency grid, six tiers each, at/above-level indicators |
| `05-article-reader.png` | Article reader | Markdown, code, Mermaid, highlight + annotation margin, export, fullscreen |
| `06-goals.png` | Goals `/goals` | Goal hierarchy with pacing, tree + detail split |
| `07-progress.png` | Progress `/progress` | Activity bars, competency heatmap, year streak grid, platform sparklines |
| `08-settings.png` | Settings `/settings` | Objective, cloud key, platform credentials, sync scheduling |
| `09-light-theme.png` | Dashboard, light | The warm-paper token set — a separate set, never an inversion |

## How they are made

Not drawn by hand: `kit.py` holds the tokens and the family components (chip,
button, card, rail, tab bar, the mark), and each `pNN_*.py` composes one screen
from them. That is deliberate — consistency between mockups *is* the design
system, and a shared kit cannot drift the way sixteen hand-drawn files would.

Rebuild everything:

```bash
python3 docs/mockups/build_all.py
```

Each script emits an SVG and a PNG side by side. The SVG is the source; the PNG
is what gets reviewed.

## Rules these mockups encode

- **Type roles.** Screen titles are Archivo 700 — the handoff is explicit that
  the serif is for content names only, so DM Serif Display appears on article
  titles and the wordmark, nowhere else.
- **Chips are mono.** JetBrains Mono at radius 9 on a raised fill. Only labels
  are uppercased, never values like `3h` or `12 of 181`.
- **Buttons are Archivo 700 with a centred label**, 44px floor, full-width for
  a primary action.
- **Section titles are plain text.** No icons, no emoji.
- **Cloud features are hidden without a key, never disabled.** Mockup `05`
  shows both states: desktop with a key (go deeper visible), mobile without.
- **Dataviz.** Bars for weekly volume, a line for anything continuous, dots for
  attendance — never a curve, because an attendance curve that dips reads as a
  reproach.
- **Destructive actions are text-only**, never a filled button.

## Fonts

The mockups render with the real family faces. They are installed from the
project's own `public/fonts/` woff2 files, converted to static TTFs:

```bash
python3 docs/mockups/install_fonts.py
```

Without that step the text falls back to Noto and the type roles stop reading.
