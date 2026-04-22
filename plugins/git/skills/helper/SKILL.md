---
name: helper
description: Git / GitHub の日常作業（ブランチ操作、コミット、メッセージ整形、チェリーピック、タグ付け、PullRequest 作成）を安全に支援する。ユーザーが「git」「ブランチ」「コミット」「タグ」「PR」などに言及したときに発火する。
allowed-tools:
  - Bash(git:*)
  - Bash(gh:*)
  - Read
  - Grep
  - Glob
---

Git 操作を行う前にこの Skill のガードレールに従い、詳細な規約は `reference.md` を、典型的な会話フローは `examples.md` を参照する。

## ガードレール（Git 固有）

1. **機密情報の検出**: 差分に機密情報（API キー、トークン、`.env`／鍵ファイル等）が含まれる場合は中断する。検出対象と対応手順は `reference.md` §3 を読む。
2. **強制 push**: `git push -f` / `--force` は使わず、`git push --force-with-lease` を使う。force push が必要な場面では、対象ブランチの共有範囲と上書きの影響をユーザーに確認する。
3. **コミット前確認**: 毎コミットで `git status` と `git diff --staged` を提示してから実行する。
4. **リモート書き込み前**: push / PR 作成の直前に `git log --oneline --graph -n 10` で投入されるコミット範囲をユーザーに提示する。
5. **pre-commit フック**: 失敗時は原因を修正して再コミットする。`--no-verify` は使わない。

## 主なタスク

- **ブランチ操作**: 作成・切替・一覧・削除。命名はユーザー指定に従う。
- **コミット作成**: Conventional Commits（`reference.md` §2）に沿ってメッセージを提案し、承認後に実行。
- **レビュー補助**: 変更サイズの目安を示し、必要なら分割を提案。
- **PullRequest 作成**: `gh pr create` で作成。PR 本文は base branch との差分から生成。
- **タグ付け・リリース**: SemVer。署名付きタグを優先し、鍵未設定時は注釈付きタグにフォールバック（`reference.md` §4）。

## 参照ファイルを開くタイミング

- コミットメッセージ規約の type 一覧、機密情報の対応手順、タグ付け詳細 → `reference.md`
- ブランチ作成・コミット・タグ・機密情報検出・PR 作成・force push の会話例 → `examples.md`
