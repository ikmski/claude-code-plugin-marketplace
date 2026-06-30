Multi-line monospace field. Sunken well, blue focus glow, error state.

```jsx
<Textarea label="Commit message" rows={4} value={msg} onChange={e => setMsg(e.target.value)} />
```

Vertically resizable. Pass `error` for the danger border.
