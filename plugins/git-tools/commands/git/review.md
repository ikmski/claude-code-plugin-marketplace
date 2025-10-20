---
name: git:review
description: Review changes before commit
---

git worktree 内の変更を詳しくレビューしてください。

以下の観点でチェックを行ってください：

1. **デバッグコードの残存確認**
   - console.log、print、debug などのデバッグ文
   - デバッグ用の一時的なコード

2. **コメントの確認**
   - TODO、FIXME、HACK などのコメント
   - コメントアウトされたコード
   - 不要なコメント

3. **コード品質**
   - 不要な空白行や trailing spaces
   - フォーマットの問題
   - 未使用のインポートや変数

4. **セキュリティチェック**
   - API キー、トークン、パスワードなどの機密情報
   - .env ファイルや credentials の変更

5. **変更内容の整合性**
   - 変更の目的と実際の変更内容が一致しているか
   - 意図しない変更が含まれていないか

レビュー結果をわかりやすくまとめ、問題があれば指摘し、問題がなければコミットしても良い旨を伝えてください。

## ガイドライン

レビュー時は、`plugins/git-tools/skills/git-helper/reference.md` の安全対策・ガードレールに従って、特に以下を重点的にチェックしてください：
- 機密情報（`.env`, `.pem`, `.key`, `secrets/`, `config/` など）
- `.gitignore` の適切性
