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

- モデル用ツール `hub_dispatch`: 1 リポジトリに複数のセッションを持てる。セッション名を
  指定しなければリポジトリで新しいセッションを起動し（名前は `<repo>`、2 つ目から
  `<repo>-<用途>` か `<repo>-2` …）、指定すればそのセッションへ送る（止まっていれば再開する）。
  リポジトリとセッションの対応は名前でなく cwd で取る（別 org に同名のリポジトリがありうるため）。
  `open: true` なら、そのあと `hub_open` と同じように tmux へ出す。
- モデル用ツール `hub_open`: リポジトリの tmux session と、その中の Claude session の window を
  ユーザーの画面を切り替えずに用意し、どの session の何という window かを返す。セッション名を
  指定すればそのバックグラウンドセッションに attach し、省略すれば新しい Claude session を始める。
- 人が使うスラッシュコマンド（依頼・一覧・tmux で開く）と、バックグラウンドセッションの
  状態を出すドックペイン（状態が変わるとトースト）。ペインはセッション開始時に開き、`/hub` で
  開閉を切り替える（ペインの閉じるマークや ctrl+x x でも閉じる）。ペインはリポジトリごとにまとめ、行を押すと
  そのセッションの tmux window へ画面を切り替える。`/open` は人が使うので画面を切り替える。
  hub 自身がバックグラウンドセッションでも、ペインには出さない。
- 片付けと結果の確認: `/stop`（会話は残り、依頼すると再開する）・`/rm`（worktree ごと消す）・
  `/logs`（`claude logs` の末尾）。モデル用は `hub_stop` と `hub_logs` だけで、`rm` は人が打つ。
  `rm` が push していないコミット等で断ったときは、その文言をそのまま返し、破棄のフラグは付けない。

登録しているコマンド・ツール・フックの一覧は `claude plugin validate plugins/session-hub` が出す。

## 確認

```bash
claude plugin validate plugins/session-hub
claude plugin test plugins/session-hub
```
