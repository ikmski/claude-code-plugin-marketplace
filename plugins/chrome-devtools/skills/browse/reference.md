# chrome-devtools プラグイン リファレンス

## 構成

- MCP サーバ: `.mcp.json` の `chrome-devtools`
  （`npx -y chrome-devtools-mcp@latest --browserUrl http://127.0.0.1:9222`）。
  プラグインを有効化すると自動でロードされる。ブラウザへの実接続は最初のツール呼び出し時に行われる
- ランチャー: `scripts/chrome-debug.sh [port]`（デフォルトポート 9222、冪等）
  - WSL2: `/mnt/c/Program Files/**/chrome.exe` を `%LOCALAPPDATA%\chrome-debug-profile` 付きで起動
  - Linux ネイティブ: PATH 上の google-chrome / chromium を `~/.cache/chrome-debug-profile` 付きで起動
  - Chrome 136+ が通常プロファイルでのリモートデバッグを拒否するため専用プロファイルを使う

## 主な MCP ツール

現行の chrome-devtools-mcp の分類。バージョンによりツール名は変わり得るため、正確な一覧は `/mcp` で確認する。

- ページ管理: `list_pages` / `select_page` / `new_page` / `close_page` / `navigate_page` /
  `resize_page`
- 入力操作: `click` / `fill` / `fill_form` / `hover` / `drag` / `press_key` / `type_text` /
  `handle_dialog` / `upload_file` / `wait_for`
- 検査: `take_snapshot`（テキストスナップショット。要素の uid を得る） / `take_screenshot` /
  `evaluate_script`
- デバッグ: `list_console_messages` / `get_console_message` / `list_network_requests` /
  `get_network_request`
- パフォーマンス: `performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight` /
  `lighthouse_audit` / `take_heapsnapshot`
- エミュレーション: `emulate`（CPU / ネットワークスロットリング、viewport、UA、カラースキーム、位置情報）

## トラブルシュート

| 症状 | 原因と対処 |
| --- | --- |
| ツール呼び出しで接続エラー | CDP ポートが開いていない → `scripts/chrome-debug.sh` を実行する |
| 「No page selected」 | 新しいタブページのみでページ未選択 → `new_page`、または `list_pages` + `select_page` |
| WSL からポートに届かない | ミラーモードでない → `wslinfo --networking-mode` を確認し、Windows 側 `.wslconfig` に `networkingMode=mirrored` を設定して `wsl --shutdown` で再起動 |
| Chrome がポートを開かない | 専用プロファイルの Chrome が既に（ポート無しで）起動している → そのウィンドウを閉じて再実行 |
| MCP サーバ自体が起動しない | Node.js / npx が無い、または古い → Node 20.19+ / 22.12+ を用意する |

## 背景

公式の Claude in Chrome 連携（`claude --chrome`）はネイティブメッセージング + Unix ソケット方式の
ため WSL では動作しない（公式ドキュメントも WSL 非対応と明記）。このプラグインは、WSL2 ミラー
モードの localhost 共有を利用して CDP（TCP）経由で Windows 側 Chrome を操作する代替手段を提供する。
