Centered dialog over a dim scrim. Esc and backdrop-click close.

```jsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Discard changes?"
  actions={<>
    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="danger" onClick={discard}>Discard</Button>
  </>}
>
  This will revert 3 modified files. This cannot be undone.
</Modal>
```
