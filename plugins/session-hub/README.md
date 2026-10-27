# session-hub

hub として使う Claude Code セッションから、`~/develop/<org>/<repo>/` ごとのバックグラウンド
セッション（`claude --bg`）へタスクを依頼し、その状態をペインで見るための mod。

hub は Obsidian リポジトリで起動した Claude で、この mod は Obsidian リポジトリの project
settings（`.claude/settings.json`）でだけ有効にする。Work ごとに hub が複数いてよい。

## 前提

- `tmux-project` と `tmux-claude-attach` が PATH にあること。どちらも ikmski/nix-config が
  `~/.local/bin` に置く。この mod が使うのは次の形:
  - `tmux-project -l`: リポジトリの候補
  - `tmux-project -d <path>`: tmux session を用意するだけで client を切り替えず、session 名を出す
  - `tmux-claude-attach -d -t <session> (-i <sessionId> | -n [LABEL])`: window を作るだけで
    切り替えず、window 名を出す
  - `tmux-claude-attach -t <session> [-i <sessionId>] -c <client>`: ユーザーの client を
    その window へ切り替える。hub はバックグラウンドで tmux の外にいるため、client は明示する
- 依頼文には「終わったら SendMessage で <hub> へ返す」が付く。`<hub>` は依頼した時点の hub の
  セッション名で、`claude --bg` で argv から起動したセッションは返信先を知らないため。
  hub の名前が取れないときは返信先を付けずに送り、そう伝える。

## できること

コマンドとモデル用ツールは `session-*` で揃え、同じ動作には同じ名前を付ける（ツールは
`mcp__session-hub__session-*`）。名前は 1 つずつ登録し、Claude Code に断られたもの
（バックグラウンドセッションには組み込みの `/stop` がある等）だけが欠けて、その旨を transcript に出す。

- `session-dispatch`（ツール・コマンド）: 1 リポジトリに複数のセッションを持てる。セッション名を
  指定しなければリポジトリで新しいセッションを起動し（名前は `<repo>`、2 つ目から
  `<repo>-<用途>` か `<repo>-2` …）、指定すればそのセッションへ送る（止まっていれば再開する）。
  リポジトリとセッションの対応は名前でなく cwd で取る（別 org に同名のリポジトリがありうるため）。
  ツールは `prepare: true` なら、そのあと `session-prepare` と同じように tmux へ出す。
  既存セッションへ送るコマンドは `/session-send`。
- `session-prepare`（ツール）: リポジトリの tmux session と、その中の Claude session の window を
  ユーザーの画面を切り替えずに用意し、どの session の何という window かを返す。セッション名を
  指定すればそのバックグラウンドセッションに attach し、省略すれば新しい Claude session を始める。
- `/session-switch`（コマンド）: 同じように用意したうえで、人の画面をそこへ切り替える。
- バックグラウンドセッションの状態を出すドックペイン（状態が変わるとトースト）。ペインはセッション
  開始時に開き、`/session-hub` で開閉を切り替える（ペインの閉じるマークや ctrl+x x でも閉じる）。
  ペインはリポジトリごとにまとめ、行を押すとそのセッションの tmux window へ画面を切り替える。
  hub 自身がバックグラウンドセッションでも、ペインには出さない。
- 一覧: ツール `session-list`（`claude agents` の JSON）、コマンド `/session-repos`（リポジトリごと）。
- 片付けと結果の確認: `session-stop`（会話は残り、依頼すると再開する）・`session-logs`
  （`claude logs` の末尾）はツールとコマンドの両方、`/session-rm`（worktree ごと消す）は人が打つ
  コマンドだけ。`rm` が push していないコミット等で断ったときは、その文言をそのまま返し、
  破棄のフラグは付けない。

登録しているコマンド・ツール・フックの一覧は `claude plugin validate plugins/session-hub` が出す。

## 確認

```bash
claude plugin validate plugins/session-hub
claude plugin test plugins/session-hub
```
