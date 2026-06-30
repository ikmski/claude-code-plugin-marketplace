# Hybrid Design System

A dark, code-editor UI language built on the **vim-hybrid** color scheme by Andrew Wong (w0ng).
Source palette: <https://github.com/w0ng/vim-hybrid> — itself derived from Chris Kempson's
**Tomorrow-Night** (base16) RGB palette, jellybeans syntax grouping, and solarized's Vim code.

> The brief: *"https://github.com/w0ng/vim-hybrid のカラースキームをベースとした design system を作ってください"*
> — build a design system based on the vim-hybrid color scheme.

Hybrid takes a beloved terminal/editor theme and promotes it to a full product UI vocabulary:
deep neutral surfaces, eight muted syntax hues, monospace-forward type, and dense, technical
layouts. It began as **developer tooling** (editors, CI/CD dashboards, terminals, docs) and now
covers the **general-purpose** primitives any product UI needs — forms, navigation, overlays, data
tables, and loading states — all in the same calm, high-signal dark idiom.

---

## Sources

- **Color scheme:** w0ng/vim-hybrid `colors/hybrid.vim` — <https://github.com/w0ng/vim-hybrid>
- **Upstream palette:** Tomorrow-Night by Chris Kempson — <https://github.com/chriskempson/vim-tomorrow-theme>
- No codebase or Figma was attached; the system is an original UI language synthesized from the
  16-color hybrid palette. License of the palette: MIT.

---

## CONTENT FUNDAMENTALS

How copy is written in Hybrid surfaces.

- **Voice:** terse, technical, command-line adjacent. Write like a good commit message or man page.
- **Casing:** Sentence case for prose; **lowercase** for code-y nouns and commands (`main`, `npm test`,
  `git:(main)`); UPPERCASE + wide tracking only for tiny eyebrow labels (`EXPLORER`, `TERMINAL`, `TOKEN`).
- **Person:** mostly impersonal / imperative — "Commit", "Format on save", "This branch is behind main."
  Address the user as *you* only in guidance; never "we".
- **Numbers everywhere are real and specific:** `248 passed`, `~2m avg`, `Ln 11, Col 18`, `1h refresh window`.
  Precision is the brand — avoid vague quantifiers.
- **No emoji.** Status is carried by color + a glyph from the icon set (`✓ ✗ ! i`) or a colored dot,
  never an emoji. Terminal glyphs like `➜` and `git:( )` are fair game inside code/terminal contexts.
- **Vibe:** calm, focused, "build in the dark." Low-fatigue, high-signal, no marketing fluff.

Examples:
- Button labels: `Commit` · `Stage` · `Discard` · `Merge` · `Revert`
- Callout: *"Build passed — All 248 tests green in 41s."*
- Empty/disabled: *"Sign commits (locked)"*

---

## VISUAL FOUNDATIONS

- **Color:** background-led. The base ramp runs `#16181a → #1d1f21 → #282a2e → #373b41` for
  void/canvas/panel/border, then `#969896 → #c5c8c6 → #e0e0e0` for muted→fg→bright text. The eight
  syntax hues (red `#cc6666`, orange `#de935f`, yellow `#f0c674`, green `#b5bd68`, cyan `#8abeb7`,
  blue `#81a2be`, purple `#b294bb`, brown `#a3685a`) are **desaturated and equal-weight** — none
  screams. **Blue is the primary accent.** Accents appear as text/icons or soft 12% tints, rarely as
  large solid fills (the status bar is the notable exception).
- **Type:** monospace-forward. **JetBrains Mono** for headings, code, labels, and most UI chrome;
  **IBM Plex Sans** for running prose and longer body copy. Headings lean mono to keep the editor feel.
- **Spacing:** compact 4px grid (`4 8 12 16 24 32 48 64 80`). Dense, IDE-like. Generous whitespace is
  not the goal; information density is.
- **Backgrounds:** flat solid neutrals. **No gradients, no imagery, no texture, no patterns.** Depth
  comes from the surface ramp (stacking `void → canvas → panel → raised`), not from shadows or color.
- **Borders:** 1px hairlines are the primary separator (`--border-subtle` faint, `--border-default`
  standard `#373b41`, `--border-strong` for focus/emphasis). Used heavily — panels, tabs, rows, gutters.
- **Corner radii:** small and technical — `2/4/6/10px`. Buttons/inputs at 4px, cards at 6px. Pills
  (`999px`) reserved for toggles and dots only. Nothing is soft-and-rounded.
- **Shadows:** restrained, dark halos (`0 4px 12px rgba(0,0,0,.45)`), used only on things that truly
  float (popovers, command palette, code windows). Most surfaces use border + ramp, no shadow.
