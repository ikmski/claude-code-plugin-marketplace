# statusline リファレンス

カスタマイズ要望に応えるときに参照する。一次情報: https://code.claude.com/docs/en/statusline

## statusLine 設定スキーマ（`~/.claude/settings.json`）

```json
{
    "statusLine": {
        "type": "command",
        "command": "~/.claude/statusline.sh",
        "padding": 0
    }
}
```

- `type` - `"command"` 固定（指定したシェルコマンドを実行する）
- `command` - スクリプトパスまたはインラインシェルコマンド
- `padding` - 任意。表示内容の左右に追加する空白文字数（デフォルト `0`）

プロジェクト設定（`.claude/settings.json`）にも書けるが、このスキルではユーザー設定を対象とする。

## stdin JSON の主要フィールド

Claude Code はスクリプトの stdin にセッション情報の JSON を渡す。主要フィールド:

| フィールド | 内容 |
| --- | --- |
| `session_id` / `session_name` | セッション ID / `--name` や `/rename` で付けた名前（未設定時は欠落） |
| `model.id` / `model.display_name` | モデル ID / 表示名（例: `"Opus"`） |
| `workspace.current_dir` | 現在の作業ディレクトリ（`cwd` と同値。こちらを推奨） |
| `workspace.project_dir` | Claude Code を起動したディレクトリ |
| `workspace.repo.host` / `.owner` / `.name` | origin リモートから解析したリポジトリ情報（git リポジトリ外では欠落） |
| `context_window.used_percentage` | コンテキスト使用率（%）。セッション初期は `null` になり得る |
| `context_window.context_window_size` | コンテキストウィンドウ上限（トークン数） |
| `context_window.total_input_tokens` / `.total_output_tokens` | 現在コンテキストに載っているトークン数 |
| `cost.total_cost_usd` | 推定セッションコスト（USD） |
| `cost.total_duration_ms` / `.total_api_duration_ms` | セッション経過時間 / API 待ち時間（ms） |
| `cost.total_lines_added` / `.total_lines_removed` | 変更行数 |
| `effort.level` | 推論エフォート（`low`〜`max`。非対応モデルでは欠落） |
| `rate_limits.five_hour.used_percentage` / `.seven_day.used_percentage` | レート制限消費率（0〜100）。Claude.ai サブスク（Pro/Max）のみ、かつセッション最初の API 応答後に現れる。`five_hour` / `seven_day` は独立して欠落し得る |
| `rate_limits.five_hour.resets_at` / `.seven_day.resets_at` | レート制限ウィンドウのリセット時刻（Unix epoch 秒） |
| `vim.mode` | vim モード有効時のモード名（無効時は欠落） |
| `pr.number` / `pr.url` / `pr.review_state` | 現在のブランチの open PR（なければ欠落） |
| `version` | Claude Code のバージョン |

注意: `used_percentage` は `rate_limits` 配下にも同名キーがあるため、正規表現でパースする場合は `context_window` ブロックに限定すること。さらに `context_window` 内では `current_usage` などのネストしたオブジェクトが `used_percentage` より先に現れるため、`{[^{}]*` のような「最初のネストまで」の抽出では取得できない。ネストを除去してからブロックを切り出すこと（バンドルスクリプトの実装参照）。

逆に `rate_limits` 側は `"five_hour":{...}` / `"seven_day":{...}` がネストを含まないため、`grep -o '"five_hour":{[^}]*}'` で安全に切り出せる（キー名も `rate_limits` 配下でしか現れない）。

### レート制限のカスタマイズ

