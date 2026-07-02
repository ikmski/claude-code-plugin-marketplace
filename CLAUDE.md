# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Please answer in Japanese

## Overview

This is the **Claude Code Plugin Marketplace** repository - a marketplace for distributing custom Claude Code plugins. It contains plugin definitions that can be installed into Claude Code to extend its functionality with custom slash commands and tools.

## Repository Structure

```
.claude-plugin/marketplace.json  # Marketplace metadata and plugin registry
plugins/                         # Directory containing individual plugins
  {plugin-name}/
    .claude-plugin/plugin.json   # Plugin metadata
    skills/                      # Skill definitions (slash commands are defined here)
      {skill-name}/
        SKILL.md                 # Skill definition and instructions
        reference.md             # Reference information (optional)
        examples.md              # Conversation examples (optional)
    hooks/                       # Hook definitions (optional)
      hooks.json                 # Hook event handlers
```

## Plugin Architecture

### Marketplace Definition (`.claude-plugin/marketplace.json`)
- Defines the marketplace name, description, and owner information
- Contains a `plugins` array listing all available plugins with their source paths
- Each plugin entry has: `name`, `source` (relative path), and `description`

### Plugin Definition (`plugins/{name}/.claude-plugin/plugin.json`)
- Metadata for individual plugins including `name`, `description`, `author`, and `keywords`
- Must be located in the plugin's `.claude-plugin/` subdirectory

### Skills (`plugins/{name}/skills/{skill-name}/`)
- Skills provide specialized knowledge and workflows to extend Claude's capabilities. スラッシュコマンドも Skills として定義する（公式は新規プラグインで `skills/` の利用を推奨）
- `SKILL.md` - メインのスキル定義ファイル。YAML frontmatter に `name`、`description`、`allowed-tools` を記載し、本文にガードレールや手順を記述する
  - 引数は `$ARGUMENTS`（全引数文字列）で参照する
- `reference.md` - 詳細なリファレンス情報（コマンド一覧、オプション説明など）
- `examples.md` - 会話例（ユーザーとの典型的なやり取りのサンプル）
- `SKILL.md` の `allowed-tools` でスキルが使用できるツールを制限できる（例: `Bash(git:*)`, `Read`, `Glob`）

### Hooks (`plugins/{name}/hooks/hooks.json`)
- Claude Code のライフサイクルイベントに応じて実行されるシェルコマンドを定義する
- サポートされるイベント: `Notification`（通知時）、`Stop`（タスク完了時）など
- 各フックは `type: "command"` と実行する `command` 文字列を持つ

## Current Plugins

### git Plugin
Location: `plugins/git/`

Provides Git-related skills (invoked as slash commands):

- `/git:commit` - リポジトリの変更をコミットする
- `/git:pr` - 現在のブランチを push して GitHub PullRequest を作成する（base branch を `$ARGUMENTS` で受け取る。未指定時は GitHub 上のデフォルトブランチ）
- `/git:review` - コミット前の変更をレビューする（デバッグコード・機密情報・TODO コメント・品質問題等）
- `/git:helper` - Git の日常作業（ブランチ操作、コミット、メッセージ整形、チェリーピック、タグ付け、PR 作成）を安全に支援する汎用スキル。自然言語トリガーでも発火する

### agent-team Plugin
Location: `plugins/agent-team/`

課題に応じて最適なチーム（Team Lead 1 名＋チームメイト最大 9 名＝総勢最大 10 名）を動的に編成する「チーム・オブ・チームズ」型マルチエージェントプラグイン。

- `/agent-team:lead` - Team Lead として課題分析・チーム編成・チームメイト起動・戦略判断・最終報告を行う
- `skills/lead/SKILL.md` が Team Lead のプロトコル本体。`reference.md` が Agent Teams API・テンプレート・チーム構成パターンのリファレンス、`examples.md` が会話例
- `skills/lead/roles/scaffolding/` に必須役割（Chief of Staff / Red-Team / QA-Manager）、`skills/lead/roles/common/` によく使う動的選択候補（backend / frontend / database / infrastructure / researcher / analyst / architect / tech-writer）を配置
- チーム作業は `.agent-team/{team-name}/` 配下の共有ワークスペース（`context.md` / `team-roster.md` / `issues.md` / `decisions.md` / `artifacts/`）で進行する

