# lsp-extra

claude-plugins-official が提供していない LSP サーバを Claude Code から利用できるようにする。
プラグイン本体に実体は無く、`plugin.json` の `lspServers` 宣言だけで構成される。

## 提供する LSP サーバ

| 言語 / ファイル | サーバ | 想定パッケージ |
|---|---|---|
| TypeScript / JavaScript | `vtsls` | `vtsls` |
| Vue | `vue-language-server` | `vue-language-server` (Volar) |
| HTML | `vscode-html-language-server` | `vscode-langservers-extracted` |
| JSON / JSONC | `vscode-json-language-server` | `vscode-langservers-extracted` |

各 LSP サーバ本体は別途インストールし、PATH に通しておくこと。

## 注意

- **Vue hybrid mode**: `@vue/typescript-plugin` を vtsls に注入したいが、Claude Code の `lspServers` スキーマには `settings` フィールドが無いため、現状は注入できない。

## インストール

```bash
claude plugin install lsp-extra@ikmski-claude-code-plugins --scope local
```
