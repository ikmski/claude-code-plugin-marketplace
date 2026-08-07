---
name: browse
description: chrome-devtools-mcp で Chrome を操作してページ閲覧・スクリーンショット・フロントエンドのデバッグを行う。ユーザーが「ブラウザで開いて/確認して」「Chrome で〜」「スクリーンショットを撮って」「Web UI を見て」「コンソール/ネットワークを調べて」等に言及したときに発火する。
---

chrome-devtools-mcp（MCP サーバ `chrome-devtools`）で Chrome を操作してください。引数: $ARGUMENTS

## 前提

- この MCP は Chrome を自分では起動せず、`http://127.0.0.1:9222` の CDP エンドポイントに接続する
- WSL2 の場合は Windows 側 Chrome に接続するため、WSL のミラーモードが必要
  （`wslinfo --networking-mode` が `mirrored` を返すこと）

## 手順

1. **CDP エンドポイントを確保する。** まず次を実行する（冪等。既にポートが開いていれば何もしない）:

    ```bash
    ${CLAUDE_PLUGIN_ROOT}/scripts/chrome-debug.sh
    ```

2. **最初のページ操作は `new_page` で行う。** 起動直後のデバッグ用 Chrome は新しいタブページしか
   持たず chrome-devtools-mcp の対象にならないため、いきなり `navigate_page` を呼ぶと
   「No page selected」エラーになる。`new_page` で目的のページを開くか、既存タブがあるなら
   `list_pages` → `select_page` で選択する。
3. 以降は目的に応じて MCP ツールを使う。要素操作（`click` / `fill` など）は `take_snapshot` が
   返す uid を引数に取るため、スクリーンショットより先にスナップショットを取るのが基本フロー。
   ツール一覧とトラブルシュートは `${CLAUDE_PLUGIN_ROOT}/skills/browse/reference.md` を参照する。

## ガードレール

- デバッグ用 Chrome は専用プロファイル（chrome-debug-profile）で動く。ユーザーの通常プロファイルの
  ログイン情報は無いため、ログインが必要なサイトはユーザーに手動ログインを依頼する
  （ログイン状態は専用プロファイルに永続化され、次回以降は不要になる）
- ユーザーの通常の Chrome ウィンドウ・プロファイルには触れない
- 認証情報・個人情報が表示されているページのスクリーンショットを外部（Slack・Artifact 等）へ
  共有する前に、内容をユーザーに確認する
