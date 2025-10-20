---
name: Git Helper
description: >
  Git の日常作業（ブランチ操作、コミット作成、メッセージ整形、チェリーピック、タグ付け、PullRequest 作成）
  を安全に支援する Skill。
  ユーザーが「git」「ブランチ」「コミット」「タグ」「PR」などを言及したときに使用する。
allowed-tools: Bash, Read, Grep, Glob
---

# Git Helper

この Skill は、**安全な Git オペレーション**を Claude に実行／案内させるための手順・スクリプトを提供します。
Claude は必要に応じて `reference.md` / `examples.md` を読み込みます。

## ガードレール（重要）

1. 破壊的操作（`reset --hard`, `push -f` 等）は、**実行前に必ず変更差分の確認**と**対話的な同意**を取る。
2. リモート書き込み前に `git status` / `git log --oneline --graph -n 10` を掲示し、ユーザー確認を求める。
3. 機密情報（APIキーなど）が差分に含まれる場合、**即座に中断**し修正案を提示。
4. 強制 push は禁止。`--force-with-lease` のみ許可。

---

## 主なタスク

### A. ブランチ操作
- 現在のブランチの確認や切り替え支援。
- 新しいブランチを作成する場合は、ユーザーが指定した名称をそのまま利用。
  例: `git checkout -b feature/login-ui`
- ブランチ削除や一覧の整理支援も可能（安全確認付き）。

### B. コミット作成
- 変更をサマリ表示し、コミットメッセージを生成。
- 既存コミットのメッセージ修正は `--no-edit` を優先し、必要時のみ `--amend` を提案。
- 機密情報検出時には中断し、`.gitignore` への追加を促す。

### C. レビュー補助
- コミット粒度の提案（大きすぎる変更の分割推奨）。
- `git diff --staged` で変更要約を提示し、LFS逸脱や権限変更を警告。

### D. PullRequest 作成
- 現在のブランチを push して PullRequest を作成。
- base branch との差分を確認し、PR の説明を生成。
- `gh pr create` コマンドを使用して GitHub に PR を作成。
- push 前に `git status` と `git log` で状態を確認。

### E. リリース前チェック
- タグ付け（`vX.Y.Z` 規約に従う）。
- `CHANGELOG.md` の更新提案。
- `--annotate` タグ作成と署名設定の確認。

---

## 使い方（例）

- 「新しいブランチ login-ui を作って」 → `git checkout -b login-ui`
- 「変更をコミットしたい」 → `git commit -m <Message>`
- 「PR を作成して」 → `gh pr create --title "..." --body "..."`
- 「リリースタグを作成して」 → `git tag -s v1.2.0 -m "release 1.2.0"`

詳しくは [reference.md](reference.md) と [examples.md](examples.md) を参照。

