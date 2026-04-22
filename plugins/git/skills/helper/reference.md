# Git Helper Reference

Git Helper Skill および `/git:*` コマンドが共通で参照する規約・チェックリスト。
ここを単一情報源とし、他ファイルはこの内容を繰り返さずに参照する。

## 1. ブランチ運用ポリシー

プロジェクトのブランチ運用ポリシーがある場合はそれを優先する。
ポリシーが不明な場合の汎用的な参考例を以下に示す。

| 種別 | 命名例 | 目的 |
|------|--------|------|
| main | `main` | 本番リリース用の安定ブランチ |
| develop | `develop` | 日常開発統合ブランチ |
| feature | `feature/login-ui` | 新機能・改修ブランチ |
| hotfix | `hotfix/urgent-fix` | 緊急修正ブランチ |

ブランチ名はユーザーが指定する。命名に迷う場合は候補を提示する。

## 2. コミットメッセージ規約（Conventional Commits）

```
<type>(<scope>): <summary>
```

| type | 用途 |
|------|------|
| feat | 機能追加 |
| fix | 不具合修正 |
| docs | ドキュメントのみの変更 |
| style | コードの意味に影響しない変更（整形、空白等） |
| refactor | 機能追加でもバグ修正でもないコード変更 |
| perf | パフォーマンス改善 |
| test | テスト追加・修正 |
| build | ビルドシステム・外部依存の変更 |
| ci | CI 設定・スクリプトの変更 |
| chore | その他（ソース／テストを変更しない作業） |
| revert | 以前のコミットの取り消し |

`scope` は省略可。`summary` は命令形・現在時制で簡潔に書く。

## 3. 機密情報と安全対策

### 3.1 コミット前に検出すべきファイル／内容

以下が差分に含まれる場合は**コミットを中断**し、対応手順（§3.2）を提示する。

- 環境変数・設定ファイル: `.env`, `.env.*`, `.envrc`
- 鍵・証明書: `.pem`, `.key`, `.p12`, `.pfx`, `id_rsa`, `id_ed25519`
- 認証情報: `secrets/`, `credentials/`, `config/` 配下の認証設定
- CI シークレット: `.npmrc` の `_authToken`, `.pypirc`, `.docker/config.json` の `auth`
- ソース中のハードコードされた値: API キー、アクセストークン、パスワード、DB 接続文字列

### 3.2 検出時の対応手順

1. 該当ファイル／行をユーザーに示し、コミット中断を伝える。
2. `.gitignore` に該当パスを追加するよう提案する。
3. Git の状態別に除去コマンドを提示する：
   - ワーキングツリーのみ：`.gitignore` 追加で完了。
   - staged 済み：`git restore --staged <file>` → `.gitignore` 追加。
   - commit 済み（未 push）：`git rm --cached <file>` → `.gitignore` 追加 → amend か新規コミット。
   - push 済み：履歴からの除去（`git filter-repo` または BFG）を案内し、**漏洩したシークレットは無効化・ローテーションが必要**であることを明示する。

### 3.3 Git 操作のガードレール

- `git status` / `git diff --staged` を確認してからコミット・push する。
- 強制 push は `git push --force-with-lease` を使う。`push -f` / `push --force` は使わない。
- `git reset --hard`, `git clean -fd`, `git checkout --` のような作業消失を伴う操作は、ユーザーの明示的な同意を得てから実行する。
- pre-commit フックの失敗は原因を修正してから再コミットする。`--no-verify` は使わない。

## 4. タグ付け・リリース

- タグ命名: `v<MAJOR>.<MINOR>.<PATCH>`（SemVer）。
- 署名付きタグを推奨：
  ```bash
  git tag -s v1.4.2 -m "release 1.4.2"
  git push origin v1.4.2
  ```
  署名鍵（GPG/SSH）が未設定の環境では `-s` が失敗する。その場合はユーザーに設定の有無を確認し、未設定なら `-a`（注釈付きタグ）に切り替える。
- リリース前に `CHANGELOG.md` の更新と差分確認を行う。

## 5. 注意事項

- 本ファイルに書かれたコマンドはあくまで定型。実行前に現在のリポジトリ状態に合っているか `git status` で確認する。
- 削除・マージ操作の後は `git status` と `git log --oneline -n 5` で結果を確認する。
