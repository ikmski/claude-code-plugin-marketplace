# Claude Code Plugin Marketplace

[Claude Code](https://claude.com/claude-code) にインストール可能なカスタムプラグインを配布するためのマーケットプレイスです。

## 収録プラグイン

| プラグイン | 概要 |
|---|---|
| [`git`](plugins/git) | Git / GitHub の日常作業（commit / PR / review）を安全に支援するスラッシュコマンド群 |
| [`agent-team`](plugins/agent-team) | 課題に応じて最適なチームを動的に編成する「チーム・オブ・チームズ」型マルチエージェントプラグイン |

## インストール

Claude Code 上で次のコマンドを実行するとマーケットプレイスを追加できます。

```
/plugin marketplace add ikmski/claude-code-plugin-marketplace
```

追加後、`/plugin install <plugin-name>@ikmski-claude-code-plugins` で個別プラグインを導入します。

```
/plugin install git@ikmski-claude-code-plugins
/plugin install agent-team@ikmski-claude-code-plugins
```

## 提供するスラッシュコマンド

### `git` プラグイン
- `/git:commit` — 変更のコミット
- `/git:pr` — push と PullRequest 作成（base branch を引数で指定可）
- `/git:review` — コミット前の変更レビュー（デバッグ残存・機密情報・品質問題の検出）
- `/git:helper` — ブランチ操作・タグ付け等の汎用 Git 支援

### `agent-team` プラグイン
- `/agent-team:lead` — Team Lead として課題を分析し、チームを動的編成して委任実行する

## ライセンス・オーナー

- License: MIT — 詳細は [LICENSE](./LICENSE) を参照
- Owner: Masaki IKEDA (`ikeda.masaki@gmail.com`)
- Repository: <https://github.com/ikmski/claude-code-plugin-marketplace>