### lsp-extra Plugin
Location: `plugins/lsp-extra/`

claude-plugins-official が提供していない LSP サーバを Claude Code から利用できるようにするプラグイン。スキルやスラッシュコマンドは持たず、`plugin.json` の `lspServers` フィールドで LSP サーバを定義する。

- 提供する LSP サーバ:
  - `vtsls` - TypeScript / JavaScript（`.ts` / `.tsx` / `.mts` / `.cts` / `.js` / `.jsx` / `.mjs` / `.cjs`）
  - `vue` - Vue（`.vue`）。`vue-language-server` を使用
  - `html` - HTML（`.html` / `.htm`）。`vscode-html-language-server` を使用
  - `json` - JSON（`.json` / `.jsonc`）。`vscode-json-language-server` を使用
- 各サーバの実行コマンドは PATH 上に存在している必要がある（別途インストールが前提）

### design-system Plugin
Location: `plugins/design-system/`

vim-hybrid（Tomorrow-Night ベース）カラースキームをベースとしたダーク系デザインシステム「Hybrid」を提供する Skill プラグイン。

- `/design-system:hybrid-design` - ブランド準拠の UI / 成果物（HTML アーティファクトまたは本番コード）を生成する。`SKILL.md` の frontmatter に `user-invocable: true` を持つ
- `skills/hybrid-design/` に Agent Skills 形式のバンドル一式を内包する:
  - `SKILL.md`（スキル定義） / `README.md`（デザインガイド本体） / `styles.css`（トークン読み込みのエントリポイント）
  - `tokens/`（colors / fonts / typography / spacing）、`components/`（core / forms / feedback / data の React プリミティブ）、`guidelines/`（色・余白・タイプのプレビューカード）
  - 付随ファイル（`_ds_manifest.json` / `_ds_bundle.js` / `deck-stage.js` / `Hybrid Overview Deck.html` など）はバンドルをそのまま保持している
- このスキルはバンドル作者の定義を verbatim で保持しており、`allowed-tools` 制約は付けない（成果物・本番コードを書くため Write を要する）

### statusline Plugin
Location: `plugins/statusline/`

Claude Code の status line をセットアップするプラグイン。プラグインの `settings.json` が配布できるキーは現状 `agent` と `subagentStatusLine` のみでメインの `statusLine` は宣言的に配布できないため、「セットアップスキル方式」を採用している。

- `/statusline:setup` - バンドルされた `scripts/statusline.sh` を `~/.claude/statusline.sh` へコピーし、ユーザーの `~/.claude/settings.json` に `statusLine` 設定を書き込む。`$ARGUMENTS` でカスタマイズ要望（表示項目・色など）や解除（「解除」「remove」等）を受け付ける。プラグイン更新後は再実行するとバンドル版スクリプトが再コピーされて反映される（カスタマイズ済みの場合は diff 確認あり）
- スクリプトを安定パス（`~/.claude/`）へコピーするのは、`${CLAUDE_PLUGIN_ROOT}` がユーザー settings.json では展開されず、プラグイン更新でパスが変わるため
- デフォルトの表示: `dir |  branch | Model: name | Context: N% | Session: Hh Mm | Tokens: N.Nk | Cost: $N.NN`（依存なしの pure bash、jq 不要。データが取れないセグメントはセパレータごと省略）

## Adding New Plugins

1. Create plugin directory under `plugins/{plugin-name}/`
2. Add plugin metadata in `plugins/{plugin-name}/.claude-plugin/plugin.json`
3. Add skills (slash commands) in `plugins/{plugin-name}/skills/{skill-name}/SKILL.md`
4. (Optional) Add hooks in `plugins/{plugin-name}/hooks/hooks.json`
5. Register plugin in `.claude-plugin/marketplace.json`

## Skill Naming Convention

Skills are always namespaced as `/{plugin-name}:{skill-name}` — ディレクトリ名がそのままスキル名になる。

Example: `/git:commit` where:
- `git` = plugin name
- `commit` = skill name (directory under `skills/`, `SKILL.md` を内包)

## Development Notes

このリポジトリはビルドシステムやテストフレームワークを持たない。すべてのプラグイン定義は純粋な **Markdown / JSON** ファイルで構成されており、コンパイルやトランスパイルは不要。変更後は Claude Code にインストールし直して動作を確認する。
