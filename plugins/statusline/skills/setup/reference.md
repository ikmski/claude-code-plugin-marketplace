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
| `rate_limits.five_hour.used_percentage` / `.seven_day.used_percentage` | レート制限消費率（Pro/Max のみ。欠落し得る） |
| `vim.mode` | vim モード有効時のモード名（無効時は欠落） |
| `pr.number` / `pr.url` / `pr.review_state` | 現在のブランチの open PR（なければ欠落） |
| `version` | Claude Code のバージョン |

注意: `used_percentage` は `rate_limits` 配下にも同名キーがあるため、正規表現でパースする場合は `context_window` ブロックに限定すること（バンドルスクリプトの実装参照）。

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

```bash
echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"/home/user/project"},"context_window":{"used_percentage":25},"session_id":"test"}' | ~/.claude/statusline.sh
```

## トラブルシューティング

- スクリプトに実行権限があるか確認する（`chmod +x`）
- 出力は stderr ではなく stdout に出す
- `disableAllHooks: true` だと status line も無効化される
- `claude --debug` で初回実行の exit code と stderr を確認できる
