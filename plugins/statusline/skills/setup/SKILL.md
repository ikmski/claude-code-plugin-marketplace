---
name: setup
description: Claude Code の status line をセットアップする。ユーザーが「statusline」「ステータスライン」「ステータスバー」の設定・変更・解除に言及したときに発火する。
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

Claude Code の status line をセットアップしてください。引数: $ARGUMENTS

## ガードレール

- `~/.claude/settings.json` を書き換える前に必ず Read し、既存のキーを一切失わないようにマージする
- statusline スクリプトは必ず `~/.claude/statusline.sh` へコピーしてから参照する。`${CLAUDE_PLUGIN_ROOT}` 配下のパスを settings.json に直接書いてはならない（プラグイン更新でパスが変わり status line が壊れるため）
- 既に `statusLine` 設定が存在する場合は、上書きする前に現在の設定内容を提示してユーザーに確認する

## 解除フロー

`$ARGUMENTS` に「解除」「削除」「remove」「clear」などが含まれる場合:

1. `~/.claude/settings.json` から `statusLine` フィールドのみを削除する（他のキーは保持）
2. `~/.claude/statusline.sh` を削除してよいかユーザーに確認し、承認されたら削除する
3. 完了を報告して終了する

## インストール・更新フロー

プラグイン更新後の再セットアップ（更新）もこのフローで行う。バンドル版スクリプトを再コピーすることで更新が反映される。

1. `${CLAUDE_PLUGIN_ROOT}/scripts/statusline.sh` を `~/.claude/statusline.sh` へコピーし、`chmod +x` で実行権限を付与する
   - 既存の `~/.claude/statusline.sh` がある場合は上書きする。ただし既存ファイルがバンドル版と異なる（＝過去のカスタマイズがある）場合は、上書き前に diff を提示して確認し、必要ならコピー後にカスタマイズを再適用する
2. `$ARGUMENTS` にカスタマイズ要望（表示項目の追加・削除、色付け、複数行化など）があれば、コピー後の `~/.claude/statusline.sh` を要望に合わせて編集する。利用できる stdin JSON フィールドは `${CLAUDE_PLUGIN_ROOT}/skills/setup/reference.md` を参照する
3. `~/.claude/settings.json` に以下をマージする:

    ```json
    "statusLine": {
        "type": "command",
        "command": "~/.claude/statusline.sh",
        "padding": 0
    }
    ```

4. モック JSON を stdin に流して動作確認し、出力をユーザーに提示する:

    ```bash
    echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"/home/user/project"},"cost":{"total_cost_usd":1.23,"total_duration_ms":4500000},"context_window":{"total_input_tokens":54000,"total_output_tokens":1200,"current_usage":{"input_tokens":2},"used_percentage":25},"rate_limits":{"five_hour":{"used_percentage":99}}}' | ~/.claude/statusline.sh
    ```

    実際の stdin JSON と同じく `context_window` 内のネスト（`current_usage`）と `rate_limits` 側の同名 `used_percentage` を含めてあり、抽出ロジックの退行を検出できる

5. 次の案内をして終了する:
   - status line は次の描画タイミングで反映される。表示されない場合はセッションを再起動する
   - `disableAllHooks: true` が設定されていると status line も無効化される