- 消費率は小数を含み得る（例: `23.5`）。表示は `printf '%.0f'`、しきい値比較は `${v%%.*}` で整数化してから行う（`[ 23.5 -ge 80 ]` は `integer expression expected` エラーになる）
- `resets_at` からの残り時間は `date` をフォークせず bash 組み込みの `$EPOCHSECONDS`（bash 5.0+）を使う。バンドルスクリプトの `until_reset()` は `${EPOCHSECONDS:-$(date +%s)}` で bash 5 未満のみ `date` にフォールバックし、`3d5h` / `2h15m` / `45m` の書式で返す（既に過ぎていれば空文字＝括弧を出さない）
- バンドルスクリプトのデフォルトでは 5h / 7d を**別セグメント**として context の直後に置き、80% 以上のウィンドウだけ赤くする。1 セグメントにまとめたい場合は `rl_add` の 2 回の呼び出しをまとめて `add` する形に変える

### 欠落・null の扱い

- 「欠落し得る」フィールドは JSON にキー自体が現れない
- `context_window.used_percentage` / `.remaining_percentage` はセッション初期に `null` になり得る
- スクリプトでは必ずフォールバック（`--` など）を用意する

## 出力仕様

- **複数行**: `echo` / `print` を複数回呼ぶと複数行で表示される
- **色**: ANSI エスケープコード（例: `\033[32m` = 緑）が使える
- **リンク**: OSC 8 エスケープシーケンスでクリック可能なリンクにできる（対応ターミナルのみ）
- **端末幅**: スクリプト内から `tput cols` は使えない。環境変数 `COLUMNS` / `LINES` を読む（v2.1.153 以降）

## パフォーマンス注意

- スクリプトはセッション中頻繁に実行される。`git status` などの重い処理は避けるかキャッシュする
- ブランチ名の取得は `git -C "$cwd" branch --show-current` が軽量
- 出力は短く保つ。長すぎると切り詰め・折り返しが起こる

## テスト方法

実際の stdin JSON と同じく `context_window` 内のネスト（`current_usage`）と `rate_limits` 側の同名 `used_percentage` を含むモックでテストする:

```bash
# (a) 5h のみ・警告色（80% 以上）・resets_at なし・context_window のネスト混在
echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"/home/user/project"},"cost":{"total_cost_usd":1.23,"total_duration_ms":4500000},"context_window":{"total_input_tokens":54000,"total_output_tokens":1200,"current_usage":{"input_tokens":2},"used_percentage":25},"rate_limits":{"five_hour":{"used_percentage":99}},"session_id":"test"}' | ~/.claude/statusline.sh
# 期待: /home/user/project | 󰍛 Opus |  25% |  5h 99% | 󱎫 1h 15m |  55.2k | 󰄔 $1.23（5h セグメントは赤・括弧なし）

# (b) 両ウィンドウ + resets_at + 小数値（四捨五入・残り時間の書式）
now=$(date +%s)
printf '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"/home/user/project"},"context_window":{"used_percentage":25},"rate_limits":{"five_hour":{"used_percentage":23.5,"resets_at":%d},"seven_day":{"used_percentage":41.2,"resets_at":%d}}}' $((now+8100)) $((now+280000)) | ~/.claude/statusline.sh
# 期待: ... |  25% |  5h 24% (2h15m) |  7d 41% (3d5h)

# (c) resets_at が過去 → 括弧を出さない
printf '{"workspace":{"current_dir":"/x"},"rate_limits":{"five_hour":{"used_percentage":10,"resets_at":%d}}}' $(( $(date +%s) - 100 )) | ~/.claude/statusline.sh
```

`rate_limits` はモックでしか検証できない点に注意する。実際に値が来るかどうかはプラン依存（Pro/Max のみ、かつ最初の API 応答後）なので、モックが通っても実環境で表示されるとは限らない。実データを確認したい場合は `~/.claude/statusline.sh` の先頭に一時的に `printf '%s' "$input" > /tmp/statusline-stdin.json` を挟み、1 回描画させてから中身を確認して行を戻す。

## トラブルシューティング

- スクリプトに実行権限があるか確認する（`chmod +x`）
- 出力は stderr ではなく stdout に出す
- `disableAllHooks: true` だと status line も無効化される
- `claude --debug` で初回実行の exit code と stderr を確認できる
