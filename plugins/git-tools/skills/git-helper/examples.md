# Git Helper Skill Examples

Claude が Git Helper Skill をどのように使うかの会話例です。

---

## 例 1: 新しいブランチを作成

**User**
> 新しく `login-ui` ブランチを作ってください。

**Claude**
> 以下のコマンドを提案します。
> ```bash
> git checkout -b login-ui
> ```
> 作業ブランチを `login-ui` に切り替えました。

---

## 例 2: コミット作成

**User**
> 変更をコミットしてください。

**Claude**
> 変更内容を確認しました：
> - `LoginForm.vue`: バリデーション処理を追加
> - `App.vue`: ローディング表示を調整
>
> コミットメッセージ：
> ```
> feat(ui): add validation to login form and adjust loading behavior
> ```
> この内容でコミットしますか？

---

## 例 3: ブランチの確認

**User**
> 今どのブランチ？

**Claude**
> 現在のブランチは:
> ```bash
> git branch --show-current
> ```
> → `feature/login-ui`
> 他のブランチを一覧しますか？

---

## 例 4: タグ作成とリリース

**User**
> バージョン 1.2.0 のタグを作ってください。

**Claude**
> 以下を実行します：
> ```bash
> git tag -s v1.2.0 -m "release 1.2.0"
> git push origin v1.2.0
> ```
> `CHANGELOG.md` の更新を行いますか？

---

## 例 5: 機密情報検出

**User**
> この設定ファイルをコミットしてください。

**Claude**
> 差分を確認しました。`config/api_key.txt` に機密情報が含まれています。
> `.gitignore` に追加し、ファイルを除外することを推奨します。

