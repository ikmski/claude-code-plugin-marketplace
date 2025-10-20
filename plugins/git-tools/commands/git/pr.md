---
name: git:pr
description: Create GitHub PullRequest
---

現在の branch を push して PullRequest を作成してください。
その際 base branch との差分を確認して PullRequest の説明を記述してください。
base branch は $1 です。
引数が指定されなかった場合は GitHub 上のデフォルトブランチを base branch としてください。

## ガイドライン

PullRequest 作成時は、`plugins/git-tools/skills/git-helper/reference.md` を参照し、以下に従ってください：
- 安全対策・ガードレールに従う（特に `reset --hard`, `push -f` は禁止、`--force-with-lease` のみ許可）
- push 前に `git status` と `git log --oneline --graph -n 10` で状態を確認し、ユーザーに提示する
- 機密情報（`.env`, `.pem`, `.key`, `secrets/`, `config/` など）が含まれていないか最終確認する
- PR の説明は base branch との差分から生成する
