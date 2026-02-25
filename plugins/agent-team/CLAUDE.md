# agent-team プラグイン開発ガイドライン
## プロジェクト概要
このプラグインは、Claude Code の **Agent Teams API**（TeamCreate / SendMessage）を活用し、課題の性質に合わせて動的に最適なチーム（最大10名：Leader 1名＋Sub-Leader 1名＋メンバー最大8名）を編成する「チーム・オブ・チームズ」型の AI オーケストレーションツールです。

## Leader / Sub-Leader の役割分離

**Leader（ファシリテーター）**: ユーザーとチームの橋渡し役に特化。TeamCreate・ワークスペース作成・Sub-Leader 起動・ユーザーへの提示・承認伝達・最終報告・クリーンアップを担う。課題分析・チーム編成・チームメイトへの直接指示は行わない。

**Sub-Leader**: チーム運営を全面的に担う。課題分析・チーム編成設計・チームメイト起動・タスク管理・SendMessage によるチームメイト連携・Red-Team/QA-Manager の起動と管理・結果集約・Leader への最終報告を担う。

## 開発時のルール
プラグインのマニフェストは .claude-plugin/plugin.json に配置すること。

メインのAI（オーケストレーター）の指示書は skills/orchestrator/SKILL.md に記述すること。

役割を静的に固定せず、動的編成（Teaming on the fly）を前提としたプロンプト構造を維持すること。

ただし、「Sub-Leader の必須化」「レッドチームによる批判的検証」「品質管理者による最終確認」「ファイル競合の回避」といった、チームが崩壊しないための「最低限の足場（Scaffolding）」に関するガイドラインは決して削除・緩和しないこと。
