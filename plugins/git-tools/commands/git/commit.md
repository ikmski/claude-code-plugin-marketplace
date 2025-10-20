---
name: git:commit
description: Commit Git worktree
---

git worktree 内の変更を確認して commit してください。

## ガイドライン

コミット作成時は、`plugins/git-tools/skills/git-helper/reference.md` を参照し、以下に従ってください：
- コミットメッセージ規約（Conventional Commits）に準拠する
- 機密情報（`.env`, `.pem`, `.key`, `secrets/`, `config/` など）が含まれていないか確認する
- `git status` と `git diff --staged` で変更内容を確認してから実行する
- `.gitignore` の適切性を確認する

