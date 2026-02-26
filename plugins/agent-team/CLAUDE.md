# agent-team プラグイン開発ガイドライン
## プロジェクト概要
このプラグインは、Claude Code の **Agent Teams API**（TeamCreate / SendMessage）を活用し、課題の性質に合わせて動的に最適なチーム（最大10名：Leader 1名＋メンバー最大9名）を編成する「チーム・オブ・チームズ」型の AI オーケストレーションツールです。

## Leader の役割

**Leader（オーケストレーター）**: チーム全体を統括する。TeamCreate・ワークスペース作成・課題分析・チーム編成案作成（MBR プロンプト含む）・全チームメイトの起動（Task）・タスク管理・SendMessage によるチームメイト連携・進捗監視・結果集約・worktree ブランチの統合（git merge）・シャットダウン（shutdown_request）・TeamDelete・最終報告を担う。

**Leader がやらないこと**: 深い技術調査、実装作業、成果物の直接作成（これらはチームメイトに委任する）

## 開発時のルール
プラグインのマニフェストは .claude-plugin/plugin.json に配置すること。

メインのAI（オーケストレーター）の指示書は skills/orchestrator/SKILL.md に記述すること。

役割を静的に固定せず、動的編成（Teaming on the fly）を前提としたプロンプト構造を維持すること。

ただし、「レッドチームによる批判的検証」「品質管理者による最終確認」「ファイル競合の回避」「チームメイト管理権限の Leader 一本化（全チームメイトは Task でのチームメイト起動・shutdown_request 送信・TeamDelete 呼び出しを禁止）」といった、チームが崩壊しないための「最低限の足場（Scaffolding）」に関するガイドラインは決して削除・緩和しないこと。
