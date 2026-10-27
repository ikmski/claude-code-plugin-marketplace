# session-hub

Claude Code のセッションから、`~/develop/<org>/<repo>/` ごとのバックグラウンドセッション
（`claude --bg`）へタスクを依頼し、その一覧をペインで見てセッション間を移るための mod。

user scope で入れ、どのセッションでも使う。起動時はコマンドと遅延読み込みのツールを登録する
だけで、何も動かさない。`/session-hub` でペインを開いたセッションが hub になり、ペインが
開いている間だけ一覧を 15 秒おきに読み直す（1 回ごとに `claude agents` を起動する。見えていなくても
開いている限り続くので、使わないときはペインを閉じる）。

バックグラウンドのセッションは `prefix A`（`tmux-claude-attach`）から「新しいセッション」として
起動する。対話型の `claude` を `/bg` すると、セッション ID が変わるのに window の印
（`@claude_session`）は付かないので、そのセッションへ移るたびに window が 1 つ増える。

## 前提

- `tmux-project` と `tmux-claude-attach` が PATH にあること。どちらも ikmski/nix-config が
  `~/.local/bin` に置く。この mod が使うのは次の形:
  - `tmux-project -l`: リポジトリの候補
  - `tmux-project -d <path>`: tmux session を用意するだけで client を切り替えず、session 名を出す
  - `tmux-claude-attach -d -t <session> (-i <sessionId> | -n [LABEL])`: window を作るだけで
    切り替えず、window 名を出す
  - `tmux-claude-attach -t <session> [-i <sessionId>] -c <client>`: ユーザーの client を
    その window へ切り替える。hub はバックグラウンドで tmux の外にいるため、client は明示する
- 依頼文には「終わったら SendMessage で <依頼元> へ返す」が付く。`<依頼元>` は依頼した時点の
  セッション名で、`claude --bg` で argv から起動したセッションは返信先を知らないため。
  名前が取れないときは返信先を付けずに送り、そう伝える。

## できること

依頼・一覧・停止・ログはどのセッションからでも言葉で頼め、モデルがツール（`mcp__session-hub__session-*`）を使う。
人が打つコマンドは、ペインの開閉・画面の切り替え・削除の 3 つだけ。名前は 1 つずつ登録し、
Claude Code に断られたものだけが欠けて、その旨を transcript に出す。

- `session-dispatch`（ツール）: 1 リポジトリに複数のセッションを持てる。セッション名を
  指定しなければリポジトリで新しいセッションを起動し（名前は `<repo>`、2 つ目から
  `<repo>-<用途>` か `<repo>-2` …）、指定すればそのセッションへ送る（止まっていれば再開する）。
  リポジトリとセッションの対応は名前でなく cwd で取る（別 org に同名のリポジトリがありうるため）。
- `session-prepare`（ツール）: Claude session の window を、そのリポジトリの tmux session に
  ユーザーの画面を切り替えずに用意し、どの session の何という window かを返す。セッション名を
  指定すればそのバックグラウンドセッションに attach し、省略すればリポジトリで新しい Claude session を始める。
- `/session-switch <session|repo>`（コマンド）: 同じように用意したうえで、人の画面をそこへ切り替える。
  セッション名でなければリポジトリとして扱い、`tmux-claude-attach` が選ぶ（複数あれば選択の popup）。
- バックグラウンドセッションの状態を出すドックペイン。`/session-hub` で開閉を切り替える（ペインの
  閉じるマークや ctrl+x x でも閉じる）。ペインはリポジトリごとにまとめ、行を押すとそのセッションの
  tmux window へ画面を切り替える。ペインには自分も出る。
- 一覧: ツール `session-list`（`claude agents` の JSON）。
- 片付けと結果の確認: `session-stop`（会話は残り、依頼すると再開する）・`session-logs`
  （`claude logs` の末尾）はツール、`/session-rm`（worktree ごと消す）は人が打つコマンドだけ。
  `rm` が push していないコミット等で断ったときは、その文言をそのまま返し、破棄のフラグは付けない。

登録しているコマンド・ツール・フックの一覧は `claude plugin validate plugins/session-hub` が出す。

## 確認

```bash
claude plugin validate plugins/session-hub
claude plugin test plugins/session-hub
```
