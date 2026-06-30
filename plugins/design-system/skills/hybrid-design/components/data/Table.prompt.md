Dense data grid. `columns` accepts strings or `{ key, label, align, render }`;
`rows` are objects keyed by column.

```jsx
<Table
  columns={[
    { key: 'job', label: 'Job' },
    { key: 'status', label: 'Status', render: v => <Badge tone={v === 'passed' ? 'green' : 'red'} dot>{v}</Badge> },
    { key: 'time', label: 'Time', align: 'right' },
  ]}
  rows={[
    { job: 'build', status: 'passed', time: '41s' },
    { job: 'test',  status: 'passed', time: '1m12s' },
  ]}
/>
```
