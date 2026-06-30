Elevated panel surface — the default container for grouped content. Optional header with title, meta, and actions.

```jsx
<Card title="deploy.yml" meta="modified 2m ago" actions={<Button size="sm" variant="ghost">Edit</Button>}>
  …body…
</Card>
```

`padded={false}` for edge-to-edge content (tables, code). Uses panel surface + hairline border + small shadow.
