# agent-team プラグイン開発ガイドライン
## プロジェクト概要
このプラグインは、Claude Code の **Agent Teams API**（TeamCreate / SendMessage）を活用し、課題の性質に合わせて動的に最適なチーム（Team Lead 1 名＋チームメイト最大 9 名 = 総勢最大 10 名）を編成する「チーム・オブ・チームズ」型のマルチエージェント協調プラグインです。

## Team Lead の役割

**Team Lead**: チーム全体を統括する。TeamCreate・ワークスペース作成・課題分析・チーム編成案作成（MBR プロンプト含む）・全チームメイトの起動（Task）・タスク管理・Chief of Staff を通じたチーム運営・戦略的判断（スコープ変更・重大リスク）・シャットダウン（shutdown_request）・TeamDelete・最終報告のレビュー・提出を担う。メンバーとの運用的連携・成果物集約・worktree マージ実行・最終報告ドラフト作成は Chief of Staff に委任。CoS は運用判断を自律的に行い、Team Lead には要約報告のみ行う。

**Team Lead がやらないこと**: 深い技術調査、実装作業、成果物の直接作成（これらはチームメイトに委任する）

## 開発時のルール
プラグインのマニフェストは .claude-plugin/plugin.json に配置すること。

メインの AI（Team Lead）の指示書は skills/lead/SKILL.md に記述すること。

よく使う役割と必須役割（Scaffolding）の MBR テンプレートは skills/lead/roles/ に分離管理すること。ただし「Scaffolding の必須性」は本ファイル・SKILL.md §1 に規範として残し、役割ファイル側は雛形の提供のみを担う。

役割を静的に固定せず、動的編成（Teaming on the fly）を前提としたプロンプト構造を維持すること。

ただし、以下の Scaffolding **機能**（チームが崩壊しないための最低限の足場）は常にチーム内に存在させること。役割（ロール）単位の例外は SKILL.md §2 の「役割省略の例外」の範囲で認めるが、機能自体の削除・緩和は不可とする。

- **批判的検証機能**（既定は Red-Team が担当。純粋な調査・ドキュメントタスクでは QA-Manager に統合可）
- **最終品質確認機能**（QA-Manager が担当）
- **ファイル競合の回避**（実装系は `isolation: "worktree"` 必須）
- **チームメイト管理権限の Team Lead 一本化**（全チームメイトは Task でのチームメイト起動・`shutdown_request` 送信・`TeamDelete` 呼び出しを禁止）
