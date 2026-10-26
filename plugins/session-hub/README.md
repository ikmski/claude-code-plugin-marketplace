# session-hub

hub として使う Claude Code セッションから、`~/develop/<org>/<repo>/` ごとのバックグラウンド
セッション（`claude --bg`）へタスクを依頼し、その状態をペインで見るための mod。
hub のディレクトリでだけ有効にする想定。

## 前提

- `tmux-project`（リポジトリの候補を `tmux-project -l` から得る）と `tmux-claude-attach`
  （`/open` で使う）が PATH にあること。どちらも ikmski/nix-config が `~/.local/bin` に置く。
- hub は `claude -n hub` で起動する。依頼文には「終わったら SendMessage で hub へ返す」が付く。
  `claude --bg` で argv から起動したセッションは返信先を知らないため。

## できること

- モデル用ツール `hub_dispatch`: 1 リポジトリに複数のセッションを持てる。セッション名を
  指定しなければリポジトリで新しいセッションを起動し（名前は `<repo>`、2 つ目から
  `<repo>-<用途>` か `<repo>-2` …）、指定すればそのセッションへ送る（止まっていれば再開する）。
  リポジトリとセッションの対応は名前でなく cwd で取る（別 org に同名のリポジトリがありうるため）。
- 人が使うスラッシュコマンド（依頼・一覧・tmux で開く）と、バックグラウンドセッションの
  状態を出すドックペイン（状態が変わるとトースト）。

登録しているコマンド・ツール・フックの一覧は `claude plugin validate plugins/session-hub` が出す。

## 確認

```bash
claude plugin validate plugins/session-hub
claude plugin test plugins/session-hub
```
