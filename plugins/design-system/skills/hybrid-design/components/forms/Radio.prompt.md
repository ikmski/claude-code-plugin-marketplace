Circular radio. Use `RadioGroup` for a managed set.

```jsx
<RadioGroup
  value={v}
  onChange={setV}
  options={['main', 'develop', { value: 'release', label: 'release', disabled: true }]}
/>
```

`onChange(value)` receives the selected value. `direction="row"` lays them horizontally.
