Native dropdown styled to the Hybrid well, with a custom chevron.

```jsx
<Select
  label="Branch"
  value={b}
  onChange={e => setB(e.target.value)}
  options={['main', 'develop', 'release/2.4']}
/>
```

`options` accepts strings or `{ value, label }`. Native menu = full keyboard/AT support.
