Primary action control — use for any clickable action; pick the variant by intent (solid=primary, danger=destructive, ghost=tertiary).

```jsx
<Button variant="solid" size="md" onClick={save}>Commit</Button>
<Button variant="ghost" size="sm" iconLeft={<Icon/>}>Discard</Button>
```

Variants: `solid` (blue, primary), `success` (green), `danger` (red), `secondary` (panel fill), `ghost` (transparent). Sizes: `sm | md | lg`. Hover = brighten, press = nudge down 1px. Label is monospace.
