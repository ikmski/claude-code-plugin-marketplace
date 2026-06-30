---
name: hybrid-design
description: Use this skill to generate well-branded interfaces and assets for Hybrid, a dark code-editor design system based on the vim-hybrid (Tomorrow-Night) color scheme — for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Quick orientation:
- `styles.css` is the single entry point — link it and you get every token (`tokens/colors.css`, `fonts.css`, `typography.css`, `spacing.css`).
- Palette is dark and background-led: surfaces `#16181a → #1d1f21 → #282a2e → #373b41`; eight muted syntax hues; **blue `#81a2be` is the primary accent**.
- Type is monospace-forward: JetBrains Mono for headings/code/labels, IBM Plex Sans for prose.
- Components live under `components/` — **core** (Button, Badge, Card, Avatar, Tabs, Tooltip), **forms** (Input, Textarea, Select, Checkbox, Radio/RadioGroup, Switch), **feedback** (Callout, CodeBlock, Spinner, ProgressBar, Modal), and **data** (Table); the signature surface is the window-chrome `CodeBlock`.
- Icons: Lucide via CDN, stroked, never filled. No emoji.
- Interactive controls share one contract: `:focus-visible` keyboard rings, ARIA roles/states, brighten-on-hover, nudge-on-press.
