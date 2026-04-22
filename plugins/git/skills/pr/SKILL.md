---
name: pr
description: 現在のブランチを push して GitHub PullRequest を作成する。ユーザーが「PR 作成」「プルリクエスト」「pr」と指示したときに発火する。
allowed-tools:
  - Bash(git:*)
  - Bash(gh:*)
  - Read
---

現在のブランチを push して PullRequest を作成してください。

- base branch は `$ARGUMENTS`。引数が指定されなかった場合は GitHub 上のデフォルトブランチを使用してください。
- push 前に `git status` と `git log --oneline --graph -n 10` で投入されるコミット範囲をユーザーに提示してください。
- base branch との差分から PR タイトル・本文を生成し、`gh pr create` で作成してください。

安全対策・機密情報チェック・強制 push の扱いは `${CLAUDE_PLUGIN_ROOT}/skills/helper/reference.md` を参照してください。
