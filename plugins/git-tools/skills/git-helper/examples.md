# Git Helper Examples

Git Helper Skill の典型的な会話フロー。
各例は「ユーザー発話 → Claude の提案・確認 → ユーザー承認 → Claude の実行と結果提示」の流れで示す。
読み取り系コマンド（`git status`, `git log`, `git branch --show-current` 等）は承認不要で実行してから結果を提示する。

---

## 例 1: 新しいブランチを作成

**User**
> 新しく `login-ui` ブランチを作ってください。

**Claude**
> 現在のブランチと作業状態を確認します。
> ```bash
> git status
> git branch --show-current
> ```
> （結果を提示）
>
> 以下のコマンドで `login-ui` ブランチを作成・切替します。実行してよいですか？
> ```bash
> git checkout -b login-ui
> ```

**User**
> はい。

**Claude**
> （実行後）`git branch --show-current` → `login-ui`。切替完了しました。

---

## 例 2: コミット作成

**User**
> 変更をコミットしてください。

**Claude**
> `git status` / `git diff --staged` で変更内容を確認します。
>
> - `LoginForm.vue`: バリデーション処理を追加
> - `App.vue`: ローディング表示を調整
>
> コミットメッセージの案：
> ```
> feat(ui): add validation to login form and adjust loading behavior
> ```
> このメッセージでコミットしてよいですか？

**User**
> お願いします。

**Claude**
> （`git commit` 実行後、`git log -1 --oneline` の結果を提示）

---

## 例 3: ブランチの確認

**User**
> 今どのブランチ？

**Claude**
> （`git branch --show-current` を実行）
> 現在のブランチは `feature/login-ui` です。他のブランチも一覧しますか？

---

## 例 4: タグ作成とリリース

**User**
> バージョン 1.2.0 のタグを作ってください。

**Claude**
> 現在の HEAD と最新コミットを確認します。
> ```bash
> git log -1 --oneline
> ```
> （結果を提示）
>
> 署名付きタグで作成します（GPG/SSH 署名鍵の設定が必要）。設定済みなら以下を実行してよいですか？
> ```bash
> git tag -s v1.2.0 -m "release 1.2.0"
> ```

**User**
> 署名鍵は未設定です。

**Claude**
> では注釈付きタグで作成します。
> ```bash
> git tag -a v1.2.0 -m "release 1.2.0"
> ```
> 実行してよいですか？ また、タグの push (`git push origin v1.2.0`) と `CHANGELOG.md` の更新は別ステップで確認します。

---

## 例 5: 機密情報の検出

**User**
> この設定ファイルをコミットしてください。

**Claude**
> `git diff --staged` を確認したところ、`config/api_key.txt` に API キーと思われる文字列が含まれています。**コミットを中断します**。
>
> 対応手順（`reference.md` §3.2 準拠）：
>
> 1. `.gitignore` に `config/api_key.txt` を追加。
> 2. 現在 staged 済みなので、ステージから外します：
>    ```bash
>    git restore --staged config/api_key.txt
>    ```
>    既に過去コミットに含まれている場合は `git rm --cached config/api_key.txt` で追跡から外してください。push 済みの場合は履歴書き換え（`git filter-repo` / BFG）も必要です。
> 3. **漏洩した可能性のある API キーは無効化・ローテーションしてください**。リポジトリが public / 組織外に共有されている場合は特に。
>
> どの状態にあるか（staged のみ / コミット済み / push 済み）教えてください。

---

## 例 6: PullRequest 作成

**User**
> このブランチで PR を作ってください。

**Claude**
> 現在のブランチと base branch との差分を確認します。
> ```bash
> git status
> git log --oneline --graph main..HEAD
> ```
> （結果を提示。機密情報・想定外の変更がないか確認）
>
> 以下の内容で PR を作成してよいですか？
>
> - Title: `feat(ui): add login form validation`
> - Body:
>   - 概要: ログインフォームに入力バリデーションを追加
>   - 変更点（base 差分から抽出した主要コミット）
>   - テスト手順
>
> 実行コマンド：
> ```bash
> git push -u origin feature/login-ui
> gh pr create --base main --title "..." --body "..."
> ```

---

## 例 7: force push が必要と言われたとき

**User**
> rebase したので force push してください。

**Claude**
> `git push -f` は使わず、`--force-with-lease` を使います。リモートに他者の追加コミットがある場合は中断されます。
>
> 現在のブランチと対象リモートを確認します。
> ```bash
> git branch --show-current
> git log --oneline origin/feature/login-ui..HEAD
> git log --oneline HEAD..origin/feature/login-ui
> ```
> （上書きされるリモート側コミットが無いことを確認して提示）
>
> 以下を実行してよいですか？
> ```bash
> git push --force-with-lease origin feature/login-ui
> ```
> 他者が同じブランチで作業している場合は、事前に連絡を取ることを推奨します。
