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

## インストールフロー

1. `${CLAUDE_PLUGIN_ROOT}/scripts/statusline.sh` を `~/.claude/statusline.sh` へコピーし、`chmod +x` で実行権限を付与する
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
    echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"/home/user/project"},"context_window":{"used_percentage":25}}' | ~/.claude/statusline.sh
    ```

5. 次の案内をして終了する:
   - status line は次の描画タイミングで反映される。表示されない場合はセッションを再起動する
   - `disableAllHooks: true` が設定されていると status line も無効化される