- **Cards:** panel surface + 1px `--border-default` + 6px radius + optional `--shadow-sm`. Optional
  header row with a mono title, muted meta, and right-aligned actions, divided by a hairline.
- **Hover states:** brighten (`filter: brightness(1.12)`) or a faint `rgba(255,255,255,0.03)` row wash.
- **Press states:** nudge down 1px (`translateY(1px)`). No scale-up, no bounce.
- **Focus:** keyboard focus is always visible. Solid controls (Button, Switch) get the offset
  double-ring `--ring` (a base-canvas gap + accent stroke that reads against any fill); sunken fields
  (Input) switch their 1px border to accent blue plus a soft 3px `--accent-tint` glow. Pointer clicks
  don't show the ring (`:focus-visible` only).
- **Motion:** quick and mechanical — `90–240ms`, `cubic-bezier(0.2,0,0,1)`. Fades and slides only;
  **no bounce, no spring, no decorative looping animation** (the one exception: a blinking text cursor).
- **Transparency/blur:** sparing. Modal scrims use `rgba(0,0,0,0.4)`; tints are flat colors, not alpha
  washes over imagery. No glassmorphism.
- **Imagery vibe:** there is essentially none — this is a chrome-and-code aesthetic. If a photo is ever
  needed, treat it cool, low-saturation, dark.
- **Signature motif:** the **window-chrome code panel** — traffic-light dots, a filename tab, a line
  gutter, and syntax-tinted tokens. It is the hero surface of the brand (`CodeBlock`).

---

## ICONOGRAPHY

- **Set:** [**Lucide**](https://lucide.dev) — clean, open-source, 1.5–2px stroke line icons. Loaded from
  CDN (`unpkg.com/lucide@0.395.0`). This is a **substitution** flagged below — vim-hybrid is a color
  scheme and ships no icon set, so Lucide was chosen for its neutral, technical, editor-friendly line
  style that matches the monospace UI.
- **Style:** stroked (never filled), inherit `currentColor`/the muted foreground; active icons step up
  to `--text-bright`. Sized 13–20px in chrome. Set `svg { fill: none }` so Lucide strokes render correctly.
- **Usage:** functional only — file types, git, run/debug, settings, search, chevrons. Status uses a
  colored glyph badge (`✓ ! × i`) or a colored dot, **never emoji**.
- **Unicode as icons:** terminal glyphs (`➜`, `git:( )`, `↑ ↓`) appear inside code/terminal contexts;
  outside those, use Lucide.

---

## INDEX / MANIFEST

Root:
- `styles.css` — **consumer entry point.** `@import`s only; reaches every token + font file below.
- `README.md` — this guide.
- `SKILL.md` — Agent-Skills-compatible front matter for use in Claude Code.

`tokens/` (all `@import`ed by `styles.css`):
- `colors.css` — base ramp, 8 syntax hues, tints, and all semantic aliases (surfaces, text, status, accent).
- `fonts.css` — IBM Plex Sans + JetBrains Mono (Google Fonts) → `--font-sans` / `--font-mono`.
- `typography.css` — family roles, type scale, weights, line-heights, tracking.
- `spacing.css` — 4px spacing scale, radii, borders, shadows, motion easings/durations.

`components/` — reusable React primitives (namespace `window.HybridDesignSystem_e4e0e4`):
- `core/` — **Button**, **Badge**, **Card**, **Avatar**, **Tabs**, **Tooltip**
- `forms/` — **Input**, **Textarea**, **Select**, **Checkbox**, **Radio** / **RadioGroup**, **Switch**
- `feedback/` — **Callout**, **CodeBlock** (the signature window-chrome code panel), **Spinner**,
  **ProgressBar**, **Modal**
- `data/` — **Table** (dense data grid)

All interactive controls share one behavior contract: `:focus-visible` keyboard rings (solid controls
use `--ring`, sunken fields use the accent-tint glow), proper ARIA roles/states, and the
brighten-on-hover / nudge-on-press motion language.

`guidelines/` — foundation specimen cards (Colors, Type, Spacing) shown in the Design System tab.

---

## CAVEATS / SUBSTITUTIONS

- **Fonts** are loaded from Google Fonts via `@import` (not self-hosted), so the compiler registers
  0 `@font-face` binaries. To fully self-host, drop `.woff2` files in `assets/fonts/` and repoint
  `tokens/fonts.css`. Font choice (Plex Sans + JetBrains Mono) is a design decision, not from source.
- **Icons** use Lucide via CDN — a substitution, since vim-hybrid ships no icons.
