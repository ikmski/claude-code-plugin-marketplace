# tmux-agents

agent view（`claude agents`）のバックグラウンドセッション（`claude --bg`）を、リポジトリごとの
tmux session / window で扱うための mod。ペインで一覧を見て、行からそのセッションの window へ移る。
モデルは一覧・window の用意・停止ができる。

user scope で入れ、どのセッションでも使う。起動時はコマンドと遅延読み込みのツールを登録する
だけで、何も動かさない。`/tmux-agents` でペインを開くと、そのセッションがペインを
開いている間だけ一覧を 15 秒おきに読み直す（1 回ごとに `claude agents` を起動する。見えていなくても
開いている限り続くので、使わないときはペインを閉じる）。

session-hub から入れ替えるときは、`session-hub` をアンインストールしてから `tmux-agents` を入れる。

バックグラウンドのセッションは `prefix A`（`tmux-claude-attach`）から「新しいセッション」として
起動する。対話型の `claude` を `/bg` すると、セッション ID が変わるのに window の印
（`@claude_session`）は付かないので、そのセッションへ移るたびに window が 1 つ増える。

## 前提

- `claude-session-name`・`tmux-project`・`tmux-claude-attach` が PATH にあること。どれも ikmski/nix-config が
  `~/.local/bin` に置く。この mod が使うのは次の形:
  - `claude-session-name [LABEL]`: 新しいセッションの名前を出す。名前の規則はここが持ち、使われている名前は
    `claude agents --json --all` の一覧を stdin で渡す。無ければ新しいセッションは起動しない（代わりの名前でも
    起動しない）。既にあるセッションの window の用意・切り替え・停止は動く
  - `tmux-project -l`: リポジトリの候補
  - `tmux-project -d <path>`: tmux session を用意するだけで client を切り替えず、session 名を出す
  - `tmux-claude-attach -d -t <session> -i <sessionId>`: window を作るだけで
    切り替えず、window 名を出す
  - `tmux-claude-attach -t <session> [-i <sessionId>] -c <client>`: ユーザーの client を
    その window へ切り替える。この mod を動かすセッションは tmux の外にいることもあるため、client は明示する

## できること

一覧・window の用意・停止はどのセッションからでも言葉で頼め、モデルがツール（`mcp__tmux-agents__session-*`）を使う。
人が打つコマンドは、ペインの開閉・画面の切り替え・削除の 3 つだけ。名前は 1 つずつ登録し、
Claude Code に断られたものだけが欠けて、その旨を transcript に出す。

- 1 リポジトリに複数のセッションを持てる。新しいセッションの名前は用途（`review`、`aws-s3` など。モデルが付ける）から
  `claude-session-name` が付ける。`prefix A` の「新しいセッション」も同じものを使うので、同じ名前の付き方になる。
  リポジトリ名は含めず、リポジトリはペインの見出しに出る。
- 名前は tmux の window 名にもなる。あとで名前が変わっても、attach したときとペインが一覧を読み直すたびに
  window 名が追従する。
- `session-prepare`（ツール）: Claude session の window を、そのリポジトリの tmux session に
  ユーザーの画面を切り替えずに用意し、どの session の何という window かを返す。セッション名を
  指定すればそのバックグラウンドセッションに attach し、省略すればリポジトリで新しいセッションを
  上の規則で起動してから attach する。
- `/tmux-agents-switch <session|repo>`（コマンド）: 同じように用意したうえで、人の画面をそこへ切り替える。
  セッション名でなければリポジトリとして扱い、`tmux-claude-attach` が選ぶ（複数あれば選択の popup）。
- バックグラウンドセッションの状態を出すドックペイン「Agents」。`/tmux-agents` で開閉を切り替える（ペインの
  閉じるマークや ctrl+x x でも閉じる）。ペインはリポジトリごとにまとめ（Claude Code の worktree
  `<repo>/.claude/worktrees/<name>` で動くセッションはそのリポジトリの下に出す）、行を押すとそのセッションの
  tmux window へ画面を切り替える。ペインには自分も出る。
- 一覧: ツール `session-list`（`claude agents` の JSON）。
- 片付け: `session-stop`（会話は残り、attach すると再開する）はツール、`/tmux-agents-rm`（worktree ごと消す）は
  人が打つコマンドだけ。
  `rm` が push していないコミット等で断ったときは、その文言をそのまま返し、破棄のフラグは付けない。

登録しているコマンド・ツール・フックの一覧は `claude plugin validate plugins/tmux-agents` が出す。

## 確認

```bash
claude plugin validate plugins/tmux-agents
claude plugin test plugins/tmux-agents
```
