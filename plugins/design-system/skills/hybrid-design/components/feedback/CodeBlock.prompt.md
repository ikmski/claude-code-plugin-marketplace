The signature Hybrid surface — a window-chrome code/terminal panel with traffic-light dots, filename tab, line gutter, and syntax-tinted tokens.

```jsx
<CodeBlock filename="main.rs" lines={[
  [{t:'fn ',c:'kw'},{t:'main',c:'fn'},{t:'() {'}],
  [{t:'  println!',c:'fn'},{t:'('},{t:'"hi"',c:'str'},{t:');'}],
  [{t:'}'}],
]} />
```

Token keys → hues: `kw` purple, `fn` blue, `str` green, `num` orange, `cls` yellow, `esc` cyan, `com` muted, `err` red, `pun` secondary. Pass plain `code` for un-tinted text. `showGutter={false}` to hide line numbers.
