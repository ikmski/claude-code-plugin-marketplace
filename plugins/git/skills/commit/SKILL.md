---
name: commit
description: リポジトリの変更をコミットする。ユーザーが「コミット」「commit」と指示したときに発火する。
allowed-tools:
  - Bash(git:*)
  - Read
---

現在のリポジトリの変更をコミットしてください。

1. `git status` と `git diff --staged` で変更内容を確認し、ユーザーに提示する。
2. Conventional Commits 形式でコミットメッセージを提案する。
3. ユーザーの承認後に `git commit` を実行する。

規約・機密情報チェック・安全対策の詳細は `${CLAUDE_PLUGIN_ROOT}/skills/helper/reference.md` を参照してください。
