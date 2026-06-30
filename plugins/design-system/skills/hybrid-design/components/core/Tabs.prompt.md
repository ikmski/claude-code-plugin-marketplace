Underline tab bar. Controlled via value/onChange. Roving arrow-key focus.

```jsx
<Tabs
  value={tab}
  onChange={setTab}
  tabs={[
    { value: 'changes', label: 'Changes', badge: 3 },
    { value: 'history', label: 'History' },
    { value: 'blame', label: 'Blame', disabled: true },
  ]}
/>
```
