# TFT Doctor — Design System & Brand Guide

## Brand Identity

**Name:** TFT Doctor
**Tagline:** Situational Advisor for TFT
**Personality:** A chill friend who happens to be cracked at TFT — informative, directional, and reliable.
**Feel:** Informed, empowered, focused, relieved
**Positioning:** Premium-leaning. "Oh shit, I get access to TFT Doctor — it's so good I wouldn't use any other platform."

### Logo Direction
- Pengu Little Legend "eyes" and "nose" with a doctor hat/mask/stethoscope
- Flat icon style
- Robert will create this externally
- Text logo: "TFT" (lighter weight) + "Doctor" (bold + accent color)

---

## Color Palette

### Background Scale (Charcoal, layered hierarchy)
| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#1B1B1F` | Page background |
| `--card` | `#242428` | Card surfaces |
| `--elevated` | `#2E2E33` | Raised elements, hover states |
| `--border` | `#3A3A40` | Borders, dividers |
| `--input` | `#32323A` | Input field backgrounds |

### Foreground
| Token | Hex | Usage |
|-------|-----|-------|
| `--foreground` | `#E8E4E0` | Primary text (warm white) |
| `--muted-foreground` | `#8A8A95` | Secondary/muted text |

### Accent — Pearl (Primary Brand)
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#EDE9E3` | Headings, CTAs, active states |
| `--primary-hover` | `#D8D3CC` | Pearl darkened for hover |
| `--primary-muted` | `#EDE9E3` at 15% | Subtle pearl backgrounds |

### Accent — Dusty Rose (Secondary Brand)
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#CC7B73` | Highlights, badges, emphasis |
| `--accent-hover` | `#C4908A` | Rose darkened for hover |
| `--accent-muted` | `#CC7B73` at 10% | Subtle rose backgrounds |

### Tier Colors (Softened)
| Tier | Hex | Description |
|------|-----|-------------|
| S | `#CC7B73` | Dusty rose (brand accent) |
| A | `#E0C9A0` | Warm gold, muted |
| B | `#8A9AAF` | Soft steel blue |
| C | `#6A6A75` | Muted gray |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--destructive` | `#C47070` | Errors |
| `--success` | `#7EAF8B` | Confirmations |
| `--warning` | `#D4B870` | Caution |

---

## Typography

**Font Family:** Outfit (Google Fonts) — all weights, free

| Element | Weight | Size | Notes |
|---------|--------|------|-------|
| Heading 1 | 800 (ExtraBold) | 36px / text-4xl | Page titles |
| Heading 2 | 700 (Bold) | 28px / text-2xl | Section headers |
| Heading 3 | 700 (Bold) | 20px / text-xl | Subsection headers |
| Body | 400 (Regular) | 16px / text-base | Default text |
| Body small | 400 (Regular) | 14px / text-sm | Descriptions |
| Caption/Label | 500 (Medium) | 12px / text-xs | Uppercase, tracking-wide |
| Badge text | 600 (SemiBold) | 12px / text-xs | Badges, tags |

---

## Spacing & Layout

| Property | Value |
|----------|-------|
| Content max-width | 1280px (`max-w-7xl`) |
| Page padding | `px-4 sm:px-6 lg:px-8` |
| Card padding | `p-4` (16px) |
| Card gap | `gap-4` (16px) |
| Card border-radius | 12px (`rounded-xl`) |
| Section spacing | `space-y-6` |
| Filter bar height | ~56-64px |

---

## Component Styles

- **Cards**: `bg-card` + `border border-border` + `rounded-xl`, flat (no shadow)
- **Buttons (primary)**: `bg-primary text-background` (pearl on charcoal)
- **Buttons (secondary)**: `bg-elevated text-foreground border-border`
- **Badges**: Pill-shaped (`rounded-full`), tier-colored at 15% opacity + matching text
- **Inputs**: `bg-input border-border` + `focus:border-primary`
- **Loading**: Centered spinner overlay, NOT skeletons
- **Animations**: None. Instant state changes only.

---

## Page Architecture

```
/ (Main App — unified view)
├── Navbar (logo + "Comps" + "Patch")
├── Filter Bar (sticky below navbar)
│   ├── Augment selector
│   ├── Emblem selector
│   └── Artifact selector
├── Content Area
│   ├── No filters → "All Comps" (tier-grouped grid)
│   └── Filters active → "Recommended for You" + sorted results
├── [Ad banner slot — between card rows, every ~8 cards]
└── Footer

/comps/[compId] (Comp Detail)
├── Back navigation
├── Comp header (name, tier, synergies, difficulty)
├── Board Placement (visual grid)
├── Champion list with items
├── Item priority / carousel guide
├── Carry alternatives
├── Augment recommendations (by tier)
├── Leveling / rolling guide
├── Early/mid game transition plan
├── [Ad banner slot]
└── Footer

/patch (Patch & Data Status — restyle to match)
/terms, /privacy (restyle to match)
```

### Comp Card (Summary View)
Each card displays:
- Comp name + Tier badge (S/A/B/C)
- Synergy icons
- Champion portraits (8 unit icons)
- Core carry + BIS items (2-3 item icons)
- Difficulty indicator (Easy / Medium / Hard)

### Filters
- Augment selector
- Emblem selector
- Artifact selector
- NO stage selector, NO item selector

---

## Ad Placement Strategy

- **Minimal** to start
- Banner between comp card rows (every ~8 cards on main page)
- Banner in comp detail page (between sections)
- Banner at page bottom
- No side whitespace ads initially
- Must be visible on mobile
- Ads should NOT influence content layout

---

## Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dark mode only | Yes | Target audience (gamers) prefers dark. No light mode planned. |
| Charcoal, not near-black | VSCode-style layered grays | Easier on the eyes, adds hierarchy |
| Pearl + Dusty Rose | Brand colors | "Doctor's office" feel, premium, breaks away from TFT's purple/gold |
| Outfit font | Single family, all weights | Clean, modern, friendly. Not basic like Inter/Roboto. |
| No animations | Instant changes only | Performance, simplicity, "snappy and fast" |
| Spinners, not skeletons | Loading overlays | Explicit loading state preference |
| Merged pages | Home = Advisor = Meta | Single focused flow: filter → pick comp → see guide |
| Medium density | Breathing room for icons | Not sparse (Apple) or dense (op.gg) |
