---
name: commit
description: Commit changes in the current repository
---

現在のリポジトリの変更をコミットしてください。

1. `git status` と `git diff --staged` で変更内容を確認し、ユーザーに提示する。
2. Conventional Commits 形式でコミットメッセージを提案する。
3. ユーザーの承認後に `git commit` を実行する。

規約・機密情報チェック・安全対策の詳細は `${CLAUDE_PLUGIN_ROOT}/skills/git-helper/reference.md` を参照してください。
