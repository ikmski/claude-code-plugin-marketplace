#!/usr/bin/env bash
# Claude Code status line — 依存なしの pure bash（jq 不要）
# 表示: <dir> | <branch> | <model> | <ctx>% | 5h <N>% (<reset>) | 7d <N>% (<reset>) | <h>h <m>m | <tokens N.N>k | <cost N.NN>
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

# レート制限（Claude.ai サブスク Pro/Max のみ。five_hour / seven_day は独立して欠落し得る）
# 各ウィンドウのオブジェクトはネストを含まないため、閉じ括弧までを素直に切り出せる
blk_5h=""
blk_7d=""
case $input in
*'"five_hour":{'*) blk_5h=${input#*\"five_hour\":\{}; blk_5h=${blk_5h%%\}*} ;;
esac
case $input in
*'"seven_day":{'*) blk_7d=${input#*\"seven_day\":\{}; blk_7d=${blk_7d%%\}*} ;;
esac

# $1 のブロックから "$2":数値 を読んで $blk_out に入れる（キー欠落・null は空文字）
# status line は頻繁に実行されるため、ここではフォークせずパラメータ展開だけで処理する
blk_out=""
blk_num() {
    blk_out=""
    case $1 in
    *"\"$2\":"*)
        local v=${1#*\"$2\":}
        v=${v%%,*}
        case $v in '' | *[!0-9.]*) return 0 ;; esac
        blk_out=$v
        ;;
    esac
}

blk_num "$blk_5h" "used_percentage"; rl_5h=$blk_out
blk_num "$blk_5h" "resets_at"; rl_5h_at=$blk_out
blk_num "$blk_7d" "used_percentage"; rl_7d=$blk_out
blk_num "$blk_7d" "resets_at"; rl_7d_at=$blk_out

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
i_rate=$'\UF0E4'

# 配色（directory: blue bold, git branch: green bold, セパレータ: dim。アイコンは後続テキストと同色）
c_reset=$'\033[0m'
c_dir=$'\033[1;34m'
c_git=$'\033[1;32m'
c_dim=$'\033[2m'
c_warn=$'\033[1;31m'

out=""
add() {
    [ -n "$out" ] && out="${out} ${c_dim}|${c_reset} "
    out="${out}$1"
}

# epoch 秒までの残り時間を "3d5h" / "2h15m" / "45m" にする（既に過ぎていれば空）
# EPOCHSECONDS は bash 5.0+。無い環境でのみ date にフォールバックする
until_reset() {
    local left=$(( $1 - ${EPOCHSECONDS:-$(date +%s)} ))
    if [ "$left" -ge 86400 ]; then
        printf '%dd%dh' $(( left / 86400 )) $(( left % 86400 / 3600 ))
    elif [ "$left" -ge 3600 ]; then
        printf '%dh%dm' $(( left / 3600 )) $(( left % 3600 / 60 ))
    elif [ "$left" -gt 0 ]; then
        printf '%dm' $(( left / 60 ))
    fi
}

# レート制限のセグメント（$1=ラベル $2=消費率 $3=リセット時刻）。80% 以上は警告色
# used_percentage は小数を含み得るため、しきい値比較の前に小数部を落とす
rl_add() {
    [ -n "$2" ] || return 0
    local int=${2%%.*} c="" left=""
    [ "${int:-0}" -ge 80 ] && c=$c_warn
    [ -n "$3" ] && left=$(until_reset "$3")
    add "${c}${i_rate} $1 $(LC_NUMERIC=C printf '%.0f' "$2")%${left:+ ($left)}${c:+$c_reset}"
}

add "${c_dir}${cwd:-?}${c_reset}"
[ -n "$branch" ] && add "${c_git}${i_git} ${branch}${c_reset}"
[ -n "$model" ] && add "${i_model} ${model}"
[ -n "$ctx" ] && add "${i_ctx} ${ctx}%"

rl_add "5h" "$rl_5h" "$rl_5h_at"
rl_add "7d" "$rl_7d" "$rl_7d_at"

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
