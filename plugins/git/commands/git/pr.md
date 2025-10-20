---
name: git:pr
description: Create GitHub PullRequest
---

現在の branch を push して PullRequest を作成してください。
その際 base branch との差分を確認して PullRequest の説明を記述してください。
base branch は $1 です。
引数が指定されなかった場合は GitHub 上のデフォルトブランチを base branch としてください。
