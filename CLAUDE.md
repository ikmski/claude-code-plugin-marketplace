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
    commands/                    # Slash command definitions (markdown files)
    skills/                      # Skill definitions (optional)
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

### Slash Commands (`plugins/{name}/commands/[{namespace}/]{command}.md`)
- コマンドは `commands/` 直下に置くか、任意のサブディレクトリで namespace 分類できる
  - 直下に置いた場合: `commands/commit.md` → `/{plugin}:commit`
  - namespace あり: `commands/ns/commit.md` → `/{plugin}:ns:commit`
- Each command file contains:
  - YAML frontmatter with `name` and `description`
  - Command prompt/instructions in the body (can be in Japanese or other languages)
  - Commands can accept arguments via `$1`, `$2`, etc.

### Skills (`plugins/{name}/skills/{skill-name}/`)
- Skills provide specialized knowledge and workflows to extend Claude's capabilities
- `SKILL.md` - メインのスキル定義ファイル。YAML frontmatter に `name`、`description`、`allowed-tools` を記載し、本文にガードレールや手順を記述する
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

Provides Git-related slash commands and a skill:

**Slash Commands:**
- `/git:commit` - Commits changes in the git worktree (reviews changes and creates commit)
- `/git:pr` - Creates a GitHub Pull Request from current branch (accepts base branch as `$1`, defaults to repository default branch if not specified)
- `/git:review` - Reviews changes before commit (checks for debug code, TODO comments, security issues, code quality, etc.)

**Skills:**
- `git-helper` - Git の日常作業（ブランチ操作、コミット作成、メッセージ整形、チェリーピック、タグ付け、PR 作成）を安全に支援するスキル。`allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep, Glob` で使用ツールを制限している

## Adding New Plugins

1. Create plugin directory under `plugins/{plugin-name}/`
2. Add plugin metadata in `plugins/{plugin-name}/.claude-plugin/plugin.json`
3. Add slash commands as markdown files in `plugins/{plugin-name}/commands/`（必要なら `commands/{namespace}/` サブディレクトリで分類）
4. (Optional) Add skills in `plugins/{plugin-name}/skills/{skill-name}/SKILL.md`
5. (Optional) Add hooks in `plugins/{plugin-name}/hooks/hooks.json`
6. Register plugin in `.claude-plugin/marketplace.json`

## Command Naming Convention

Slash commands follow the pattern: `/{plugin-name}:[{namespace}:]{command}` — namespace は任意。

Example (namespace なし): `/git:commit` where:
- `git` = plugin name
- `commit` = command name (filename without .md, in `commands/` directly)

Example (namespace あり): `/foo:bar:baz` where:
- `foo` = plugin name
- `bar` = namespace (subdirectory under `commands/`)
- `baz` = command name (filename without .md)

## Development Notes

このリポジトリはビルドシステムやテストフレームワークを持たない。すべてのプラグイン定義は純粋な **Markdown / JSON** ファイルで構成されており、コンパイルやトランスパイルは不要。変更後は Claude Code にインストールし直して動作を確認する。
