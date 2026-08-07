#!/bin/sh
# chrome-debug.sh — CDP (DevTools) ポート付きで Chrome を起動する
# chrome-devtools-mcp が --browserUrl http://127.0.0.1:<port> で接続するための入口。
# 使い方: chrome-debug.sh [port]   （デフォルト: 9222）
#
# - 既にポートが開いていれば何もせず正常終了する（冪等）
# - Chrome 136+ は通常プロファイルでのリモートデバッグを拒否するため、専用プロファイル
#   「chrome-debug-profile」を使う（通常プロファイルのログイン情報は引き継がれない）
# - WSL2 では Windows 側の Chrome を起動する。WSL ⇔ Windows の localhost 共有が必要な
#   ため、ミラーモード（networkingMode=mirrored）が前提

PORT="${1:-9222}"

cdp_up() {
    curl -s --max-time 2 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1
}

if cdp_up; then
    echo "Chrome CDP already listening on http://127.0.0.1:$PORT"
    exit 0
fi

if [ -d /mnt/c/Windows ]; then
    # --- WSL: Windows 側 Chrome を起動する ---
    if command -v wslinfo >/dev/null 2>&1; then
        mode=$(wslinfo --networking-mode 2>/dev/null)
        if [ "$mode" != "mirrored" ]; then
            echo "warning: WSL networking mode is '$mode' (localhost 共有には mirrored が必要)" >&2
        fi
    fi

    CHROME=''
    for c in \
        '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe' \
        '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe'; do
        if [ -f "$c" ]; then
            CHROME="$c"
            break
        fi
    done
    if [ -z "$CHROME" ]; then
        echo "error: Windows Chrome not found under /mnt/c/Program Files" >&2
        exit 1
    fi

    # 専用プロファイルは Windows 側 %LOCALAPPDATA%\chrome-debug-profile に置く
    # （cmd.exe は WSL パスを cwd にできないため /mnt/c に移ってから呼ぶ）
    win_local=$(cd /mnt/c && /mnt/c/Windows/System32/cmd.exe /c 'echo %LOCALAPPDATA%' 2>/dev/null | tr -d '\r\n')
    if [ -z "$win_local" ]; then
        echo "error: failed to resolve %LOCALAPPDATA% via cmd.exe" >&2
        exit 1
    fi
    PROFILE="${win_local}\\chrome-debug-profile"
else
    # --- Linux ネイティブ: PATH 上の Chrome / Chromium を起動する ---
    CHROME=''
    for c in google-chrome google-chrome-stable chromium chromium-browser; do
        if command -v "$c" >/dev/null 2>&1; then
            CHROME="$c"
            break
        fi
    done
    if [ -z "$CHROME" ]; then
        echo "error: no chrome/chromium found on PATH" >&2
        exit 1
    fi
    PROFILE="${XDG_CACHE_HOME:-$HOME/.cache}/chrome-debug-profile"
fi

"$CHROME" --remote-debugging-port="$PORT" --user-data-dir="$PROFILE" >/dev/null 2>&1 &

# ポートが開くまで待つ（最大 20 秒程度）
if curl -s --retry 20 --retry-delay 1 --retry-connrefused --max-time 30 \
    "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
    echo "Chrome CDP listening on http://127.0.0.1:$PORT"
else
    echo "error: Chrome did not open CDP port $PORT" >&2
    exit 1
fi
