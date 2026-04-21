---
name: git:pr
description: Create GitHub PullRequest
---

現在のブランチを push して PullRequest を作成してください。

- base branch は `$1`。引数が指定されなかった場合は GitHub 上のデフォルトブランチを使用してください。
- push 前に `git status` と `git log --oneline --graph -n 10` で投入されるコミット範囲をユーザーに提示してください。
- base branch との差分から PR タイトル・本文を生成し、`gh pr create` で作成してください。

安全対策・機密情報チェック・強制 push の扱いは `${CLAUDE_PLUGIN_ROOT}/skills/git-helper/reference.md` を参照してください。
