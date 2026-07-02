#!/usr/bin/env bash
# Claude Code status line — 依存なしの pure bash（jq 不要）
# 表示: <dir> | <branch> | <model> | <ctx>% | <h>h <m>m | <tokens N.N>k | <cost N.NN>
# 各セグメントには Nerd Font アイコンのラベルが付く（下記 i_* 変数）
# データが取れないセグメントは（セパレータごと）表示しない

input=$(cat)

# "key":"value" 形式の文字列値を取り出す（最初の一致のみ）
json_str() {
    printf '%s' "$input" | grep -o "\"$1\":\"[^\"]*\"" | head -n 1 | cut -d'"' -f4
}

# "key":数値 形式の数値を取り出す（最初の一致のみ）
json_num() {
    printf '%s' "$input" | grep -o "\"$1\":[0-9.]*" | head -n 1 | cut -d':' -f2
}

cwd=$(json_str "current_dir")
model=$(json_str "display_name")
dur_ms=$(json_num "total_duration_ms")
cost=$(json_num "total_cost_usd")
in_tok=$(json_num "total_input_tokens")
out_tok=$(json_num "total_output_tokens")

# used_percentage は rate_limits 配下にも存在するため context_window ブロックに限定して取り出す
# ブロック内では current_usage 等のネストしたオブジェクトが used_percentage より先に現れるため、
# ネストを除去してからブロックの閉じ括弧までを切り出して読む
ctx=""
case $input in
*'"context_window":{'*)
    cw=${input#*\"context_window\":\{}
    cw=$(printf '%s' "$cw" | sed 's/{[^{}]*}//g')
    cw=${cw%%\}*}
    ctx=$(printf '%s' "$cw" | grep -o '"used_percentage":[0-9.]*' | head -n 1 | cut -d':' -f2)
    ;;
esac

# git リポジトリ内でのみブランチを表示（GIT_OPTIONAL_LOCKS=0 でロック取得をスキップ）
branch=""
if [ -n "$cwd" ]; then
    branch=$(GIT_OPTIONAL_LOCKS=0 git -C "$cwd" branch --show-current 2>/dev/null)
fi

# Nerd Font アイコン（リテラル埋め込みだと編集時に欠落しやすいためエスケープで定義）
i_git=$'\UE725'
i_model=$'\UF035B'
i_ctx=$'\UE706'
i_session=$'\UF13AB'
i_tokens=$'\UF02B'
i_cost=$'\UF0114'

# 配色（directory: blue bold, git branch: green bold, セパレータ: dim。アイコンは後続テキストと同色）
c_reset=$'\033[0m'
c_dir=$'\033[1;34m'
c_git=$'\033[1;32m'
c_dim=$'\033[2m'

out=""
add() {
    [ -n "$out" ] && out="${out} ${c_dim}|${c_reset} "
    out="${out}$1"
}

add "${c_dir}${cwd:-?}${c_reset}"
[ -n "$branch" ] && add "${c_git}${i_git} ${branch}${c_reset}"
[ -n "$model" ] && add "${i_model} ${model}"
[ -n "$ctx" ] && add "${i_ctx} ${ctx}%"

if [ -n "$dur_ms" ]; then
    total_min=$(( ${dur_ms%%.*} / 60000 ))
    add "${i_session} $(( total_min / 60 ))h $(( total_min % 60 ))m"
fi

if [ -n "$in_tok" ] || [ -n "$out_tok" ]; then
    total_tok=$(( ${in_tok:-0} + ${out_tok:-0} ))
    add "${i_tokens} $(( total_tok / 1000 )).$(( (total_tok % 1000) / 100 ))k"
fi

[ -n "$cost" ] && add "${i_cost} \$$(LC_NUMERIC=C printf '%.2f' "$cost")"

printf '%s\n' "$out"
