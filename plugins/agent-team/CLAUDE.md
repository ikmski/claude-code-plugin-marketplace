# agent-team プラグイン開発ガイドライン
## プロジェクト概要
このプラグインは、Claude Code の **Agent Teams API**（TeamCreate / SendMessage）を活用し、課題の性質に合わせて動的に最適なチーム（最大10名：Team Lead 1名＋メンバー最大9名）を編成する「チーム・オブ・チームズ」型のマルチエージェント協調プラグインです。

## Team Lead の役割

**Team Lead**: チーム全体を統括する。TeamCreate・ワークスペース作成・課題分析・チーム編成案作成（MBR プロンプト含む）・全チームメイトの起動（Task）・タスク管理・Chief of Staff を通じたチーム運営・戦略的判断（スコープ変更・重大リスク）・シャットダウン（shutdown_request）・TeamDelete・最終報告のレビュー・提出を担う。メンバーとの運用的連携・成果物集約・worktree マージ実行・最終報告ドラフト作成は Chief of Staff に委任。CoS は運用判断を自律的に行い、Team Lead には要約報告のみ行う。

**Team Lead がやらないこと**: 深い技術調査、実装作業、成果物の直接作成（これらはチームメイトに委任する）

## 開発時のルール
プラグインのマニフェストは .claude-plugin/plugin.json に配置すること。

メインの AI（Team Lead）の指示書は skills/lead/SKILL.md に記述すること。

よく使う役割と必須役割（Scaffolding）の MBR テンプレートは skills/lead/roles/ に分離管理すること。ただし「Scaffolding の必須性」は本ファイル・SKILL.md §1 に規範として残し、役割ファイル側は雛形の提供のみを担う。

役割を静的に固定せず、動的編成（Teaming on the fly）を前提としたプロンプト構造を維持すること。

ただし、「レッドチームによる批判的検証」「品質管理者による最終確認」「ファイル競合の回避」「チームメイト管理権限の Team Lead 一本化（全チームメイトは Task でのチームメイト起動・shutdown_request 送信・TeamDelete 呼び出しを禁止）」といった、チームが崩壊しないための「最低限の足場（Scaffolding）」に関するガイドラインは決して削除・緩和しないこと。
