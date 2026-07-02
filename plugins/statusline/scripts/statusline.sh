#!/usr/bin/env bash
# Claude Code status line — 依存なしの pure bash（jq 不要）
# stdin のセッション JSON から「📁 dir |  branch | model | ctx N%」を 1 行で表示する

input=$(cat)

# "key":"value" 形式の文字列値を取り出す（最初の一致のみ）
json_str() {
    printf '%s' "$input" | grep -o "\"$1\":\"[^\"]*\"" | head -n 1 | cut -d'"' -f4
}

cwd=$(json_str "current_dir")
model=$(json_str "display_name")

# used_percentage は rate_limits 配下にも存在するため context_window ブロックに限定して取り出す
# （null や欠落の場合は空になり、後段の -- フォールバックが効く）
ctx=$(printf '%s' "$input" | grep -o '"context_window":{[^{}]*' | grep -o '"used_percentage":[0-9.]*' | head -n 1 | cut -d':' -f2)

dir_name="${cwd##*/}"
line="📁 ${dir_name:---}"

# git リポジトリ内でのみブランチを表示（git status は遅いため使わない）
if [ -n "$cwd" ]; then
    branch=$(git -C "$cwd" branch --show-current 2>/dev/null)
    [ -n "$branch" ] && line="$line |  $branch"
fi

line="$line | ${model:---} | ctx ${ctx:---}%"

printf '%s\n' "$line"
